import assert from 'node:assert';
import http from 'node:http';
import crypto from 'node:crypto';

// Ensure SSL and connection timeout for cloud Postgres pooler
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('sslmode')) {
  process.env.DATABASE_URL = `${process.env.DATABASE_URL}${process.env.DATABASE_URL.includes('?') ? '&' : '?'}sslmode=require&connect_timeout=30`;
}

import app from '../app.js';
import { prisma } from '../config/prisma.js';
import { generateAccessToken } from '../utils/auth.js';
import { Role, Prisma } from '@prisma/client';
import { EnquiryService } from '../services/enquiryService.js';

console.log('================================================================');
console.log('--- RUNNING PAGINATION & ENQUIRY TICKET RELIABILITY TESTS ---');
console.log('================================================================\n');

const runId = crypto.randomBytes(4).toString('hex');

// Workspaces
const wsAId = crypto.randomUUID();
const wsBId = crypto.randomUUID();

// Users
const userOwnerAId = crypto.randomUUID();
const userOwnerBId = crypto.randomUUID();

let server: http.Server;
let baseUrl: string;

let tokenOwnerA: string;
let tokenOwnerB: string;

async function request(options: {
  method: string;
  path: string;
  token?: string;
  workspaceId?: string;
  body?: any;
}): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, baseUrl);
    const postData = options.body ? JSON.stringify(options.body) : '';

    const req = http.request(
      url,
      {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
          ...(options.workspaceId ? { 'x-workspace-id': options.workspaceId } : {}),
        },
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsed: any;
          try {
            parsed = JSON.parse(rawData);
          } catch {
            parsed = rawData;
          }
          resolve({ status: res.statusCode || 0, body: parsed, headers: res.headers });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function setup() {
  await prisma.workspace.create({
    data: { id: wsAId, name: `Alpha Corp ${runId}`, slug: `alpha-${runId}`, currency: 'USD' },
  });
  await prisma.workspace.create({
    data: { id: wsBId, name: `Beta Corp ${runId}`, slug: `beta-${runId}`, currency: 'USD' },
  });

  await prisma.user.createMany({
    data: [
      { id: userOwnerAId, email: `owner.a.${runId}@test.com`, name: 'Owner A' },
      { id: userOwnerBId, email: `owner.b.${runId}@test.com`, name: 'Owner B' },
    ],
  });

  await prisma.workspaceMember.createMany({
    data: [
      { workspaceId: wsAId, userId: userOwnerAId, role: Role.OWNER },
      { workspaceId: wsBId, userId: userOwnerBId, role: Role.OWNER },
    ],
  });

  tokenOwnerA = generateAccessToken({ userId: userOwnerAId, email: `owner.a.${runId}@test.com` });
  tokenOwnerB = generateAccessToken({ userId: userOwnerBId, email: `owner.b.${runId}@test.com` });

  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
}

async function teardown() {
  if (server) {
    await new Promise((res) => server.close(res));
  }
  try {
    await prisma.enquiry.deleteMany({ where: { workspaceId: { in: [wsAId, wsBId] } } });
    await prisma.customer.deleteMany({ where: { workspaceId: { in: [wsAId, wsBId] } } });
    await prisma.lead.deleteMany({ where: { workspaceId: { in: [wsAId, wsBId] } } });
    await prisma.notification.deleteMany({ where: { workspaceId: { in: [wsAId, wsBId] } } });
    await prisma.workspaceMember.deleteMany({ where: { workspaceId: { in: [wsAId, wsBId] } } });
    await prisma.workspace.deleteMany({ where: { id: { in: [wsAId, wsBId] } } });
    await prisma.user.deleteMany({
      where: { id: { in: [userOwnerAId, userOwnerBId] } },
    });
  } catch (err) {
    console.error('Teardown cleanup error:', err);
  }
}

async function runTests() {
  let passedCount = 0;
  let totalCount = 0;

  const test = async (name: string, fn: () => Promise<void>) => {
    totalCount++;
    try {
      await fn();
      console.log(`  ✓ PASS [${totalCount}]: ${name}`);
      passedCount++;
    } catch (err: any) {
      console.error(`  ✗ FAIL [${totalCount}]: ${name}`);
      console.error(err);
      throw err;
    }
  };

  await setup();

  try {
    console.log('--- 1. SERVER-SIDE PAGINATION VALIDATION & BOUNDARY TESTS ---');

    // Seed 25 leads in Workspace A
    const leadDataA = Array.from({ length: 25 }, (_, i) => ({
      workspaceId: wsAId,
      name: `Lead Alpha ${String(i + 1).padStart(2, '0')}`,
      company: `Company ${i + 1}`,
      email: `lead${i + 1}.${runId}@alpha.com`,
      value: (i + 1) * 1000,
      status: 'NEW' as const,
      source: 'WEBSITE' as const,
    }));
    await prisma.lead.createMany({ data: leadDataA });

    // Seed 5 leads in Workspace B to test isolation
    const leadDataB = Array.from({ length: 5 }, (_, i) => ({
      workspaceId: wsBId,
      name: `Lead Beta ${i + 1}`,
      company: `Beta Co ${i + 1}`,
      email: `lead${i + 1}.${runId}@beta.com`,
      value: 5000,
      status: 'NEW' as const,
    }));
    await prisma.lead.createMany({ data: leadDataB });

    await test('First page returns correct take and total metadata', async () => {
      const res = await request({
        method: 'GET',
        path: '/api/leads?page=1&limit=10',
        token: tokenOwnerA,
        workspaceId: wsAId,
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.length, 10);
      assert.strictEqual(res.body.pagination.page, 1);
      assert.strictEqual(res.body.pagination.limit, 10);
      assert.strictEqual(res.body.pagination.total, 25);
      assert.strictEqual(res.body.pagination.totalPages, 3);
    });

    await test('Middle page returns expected slice', async () => {
      const res = await request({
        method: 'GET',
        path: '/api/leads?page=2&limit=10',
        token: tokenOwnerA,
        workspaceId: wsAId,
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.length, 10);
      assert.strictEqual(res.body.pagination.page, 2);
    });

    await test('Final page returns remainder records', async () => {
      const res = await request({
        method: 'GET',
        path: '/api/leads?page=3&limit=10',
        token: tokenOwnerA,
        workspaceId: wsAId,
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.length, 5); // 25 total - 20 = 5
      assert.strictEqual(res.body.pagination.page, 3);
      assert.strictEqual(res.body.pagination.total, 25);
    });

    await test('Page beyond totalPages returns empty data array with valid pagination', async () => {
      const res = await request({
        method: 'GET',
        path: '/api/leads?page=4&limit=10',
        token: tokenOwnerA,
        workspaceId: wsAId,
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.length, 0);
      assert.strictEqual(res.body.pagination.page, 4);
      assert.strictEqual(res.body.pagination.total, 25);
      assert.strictEqual(res.body.pagination.totalPages, 3);
    });

    await test('Invalid/negative page is safely clamped to page 1', async () => {
      const res = await request({
        method: 'GET',
        path: '/api/leads?page=-5&limit=10',
        token: tokenOwnerA,
        workspaceId: wsAId,
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.pagination.page, 1);
    });

    await test('Page 0 is clamped to page 1', async () => {
      const res = await request({
        method: 'GET',
        path: '/api/leads?page=0&limit=10',
        token: tokenOwnerA,
        workspaceId: wsAId,
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.pagination.page, 1);
    });

    await test('Invalid page string text defaults to page 1', async () => {
      const res = await request({
        method: 'GET',
        path: '/api/leads?page=abc&limit=10',
        token: tokenOwnerA,
        workspaceId: wsAId,
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.pagination.page, 1);
    });

    await test('Limit 0 is clamped to limit 1', async () => {
      const res = await request({
        method: 'GET',
        path: '/api/leads?page=1&limit=0',
        token: tokenOwnerA,
        workspaceId: wsAId,
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.pagination.limit, 1);
      assert.strictEqual(res.body.data.length, 1);
    });

    await test('Negative limit is clamped to limit 1', async () => {
      const res = await request({
        method: 'GET',
        path: '/api/leads?page=1&limit=-10',
        token: tokenOwnerA,
        workspaceId: wsAId,
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.pagination.limit, 1);
    });

    await test('Limit above 100 is capped at 100', async () => {
      const res = await request({
        method: 'GET',
        path: '/api/leads?page=1&limit=5000',
        token: tokenOwnerA,
        workspaceId: wsAId,
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.pagination.limit, 100);
    });

    await test('Invalid limit text defaults to 20', async () => {
      const res = await request({
        method: 'GET',
        path: '/api/leads?page=1&limit=xyz',
        token: tokenOwnerA,
        workspaceId: wsAId,
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.pagination.limit, 20);
    });

    await test('Pagination preserves workspace isolation across pages', async () => {
      // Query Workspace B leads
      const resB = await request({
        method: 'GET',
        path: '/api/leads?page=1&limit=10',
        token: tokenOwnerB,
        workspaceId: wsBId,
      });

      assert.strictEqual(resB.status, 200);
      assert.strictEqual(resB.body.pagination.total, 5);
      assert.strictEqual(resB.body.data.length, 5);
      // Ensure zero Workspace A leads are present in Workspace B
      for (const lead of resB.body.data) {
        assert.match(lead.name, /Lead Beta/);
      }
    });

    console.log('\n--- 2. RELIABLE ENQUIRY TICKET NUMBER GENERATION TESTS ---');

    await test('Normal enquiry creation generates TICK- prefix and persists', async () => {
      const res = await request({
        method: 'POST',
        path: '/api/enquiries',
        token: tokenOwnerA,
        workspaceId: wsAId,
        body: {
          subject: 'Billing Inactivity Question',
          customerName: 'Alice Green',
          customerEmail: `alice.${runId}@test.com`,
          description: 'Questions regarding invoice line item breakdown.',
        },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.match(res.body.data.ticketNumber, /^TICK-[A-Z0-9]+-[A-Z0-9]+$/);

      const dbCheck = await prisma.enquiry.findUnique({ where: { id: res.body.data.id } });
      assert.ok(dbCheck, 'Enquiry must be in database');
      assert.strictEqual(dbCheck.ticketNumber, res.body.data.ticketNumber);
    });

    await test('Ten concurrent enquiry creation requests in same workspace all receive unique ticket numbers', async () => {
      const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
        request({
          method: 'POST',
          path: '/api/enquiries',
          token: tokenOwnerA,
          workspaceId: wsAId,
          body: {
            subject: `Concurrent Ticket Inquiry #${i + 1}`,
            customerName: `Client ${i + 1}`,
            customerEmail: `client${i + 1}.${runId}@concurrent.test`,
            description: `Automated concurrency verification item ${i + 1}`,
          },
        })
      );

      const results = await Promise.all(concurrentRequests);
      const ticketNumbers = new Set<string>();

      for (const res of results) {
        assert.strictEqual(res.status, 201, `Every concurrent request must succeed: ${JSON.stringify(res.body)}`);
        assert.strictEqual(res.body.success, true);
        assert.ok(res.body.data.ticketNumber);
        ticketNumbers.add(res.body.data.ticketNumber);
      }

      assert.strictEqual(ticketNumbers.size, 10, 'All 10 generated ticket numbers must be distinct');
    });

    await test('Ticket creation succeeds after deleting an existing enquiry (no collision)', async () => {
      // Create an enquiry
      const enq = await prisma.enquiry.create({
        data: {
          workspaceId: wsAId,
          ticketNumber: `TICK-TARGET-${runId}`,
          subject: 'Temporary Ticket for Deletion Test',
          customerName: 'Delete Me',
          customerEmail: `del.${runId}@test.com`,
          description: 'To be deleted',
        },
      });

      // Delete the enquiry
      await prisma.enquiry.delete({ where: { id: enq.id } });

      // Create new enquiry
      const res = await request({
        method: 'POST',
        path: '/api/enquiries',
        token: tokenOwnerA,
        workspaceId: wsAId,
        body: {
          subject: 'Post Deletion Ticket Creation',
          customerName: 'Post Del Contact',
          customerEmail: `postdel.${runId}@test.com`,
          description: 'Ensuring ticket generation works cleanly after row deletion.',
        },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.match(res.body.data.ticketNumber, /^TICK-[A-Z0-9]+-[A-Z0-9]+$/);
    });

    await test('Explicit custom ticket number is accepted when unique', async () => {
      const customNum = `TICK-CUSTOM-${runId}`;
      const res = await request({
        method: 'POST',
        path: '/api/enquiries',
        token: tokenOwnerA,
        workspaceId: wsAId,
        body: {
          ticketNumber: customNum,
          subject: 'Custom Ticket Test',
          customerName: 'Custom Contact',
          customerEmail: `custom.${runId}@test.com`,
          description: 'Testing caller-supplied ticket numbers.',
        },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.data.ticketNumber, customNum);
    });

    await test('Duplicate explicit custom ticket number returns 409 Conflict', async () => {
      const customNum = `TICK-CUSTOM-${runId}`;
      const res = await request({
        method: 'POST',
        path: '/api/enquiries',
        token: tokenOwnerA,
        workspaceId: wsAId,
        body: {
          ticketNumber: customNum, // Duplicate
          subject: 'Duplicate Ticket Test',
          customerName: 'Dupe Contact',
          customerEmail: `dupe.${runId}@test.com`,
          description: 'Should return 409 conflict.',
        },
      });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /already exists in this workspace/i);
    });

    await test('Decimal and partial numeric query strings are safely rejected/defaulted', async () => {
      // Test decimal page
      const resDecPage = await request({
        method: 'GET',
        path: '/api/leads?page=1.5&limit=10',
        token: tokenOwnerA,
        workspaceId: wsAId,
      });
      assert.strictEqual(resDecPage.status, 200);
      assert.strictEqual(resDecPage.body.pagination.page, 1);

      // Test partial string page e.g. "12abc"
      const resPartialPage = await request({
        method: 'GET',
        path: '/api/leads?page=12abc&limit=10',
        token: tokenOwnerA,
        workspaceId: wsAId,
      });
      assert.strictEqual(resPartialPage.status, 200);
      assert.strictEqual(resPartialPage.body.pagination.page, 1);

      // Test decimal limit
      const resDecLimit = await request({
        method: 'GET',
        path: '/api/leads?page=1&limit=5.5',
        token: tokenOwnerA,
        workspaceId: wsAId,
      });
      assert.strictEqual(resDecLimit.status, 200);
      assert.strictEqual(resDecLimit.body.pagination.limit, 20);

      // Test partial string limit e.g. "10xyz"
      const resPartialLimit = await request({
        method: 'GET',
        path: '/api/leads?page=1&limit=10xyz',
        token: tokenOwnerA,
        workspaceId: wsAId,
      });
      assert.strictEqual(resPartialLimit.status, 200);
      assert.strictEqual(resPartialLimit.body.pagination.limit, 20);
    });

    await test('Unsafe integer pagination inputs (> MAX_SAFE_INTEGER, Infinity) return 400 validation error', async () => {
      // Test across leads
      const resBigLead = await request({
        method: 'GET',
        path: '/api/leads?page=99999999999999999999999999&limit=10',
        token: tokenOwnerA,
        workspaceId: wsAId,
      });
      assert.strictEqual(resBigLead.status, 400);
      assert.strictEqual(resBigLead.body.success, false);
      assert.match(resBigLead.body.message, /safe/i);

      // Test across customers
      const resBigCustomer = await request({
        method: 'GET',
        path: '/api/customers?page=99999999999999999999999999&limit=10',
        token: tokenOwnerA,
        workspaceId: wsAId,
      });
      assert.strictEqual(resBigCustomer.status, 400);
      assert.strictEqual(resBigCustomer.body.success, false);
      assert.match(resBigCustomer.body.message, /safe/i);

      // Test across enquiries
      const resBigEnquiry = await request({
        method: 'GET',
        path: '/api/enquiries?page=99999999999999999999999999&limit=10',
        token: tokenOwnerA,
        workspaceId: wsAId,
      });
      assert.strictEqual(resBigEnquiry.status, 400);
      assert.strictEqual(resBigEnquiry.body.success, false);
      assert.match(resBigEnquiry.body.message, /safe/i);

      // Non-digit input like Infinity defaults safely
      const resInf = await request({
        method: 'GET',
        path: '/api/leads?page=Infinity&limit=Infinity',
        token: tokenOwnerA,
        workspaceId: wsAId,
      });
      assert.strictEqual(resInf.status, 200);
      assert.strictEqual(resInf.body.pagination.page, 1);
      assert.strictEqual(resInf.body.pagination.limit, 20);
    });

    await test('Calculated unsafe offset ((page - 1) * limit > MAX_SAFE_INTEGER) returns 400 validation error', async () => {
      // Choose page such that (page - 1) * 100 > Number.MAX_SAFE_INTEGER (9007199254740991)
      // page = 9007199254740990, limit = 100 -> (page - 1) * 100 = 900719925474098900 > MAX_SAFE_INTEGER
      const unsafePage = '9007199254740990';
      const endpoints = ['/api/leads', '/api/customers', '/api/enquiries'];

      for (const endpoint of endpoints) {
        const res = await request({
          method: 'GET',
          path: `${endpoint}?page=${unsafePage}&limit=100`,
          token: tokenOwnerA,
          workspaceId: wsAId,
        });
        assert.strictEqual(res.status, 400, `Endpoint ${endpoint} must reject unsafe offset with 400`);
        assert.strictEqual(res.body.success, false);
        assert.match(res.body.message, /safe/i);
      }
    });

    await test('Safe page and limit combination produces 200 OK and valid offset calculation', async () => {
      const endpoints = [
        { path: '/api/leads?page=2&limit=5', key: 'leads' },
        { path: '/api/customers?page=1&limit=10', key: 'customers' },
        { path: '/api/enquiries?page=1&limit=10', key: 'enquiries' },
      ];

      for (const ep of endpoints) {
        const res = await request({
          method: 'GET',
          path: ep.path,
          token: tokenOwnerA,
          workspaceId: wsAId,
        });
        assert.strictEqual(res.status, 200, `Endpoint ${ep.path} must succeed with 200`);
        assert.strictEqual(res.body.success, true);
        assert.ok(res.body.pagination);
      }
    });

    await test('Concurrent requests using identical custom ticket number cannot create duplicates and return 409', async () => {
      const sharedCustomTicket = `TICK-CONCURRENT-DUP-${runId}`;
      const concurrentReqs = Array.from({ length: 4 }, (_, i) =>
        request({
          method: 'POST',
          path: '/api/enquiries',
          token: tokenOwnerA,
          workspaceId: wsAId,
          body: {
            ticketNumber: sharedCustomTicket,
            subject: `Concurrent Custom Ticket Attempt #${i + 1}`,
            customerName: `Contact ${i + 1}`,
            customerEmail: `concurrent.custom${i + 1}.${runId}@test.com`,
            description: 'Testing concurrent race condition on explicit custom ticket.',
          },
        })
      );

      const responses = await Promise.all(concurrentReqs);
      const successResponses = responses.filter((r) => r.status === 201);
      const conflictResponses = responses.filter((r) => r.status === 409);

      assert.strictEqual(successResponses.length, 1, 'Exactly one concurrent request must succeed');
      assert.strictEqual(conflictResponses.length, 3, 'All other concurrent requests must receive 409 Conflict');
      for (const conf of conflictResponses) {
        assert.match(conf.body.message, /already exists in this workspace/i);
      }
    });

    await test('Generated ticket collision triggers retry and succeeds within 3 attempts', async () => {
      const originalGenerate = EnquiryService.generateTicketNumber;
      let callCount = 0;
      const collisionTicket = `TICK-COLLISION-SEED-${runId}`;

      // Pre-seed an enquiry with this exact ticket number in wsAId
      await prisma.enquiry.create({
        data: {
          workspaceId: wsAId,
          ticketNumber: collisionTicket,
          subject: 'Collision Target',
          customerName: 'Seed Contact',
          customerEmail: `seed.${runId}@test.com`,
          description: 'Seed for collision retry test',
        },
      });

      // Mock generateTicketNumber to return collisionTicket on 1st call, then normal unique on 2nd call
      EnquiryService.generateTicketNumber = () => {
        callCount++;
        if (callCount === 1) {
          return collisionTicket; // Will trigger P2002 on [workspaceId, ticketNumber]
        }
        return `TICK-RETRY-OK-${runId}-${callCount}`;
      };

      try {
        const created = await EnquiryService.createEnquiry(wsAId, {
          subject: 'Retry Test Enquiry',
          customerName: 'Retry Caller',
          customerEmail: `retry.${runId}@test.com`,
          description: 'Testing retry mechanism on auto-generated ticket collision',
        });

        assert.strictEqual(callCount, 2, 'Must have retried after initial collision');
        assert.strictEqual(created.ticketNumber, `TICK-RETRY-OK-${runId}-2`);
      } finally {
        EnquiryService.generateTicketNumber = originalGenerate;
      }
    });

    await test('Three failed ticket generation attempts produce controlled 500 error', async () => {
      const originalGenerate = EnquiryService.generateTicketNumber;
      let callCount = 0;
      const persistentCollision = `TICK-EXHAUST-SEED-${runId}`;

      // Pre-seed an enquiry with this exact ticket number
      await prisma.enquiry.create({
        data: {
          workspaceId: wsAId,
          ticketNumber: persistentCollision,
          subject: 'Persistent Collision Target',
          customerName: 'Seed Contact',
          customerEmail: `exhaust.${runId}@test.com`,
          description: 'Seed for retry exhaustion test',
        },
      });

      // Always return the collided ticket
      EnquiryService.generateTicketNumber = () => {
        callCount++;
        return persistentCollision;
      };

      try {
        await assert.rejects(
          async () => {
            await EnquiryService.createEnquiry(wsAId, {
              subject: 'Exhaustion Test Enquiry',
              customerName: 'Exhaustion Caller',
              customerEmail: `exhaust.caller.${runId}@test.com`,
              description: 'Should exhaust 3 retries and throw controlled error',
            });
          },
          (err: any) => {
            assert.strictEqual(err.statusCode, 500);
            assert.match(err.message, /failed to generate a unique ticket number after multiple attempts/i);
            return true;
          }
        );

        assert.strictEqual(callCount, 3, 'Must have attempted exactly 3 times before failing');
      } finally {
        EnquiryService.generateTicketNumber = originalGenerate;
      }
    });

    await test('Unrelated Prisma P2002 error is not retried or misclassified', async () => {
      const originalGenerate = EnquiryService.generateTicketNumber;
      let callCount = 0;

      // Mock prisma.enquiry.create to throw a P2002 with target NOT containing ticketNumber
      const originalCreate = prisma.enquiry.create;
      EnquiryService.generateTicketNumber = () => {
        callCount++;
        return `TICK-UNRELATED-ERR-${runId}`;
      };

      (prisma.enquiry as any).create = async () => {
        // Simulate an unrelated unique constraint error (e.g. on another table or column)
        const p2002Err = new (Prisma as any).PrismaClientKnownRequestError(
          'Unique constraint failed on the fields: (`workspaceId`, `email`)',
          {
            code: 'P2002',
            clientVersion: '6.19.3',
            meta: { target: ['workspaceId', 'email'] }, // Not ticketNumber!
          }
        );
        throw p2002Err;
      };

      try {
        await assert.rejects(
          async () => {
            await EnquiryService.createEnquiry(wsAId, {
              subject: 'Unrelated Constraint Test',
              customerName: 'Unrelated Caller',
              customerEmail: `unrelated.${runId}@test.com`,
              description: 'Should rethrow immediately without retrying',
            });
          },
          (err: any) => {
            assert.strictEqual(err.code, 'P2002');
            return true;
          }
        );

        assert.strictEqual(callCount, 1, 'Must NOT retry when P2002 is on an unrelated constraint');
      } finally {
        EnquiryService.generateTicketNumber = originalGenerate;
        (prisma.enquiry as any).create = originalCreate;
      }
    });

    console.log(`\n================================================================`);
    console.log(`--- ALL ${passedCount}/${totalCount} PAGINATION & TICKET TESTS PASSED CLEANLY ---`);
    console.log(`================================================================\n`);
  } finally {
    await teardown();
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
