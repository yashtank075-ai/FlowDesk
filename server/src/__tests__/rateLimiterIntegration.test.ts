import assert from 'node:assert';
import rateLimit from 'express-rate-limit';
import { userOrIpKeyGenerator } from '../middleware/rateLimiter.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

function executeMiddleware(middleware: any, req: any): Promise<{ statusCode: number; headers: Record<string, any>; body: any }> {
  return new Promise((resolve) => {
    let statusCode = 200;
    const headers: Record<string, any> = {};
    let sentBody: any = null;

    const res: any = {
      statusCode: 200,
      status(code: number) {
        statusCode = code;
        return res;
      },
      setHeader(name: string, val: any) {
        headers[name.toLowerCase()] = String(val);
        return res;
      },
      getHeader(name: string) {
        return headers[name.toLowerCase()];
      },
      json(body: any) {
        sentBody = body;
        resolve({ statusCode, headers, body: sentBody });
        return res;
      },
      send(body: any) {
        sentBody = body;
        resolve({ statusCode, headers, body: sentBody });
        return res;
      },
    };

    const next = (err?: any) => {
      if (err) {
        resolve({ statusCode: 500, headers, body: err });
      } else {
        resolve({ statusCode: 200, headers, body: { success: true } });
      }
    };

    middleware(req, res, next);
  });
}

async function runDirectIntegrationTests() {
  console.log('--- DIRECT IN-MEMORY INTEGRATION TESTS FOR RATE LIMITER ---');

  // Test limiter configured identically to apiLimiter, 3 request quota
  const testLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: userOrIpKeyGenerator,
    message: {
      success: false,
      error: 'Rate limit exceeded. Too many requests. Please wait a moment before trying again.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  });

  // Test 1: User A makes requests up to quota
  const reqUserA = {
    user: { userId: 'usr_alice_111', email: 'alice@test.com' },
    ip: '203.0.113.10',
    headers: {},
  } as unknown as AuthenticatedRequest;

  console.log('Simulating 3 requests from User A...');
  for (let i = 1; i <= 3; i++) {
    const res = await executeMiddleware(testLimiter, reqUserA);
    assert.strictEqual(res.statusCode, 200, `User A request ${i} must succeed`);
    assert.strictEqual(res.headers['ratelimit-remaining'], String(3 - i));
  }
  console.log('✓ PASS: User A successfully processed within quota, remaining header decremented');

  // Test 2: User A's 4th request exceeds quota -> 429
  console.log('Simulating 4th request from User A...');
  const resExceededA = await executeMiddleware(testLimiter, reqUserA);
  assert.strictEqual(resExceededA.statusCode, 429, 'User A 4th request must return 429');
  assert.strictEqual(resExceededA.body.code, 'RATE_LIMIT_EXCEEDED');
  assert.ok(resExceededA.headers['ratelimit-reset'] !== undefined, 'Must emit ratelimit-reset');
  console.log('✓ PASS: User A 4th request rejected with HTTP 429 RATE_LIMIT_EXCEEDED and reset headers');

  // Test 3: User B on the EXACT SAME IP ('203.0.113.10')
  console.log('Simulating User B on SAME IP as User A...');
  const reqUserB = {
    user: { userId: 'usr_bob_222', email: 'bob@test.com' },
    ip: '203.0.113.10',
    headers: {},
  } as unknown as AuthenticatedRequest;

  const resUserB = await executeMiddleware(testLimiter, reqUserB);
  assert.strictEqual(
    resUserB.statusCode,
    200,
    'User B must succeed because User B has an independent user:usr_bob_222 bucket'
  );
  assert.strictEqual(resUserB.headers['ratelimit-remaining'], '2');
  console.log('✓ PASS: User B on identical IP has separate bucket and is NOT throttled');

  // Test 4: Unauthenticated IP fallback
  console.log('Simulating unauthenticated requests from IP 198.51.100.5...');
  const reqIp1 = {
    ip: '198.51.100.5',
    headers: {},
  } as unknown as AuthenticatedRequest;

  for (let i = 1; i <= 3; i++) {
    const res = await executeMiddleware(testLimiter, reqIp1);
    assert.strictEqual(res.statusCode, 200);
  }
  const resIp1Throttled = await executeMiddleware(testLimiter, reqIp1);
  assert.strictEqual(resIp1Throttled.statusCode, 429, 'Unauthenticated IP exceeding limit must return 429');
  console.log('✓ PASS: Unauthenticated requests throttled by client IP');

  // Test 5: Different unauthenticated IP gets separate bucket
  console.log('Simulating unauthenticated request from different IP 198.51.100.99...');
  const reqIp2 = {
    ip: '198.51.100.99',
    headers: {},
  } as unknown as AuthenticatedRequest;

  const resIp2 = await executeMiddleware(testLimiter, reqIp2);
  assert.strictEqual(resIp2.statusCode, 200, 'Different IP receives fresh bucket');
  assert.strictEqual(resIp2.headers['ratelimit-remaining'], '2');
  console.log('✓ PASS: Different IP receives fresh unthrottled bucket');

  console.log('--- ALL IN-MEMORY INTEGRATION TESTS PASSED ---');
}

runDirectIntegrationTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
