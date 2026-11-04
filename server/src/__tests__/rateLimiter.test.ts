import assert from 'node:assert';
import { userOrIpKeyGenerator } from '../middleware/rateLimiter.js';

// Test 1: Authenticated user key generator returns user:<id>
const mockAuthReq = {
  user: { userId: 'usr_12345' },
  ip: '192.168.1.1',
};
const authKey = userOrIpKeyGenerator(mockAuthReq as any);
assert.strictEqual(authKey, 'user:usr_12345', 'Should generate user-keyed limit');

// Test 2: Unauthenticated fallback key generator returns IPv4 or IPv6 subnet
const mockIpReq = {
  ip: '203.0.113.195',
};
const ipKey = userOrIpKeyGenerator(mockIpReq as any);
assert.strictEqual(ipKey, '203.0.113.195', 'Should fall back to client IP');

// Test 3: Fallback when req.ip is undefined
const mockEmptyReq = {};
const fallbackKey = userOrIpKeyGenerator(mockEmptyReq as any);
assert.strictEqual(fallbackKey, '127.0.0.1', 'Should fall back to default loopback IP safely');

console.log('✓ ALL RATE LIMITER UNIT TESTS PASSED');
