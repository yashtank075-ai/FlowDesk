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
import { Role } from '@prisma/client';

console.log('================================================================');
console.log('--- RUNNING CRM LIFECYCLE (CONVERSION & DELETION) TESTS ---');
console.log('================================================================\n');

const runId = crypto.randomBytes(4).toString('hex');

// Workspace A (Tenant Alpha)
const wsAId = crypto.randomUUID();
const userOwnerAId = crypto.randomUUID();
const userAdminAId = crypto.randomUUID();
const userMemberAId = crypto.randomUUID();
const userViewerAId = crypto.randomUUID();

// Workspace B (Tenant Beta)
const wsBId = crypto.randomUUID();
const userOwnerBId = crypto.randomUUID();

let server: http.Server;
let baseUrl: string;

let tokenOwnerA: string;
let tokenAdminA: string;
let tokenMemberA: string;
let tokenViewerA: string;
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
  // Create workspaces
  await prisma.workspace.create({
    data: { id: wsAId, name: `Alpha Corp ${runId}`, slug: `alpha-${runId}`, currency: 'USD' },
  });
  await prisma.workspace.create({
    data: { id: wsBId, name: `Beta Corp ${runId}`, slug: `beta-${runId}`, currency: 'USD' },
  });

  // Create users
  await prisma.user.createMany({
    data: [
      { id: userOwnerAId, email: `owner.a.${runId}@test.com`, name: 'Owner A' },
      { id: userAdminAId, email: `admin.a.${runId}@test.com`, name: 'Admin A' },
      { id: userMemberAId, email: `member.a.${runId}@test.com`, name: 'Member A' },
      { id: userViewerAId, email: `viewer.a.${runId}@test.com`, name: 'Viewer A' },
      { id: userOwnerBId, email: `owner.b.${runId}@test.com`, name: 'Owner B' },
    ],
  });

  // Memberships
  await prisma.workspaceMember.createMany({
    data: [
      { workspaceId: wsAId, userId: userOwnerAId, role: Role.OWNER },
      { workspaceId: wsAId, userId: userAdminAId, role: Role.ADMIN },
      { workspaceId: wsAId, userId: userMemberAId, role: Role.MEMBER },
      { workspaceId: wsAId, userId: userViewerAId, role: Role.VIEWER },
      { workspaceId: wsBId, userId: userOwnerBId, role: Role.OWNER },
    ],
  });

  tokenOwnerA = generateAccessToken({ userId: userOwnerAId, email: `owner.a.${runId}@test.com` });
  tokenAdminA = generateAccessToken({ userId: userAdminAId, email: `admin.a.${runId}@test.com` });
  tokenMemberA = generateAccessToken({ userId: userMemberAId, email: `member.a.${runId}@test.com` });
  tokenViewerA = generateAccessToken({ userId: userViewerAId, email: `viewer.a.${runId}@test.com` });
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
    await prisma.followUp.deleteMany({ where: { workspaceId: { in: [wsAId, wsBId] } } });
    await prisma.customer.deleteMany({ where: { workspaceId: { in: [wsAId, wsBId] } } });
    await prisma.lead.deleteMany({ where: { workspaceId: { in: [wsAId, wsBId] } } });
    await prisma.notification.deleteMany({ where: { workspaceId: { in: [wsAId, wsBId] } } });
    await prisma.workspaceMember.deleteMany({ where: { workspaceId: { in: [wsAId, wsBId] } } });
    await prisma.workspace.deleteMany({ where: { id: { in: [wsAId, wsBId] } } });
    await prisma.user.deleteMany({
      where: { id: { in: [userOwnerAId, userAdminAId, userMemberAId, userViewerAId, userOwnerBId] } },
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
    console.log('--- 1. LEAD CONVERSION WORKFLOW TESTS ---');

    // Create lead in Workspace A
    const lead1 = await prisma.lead.create({
      data: {
        workspaceId: wsAId,
        name: 'Jordan Belfort',
        company: 'Stratton Oakmont',
        email: `jordan.${runId}@stratton.com`,
        phone: '+1-555-0199',
        value: 45000,
        status: 'QUALIFIED',
        assignedTo: 'Mark Hanna',
      },
    });

    await test('Lead conversion succeeds and returns 201 with customer and updated lead', async () => {
      const res = await request({
        method: 'POST',
        path: `/api/leads/${lead1.id}/convert`,
        token: tokenMemberA,
        workspaceId: wsAId,
        body: {
          tier: 'ENTERPRISE',
          mrr: 5000,
        },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.customer.name, 'Jordan Belfort');
      assert.strictEqual(res.body.data.customer.company, 'Stratton Oakmont');
      assert.strictEqual(res.body.data.customer.tier, 'ENTERPRISE');
      assert.strictEqual(Number(res.body.data.customer.mrr), 5000);
      assert.strictEqual(res.body.data.lead.status, 'WON');

      // Verify in DB
      const dbCustomer = await prisma.customer.findFirst({
        where: { workspaceId: wsAId, email: lead1.email },
      });
      assert.ok(dbCustomer, 'Customer record must be persisted in DB');

      const dbLead = await prisma.lead.findUnique({ where: { id: lead1.id } });
      assert.strictEqual(dbLead?.status, 'WON', 'Lead status must be WON in DB');
    });

    await test('Repeated conversion of the same lead fails with 409 Conflict', async () => {
      const res = await request({
        method: 'POST',
        path: `/api/leads/${lead1.id}/convert`,
        token: tokenMemberA,
        workspaceId: wsAId,
        body: {},
      });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /already exists/i);
    });

    await test('Converting a LOST lead is rejected with 400 Bad Request', async () => {
      const lostLead = await prisma.lead.create({
        data: {
          workspaceId: wsAId,
          name: 'Lost Contact',
          company: 'Defunct Corp',
          email: `lost.${runId}@defunct.com`,
          status: 'LOST',
        },
      });

      const res = await request({
        method: 'POST',
        path: `/api/leads/${lostLead.id}/convert`,
        token: tokenOwnerA,
        workspaceId: wsAId,
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /cannot convert a lost lead/i);
    });

    await test('Cross-workspace lead conversion is blocked with 404', async () => {
      const leadB = await prisma.lead.create({
        data: {
          workspaceId: wsBId,
          name: 'Tenant B Contact',
          company: 'Beta Corp',
          email: `betalead.${runId}@betacorp.com`,
          status: 'NEW',
        },
      });

      const res = await request({
        method: 'POST',
        path: `/api/leads/${leadB.id}/convert`,
        token: tokenOwnerA,
        workspaceId: wsAId, // Tenant A attempting to convert Tenant B's lead
      });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
    });

    await test('Unauthorized role (VIEWER) cannot convert leads (403 Forbidden)', async () => {
      const lead2 = await prisma.lead.create({
        data: {
          workspaceId: wsAId,
          name: 'Viewer Lead',
          company: 'Viewer Inc',
          email: `viewerlead.${runId}@viewer.com`,
          status: 'QUALIFIED',
        },
      });

      const res = await request({
        method: 'POST',
        path: `/api/leads/${lead2.id}/convert`,
        token: tokenViewerA,
        workspaceId: wsAId,
      });

      assert.strictEqual(res.status, 403);
    });

    console.log('\n--- 2. CUSTOMER DELETION TESTS ---');

    const customerToDelete = await prisma.customer.create({
      data: {
        workspaceId: wsAId,
        name: 'Delete Target',
        company: 'Target Co',
        email: `target.${runId}@target.com`,
        mrr: 1200,
      },
    });

    await test('Cross-workspace customer deletion is blocked with 404', async () => {
      const res = await request({
        method: 'DELETE',
        path: `/api/customers/${customerToDelete.id}`,
        token: tokenOwnerB,
        workspaceId: wsBId, // Tenant B attempting to delete Tenant A customer
      });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);

      // Verify customer still exists
      const check = await prisma.customer.findUnique({ where: { id: customerToDelete.id } });
      assert.ok(check, 'Customer must not be deleted by cross-workspace request');
    });

    await test('MEMBER cannot delete customer (403 Forbidden)', async () => {
      const res = await request({
        method: 'DELETE',
        path: `/api/customers/${customerToDelete.id}`,
        token: tokenMemberA,
        workspaceId: wsAId,
      });

      assert.strictEqual(res.status, 403);
    });

    await test('ADMIN can delete customer successfully (200 OK)', async () => {
      const res = await request({
        method: 'DELETE',
        path: `/api/customers/${customerToDelete.id}`,
        token: tokenAdminA,
        workspaceId: wsAId,
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);

      // Verify deleted from DB
      const check = await prisma.customer.findUnique({ where: { id: customerToDelete.id } });
      assert.strictEqual(check, null, 'Customer should be deleted from DB');
    });

    await test('Deleting non-existent customer returns 404', async () => {
      const res = await request({
        method: 'DELETE',
        path: `/api/customers/${crypto.randomUUID()}`,
        token: tokenOwnerA,
        workspaceId: wsAId,
      });

      assert.strictEqual(res.status, 404);
    });

    console.log('\n--- 3. FOLLOW-UP DELETION TESTS ---');

    const followUpToDelete = await prisma.followUp.create({
      data: {
        workspaceId: wsAId,
        title: 'Demo Walkthrough',
        contactName: 'Alice',
        contactCompany: 'Wonderland Inc',
        dueDate: new Date(),
        status: 'PENDING',
      },
    });

    await test('Cross-workspace follow-up deletion is blocked with 404', async () => {
      const res = await request({
        method: 'DELETE',
        path: `/api/follow-ups/${followUpToDelete.id}`,
        token: tokenOwnerB,
        workspaceId: wsBId,
      });

      assert.strictEqual(res.status, 404);

      const check = await prisma.followUp.findUnique({ where: { id: followUpToDelete.id } });
      assert.ok(check, 'Follow-up must remain in DB');
    });

    await test('VIEWER cannot delete follow-up (403 Forbidden)', async () => {
      const res = await request({
        method: 'DELETE',
        path: `/api/follow-ups/${followUpToDelete.id}`,
        token: tokenViewerA,
        workspaceId: wsAId,
      });

      assert.strictEqual(res.status, 403);
    });

    await test('OWNER can delete follow-up successfully (200 OK)', async () => {
      const res = await request({
        method: 'DELETE',
        path: `/api/follow-ups/${followUpToDelete.id}`,
        token: tokenOwnerA,
        workspaceId: wsAId,
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);

      const check = await prisma.followUp.findUnique({ where: { id: followUpToDelete.id } });
      assert.strictEqual(check, null, 'Follow-up must be deleted from DB');
    });

    await test('Deleting non-existent follow-up returns 404', async () => {
      const res = await request({
        method: 'DELETE',
        path: `/api/follow-ups/${crypto.randomUUID()}`,
        token: tokenOwnerA,
        workspaceId: wsAId,
      });

      assert.strictEqual(res.status, 404);
    });

    console.log(`\n================================================================`);
    console.log(`--- ALL ${passedCount}/${totalCount} CRM LIFECYCLE TESTS PASSED CLEANLY ---`);
    console.log(`================================================================\n`);
  } finally {
    await teardown();
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
