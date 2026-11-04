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
console.log('--- RUNNING MULTI-TENANT WORKSPACE ISOLATION SECURITY TESTS ---');
console.log('================================================================\n');

// Unique test run identifier
const runId = crypto.randomBytes(4).toString('hex');

// Workspace A (Tenant Alpha)
const wsAId = crypto.randomUUID();
const userOwnerAId = crypto.randomUUID();
const userAdminAId = crypto.randomUUID();
const userViewerAId = crypto.randomUUID();
const leadAId = crypto.randomUUID();
const customerAId = crypto.randomUUID();
const enquiryAId = crypto.randomUUID();
const followUpAId = crypto.randomUUID();

// Workspace B (Tenant Beta)
const wsBId = crypto.randomUUID();
const userOwnerBId = crypto.randomUUID();
const leadBId = crypto.randomUUID();
const customerBId = crypto.randomUUID();
const enquiryBId = crypto.randomUUID();
const followUpBId = crypto.randomUUID();
let memberBId: string = '';

let server: http.Server;
let baseUrl: string;

let tokenOwnerA: string;
let tokenAdminA: string;
let tokenViewerA: string;
let tokenOwnerB: string;

async function cleanupFixtures() {
  try {
    const wsIds = [wsAId, wsBId];
    const userIds = [userOwnerAId, userAdminAId, userViewerAId, userOwnerBId];

    await prisma.followUp.deleteMany({ where: { workspaceId: { in: wsIds } } });
    await prisma.enquiry.deleteMany({ where: { workspaceId: { in: wsIds } } });
    await prisma.customer.deleteMany({ where: { workspaceId: { in: wsIds } } });
    await prisma.lead.deleteMany({ where: { workspaceId: { in: wsIds } } });
    await prisma.activity.deleteMany({ where: { workspaceId: { in: wsIds } } });
    await prisma.notification.deleteMany({ where: { workspaceId: { in: wsIds } } });
    await prisma.workspaceInvitation.deleteMany({ where: { workspaceId: { in: wsIds } } });
    await prisma.workspaceMember.deleteMany({ where: { workspaceId: { in: wsIds } } });
    await prisma.workspace.deleteMany({ where: { id: { in: wsIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  } catch (err) {
    console.error('[Cleanup Warning]', err);
  }
}

async function setupFixtures() {
  console.log('[Setup] Connecting and preparing isolated test workspaces and users...');
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await prisma.$connect();
      break;
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  await cleanupFixtures();

  // 1. Create Workspace A
  await prisma.workspace.create({
    data: {
      id: wsAId,
      name: `Security Alpha Corp ${runId}`,
      slug: `sec-alpha-${runId}`,
      currency: 'USD',
    },
  });

  // 2. Create Workspace B
  await prisma.workspace.create({
    data: {
      id: wsBId,
      name: `Security Beta Corp ${runId}`,
      slug: `sec-beta-${runId}`,
      currency: 'USD',
    },
  });

  // 3. Create Users
  await prisma.user.createMany({
    data: [
      { id: userOwnerAId, email: `owner-a-${runId}@test.local`, name: 'Owner Alpha' },
      { id: userAdminAId, email: `admin-a-${runId}@test.local`, name: 'Admin Alpha' },
      { id: userViewerAId, email: `viewer-a-${runId}@test.local`, name: 'Viewer Alpha' },
      { id: userOwnerBId, email: `owner-b-${runId}@test.local`, name: 'Owner Beta' },
    ],
  });

  // 4. Create Memberships
  await prisma.workspaceMember.createMany({
    data: [
      { workspaceId: wsAId, userId: userOwnerAId, role: Role.OWNER },
      { workspaceId: wsAId, userId: userAdminAId, role: Role.ADMIN },
      { workspaceId: wsAId, userId: userViewerAId, role: Role.VIEWER },
      { workspaceId: wsBId, userId: userOwnerBId, role: Role.OWNER },
    ],
  });

  const memberBRecord = await prisma.workspaceMember.findFirst({
    where: { workspaceId: wsBId, userId: userOwnerBId },
  });
  memberBId = memberBRecord!.id;

  // 5. Seed Workspace A Data
  await prisma.lead.create({
    data: {
      id: leadAId,
      workspaceId: wsAId,
      name: 'Alpha Prospect Lead',
      company: 'Alpha Enterprises',
      email: 'lead@alpha.local',
      value: 12000,
      status: 'QUALIFIED',
    },
  });

  await prisma.customer.create({
    data: {
      id: customerAId,
      workspaceId: wsAId,
      name: 'Alpha Customer Account',
      company: 'Alpha Client LLC',
      email: 'client@alpha.local',
      mrr: 2500,
      status: 'ACTIVE',
    },
  });

  await prisma.enquiry.create({
    data: {
      id: enquiryAId,
      workspaceId: wsAId,
      ticketNumber: `TICK-ALPHA-${runId}`,
      subject: 'Alpha Service Request',
      customerName: 'Alpha Client',
      customerEmail: 'client@alpha.local',
      description: 'Alpha ticket description',
      status: 'OPEN',
    },
  });

  await prisma.followUp.create({
    data: {
      id: followUpAId,
      workspaceId: wsAId,
      title: 'Alpha Follow Up Call',
      contactName: 'Alpha Lead',
      contactCompany: 'Alpha Enterprises',
      dueDate: new Date(Date.now() + 86400000),
      status: 'PENDING',
    },
  });

  // 6. Seed Workspace B Data (Target for isolation tests)
  await prisma.lead.create({
    data: {
      id: leadBId,
      workspaceId: wsBId,
      name: 'Beta Confidential Lead',
      company: 'XENON_SECRET_CORP_999',
      email: 'secret@beta.local',
      value: 500000,
      status: 'NEW',
    },
  });

  await prisma.customer.create({
    data: {
      id: customerBId,
      workspaceId: wsBId,
      name: 'Beta Top Secret Client',
      company: 'Beta Industries',
      email: 'vip@beta.local',
      mrr: 75000,
      status: 'ACTIVE',
    },
  });

  await prisma.enquiry.create({
    data: {
      id: enquiryBId,
      workspaceId: wsBId,
      ticketNumber: `TICK-BETA-${runId}`,
      subject: 'Beta High Priority Incident',
      customerName: 'Beta Client',
      customerEmail: 'vip@beta.local',
      description: 'Beta secret incident',
      status: 'OPEN',
    },
  });

  await prisma.followUp.create({
    data: {
      id: followUpBId,
      workspaceId: wsBId,
      title: 'Beta Executive Meeting',
      contactName: 'Beta Secret Contact',
      contactCompany: 'XENON_SECRET_CORP_999',
      dueDate: new Date(Date.now() + 86400000),
      status: 'PENDING',
    },
  });

  // 7. Generate JWTs
  tokenOwnerA = generateAccessToken({ userId: userOwnerAId, email: `owner-a-${runId}@test.local` });
  tokenAdminA = generateAccessToken({ userId: userAdminAId, email: `admin-a-${runId}@test.local` });
  tokenViewerA = generateAccessToken({ userId: userViewerAId, email: `viewer-a-${runId}@test.local` });
  tokenOwnerB = generateAccessToken({ userId: userOwnerBId, email: `owner-b-${runId}@test.local` });

  // 8. Start ephemeral HTTP server on dynamic port
  server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as any;
  baseUrl = `http://127.0.0.1:${address.port}`;

  console.log(`[Setup] Ephemeral test server ready at ${baseUrl}\n`);
}

async function runAllTests() {
  try {
    await setupFixtures();

    // =========================================================================
    // TEST 1 — Workspace Header Tampering (Tenant Spoofing)
    // =========================================================================
    console.log('--- TEST 1: Workspace Header Tampering (Tenant Spoofing) ---');
    {
      const res = await fetch(`${baseUrl}/api/leads`, {
        headers: {
          Authorization: `Bearer ${tokenOwnerA}`,
          'X-Workspace-Id': wsBId, // User A maliciously claims Workspace B
        },
      });
      const data = (await res.json()) as any;
      assert.strictEqual(res.status, 403, 'Cross-workspace header must return HTTP 403');
      assert.strictEqual(data.success, false);
      assert.ok(data.error?.includes('Access denied'), 'Must return access denied error');
      console.log('✓ PASS: User A spoofing Workspace B in X-Workspace-Id rejected with HTTP 403 Forbidden\n');
    }

    // =========================================================================
    // TEST 2 — Cross-Workspace Lead Read (IDOR)
    // =========================================================================
    console.log('--- TEST 2: Cross-Workspace Lead Read (IDOR) ---');
    {
      const res = await fetch(`${baseUrl}/api/leads/${leadBId}`, {
        headers: {
          Authorization: `Bearer ${tokenOwnerA}`,
          'X-Workspace-Id': wsAId,
        },
      });
      assert.strictEqual(res.status, 404, 'Direct fetch of foreign lead ID must return HTTP 404');
      console.log('✓ PASS: User A attempting to read Workspace B lead returns HTTP 404 Not Found\n');
    }

    // =========================================================================
    // TEST 3 — Cross-Workspace Lead Update
    // =========================================================================
    console.log('--- TEST 3: Cross-Workspace Lead Update ---');
    {
      const res = await fetch(`${baseUrl}/api/leads/${leadBId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenOwnerA}`,
          'X-Workspace-Id': wsAId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'WON', value: 999999 }),
      });
      assert.strictEqual(res.status, 404, 'Mutation of foreign lead ID must return HTTP 404');

      // Verify Workspace B record remains unchanged in database
      const unchanged = await prisma.lead.findUnique({ where: { id: leadBId } });
      assert.strictEqual(unchanged?.status, 'NEW', 'Workspace B lead status must remain unchanged');
      assert.strictEqual(Number(unchanged?.value), 500000, 'Workspace B lead value must remain unchanged');
      console.log('✓ PASS: Cross-workspace lead mutation returns HTTP 404 and record in DB is unmutated\n');
    }

    // =========================================================================
    // TEST 4 — Cross-Workspace Lead Delete
    // =========================================================================
    console.log('--- TEST 4: Cross-Workspace Lead Delete ---');
    {
      const res = await fetch(`${baseUrl}/api/leads/${leadBId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenOwnerA}`,
          'X-Workspace-Id': wsAId,
        },
      });
      assert.strictEqual(res.status, 404, 'Deletion of foreign lead ID must return HTTP 404');

      // Verify Workspace B record still exists in database
      const existing = await prisma.lead.findUnique({ where: { id: leadBId } });
      assert.ok(existing, 'Workspace B lead must still exist in database');
      console.log('✓ PASS: Cross-workspace lead deletion returns HTTP 404 and record is preserved\n');
    }

    // =========================================================================
    // TEST 5 — Cross-Workspace Customer Access (Read & Update)
    // =========================================================================
    console.log('--- TEST 5: Cross-Workspace Customer Access ---');
    {
      // 5a. Read
      const readRes = await fetch(`${baseUrl}/api/customers/${customerBId}`, {
        headers: {
          Authorization: `Bearer ${tokenOwnerA}`,
          'X-Workspace-Id': wsAId,
        },
      });
      assert.strictEqual(readRes.status, 404, 'Read foreign customer must return HTTP 404');

      // 5b. Update
      const updateRes = await fetch(`${baseUrl}/api/customers/${customerBId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenOwnerA}`,
          'X-Workspace-Id': wsAId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ company: 'Malicious Corp' }),
      });
      assert.strictEqual(updateRes.status, 404, 'Update foreign customer must return HTTP 404');

      const customerB = await prisma.customer.findUnique({ where: { id: customerBId } });
      assert.strictEqual(customerB?.company, 'Beta Industries', 'Customer company must remain unmodified');
      console.log('✓ PASS: Foreign customer read and update both return HTTP 404 with zero DB mutation\n');
    }

    // =========================================================================
    // TEST 6 — Global Search Isolation
    // =========================================================================
    console.log('--- TEST 6: Global Search Isolation ---');
    {
      const res = await fetch(`${baseUrl}/api/search?q=XENON_SECRET_CORP_999`, {
        headers: {
          Authorization: `Bearer ${tokenOwnerA}`,
          'X-Workspace-Id': wsAId,
        },
      });
      assert.strictEqual(res.status, 200);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.results.leads.length, 0, 'No Workspace B leads in Workspace A search');
      assert.strictEqual(body.data.results.customers.length, 0, 'No Workspace B customers in search');
      assert.strictEqual(body.data.results.followUps.length, 0, 'No Workspace B follow-ups in search');
      console.log('✓ PASS: Searching unique foreign keyword returns 0 records under Workspace A\n');
    }

    // =========================================================================
    // TEST 7 — Data Export Isolation
    // =========================================================================
    console.log('--- TEST 7: Data Export Isolation ---');
    {
      const res = await fetch(`${baseUrl}/api/export/leads?format=csv`, {
        headers: {
          Authorization: `Bearer ${tokenOwnerA}`,
          'X-Workspace-Id': wsAId,
        },
      });
      assert.strictEqual(res.status, 200);
      const csv = await res.text();
      assert.ok(csv.includes('Alpha Prospect Lead'), 'Export must contain Workspace A lead');
      assert.ok(!csv.includes('Beta Confidential Lead'), 'Export MUST NOT contain Workspace B lead');
      assert.ok(!csv.includes('XENON_SECRET_CORP_999'), 'Export MUST NOT contain Workspace B company');
      console.log('✓ PASS: CSV export contains exclusively Workspace A records without data leakage\n');
    }

    // =========================================================================
    // TEST 8 — AI Insights Isolation
    // =========================================================================
    console.log('--- TEST 8: AI Insights Isolation ---');
    {
      const res = await fetch(`${baseUrl}/api/insights`, {
        headers: {
          Authorization: `Bearer ${tokenOwnerA}`,
          'X-Workspace-Id': wsAId,
        },
      });
      assert.strictEqual(res.status, 200);
      const body = (await res.json()) as any;
      assert.strictEqual(body.success, true);
      // Workspace A has 1 active lead of value 12,000. Workspace B has 500,000.
      assert.strictEqual(body.data.overview.pipelineValue, 12000, 'Pipeline value must reflect only Workspace A');
      assert.strictEqual(body.data.overview.totalActiveLeads, 1, 'Total active leads must reflect only Workspace A');
      assert.ok(!JSON.stringify(body.data).includes('XENON_SECRET_CORP_999'), 'Insights must not leak Workspace B details');
      console.log('✓ PASS: AI Insights metrics and pipeline scores isolated strictly to Workspace A\n');
    }

    // =========================================================================
    // TEST 9 — VIEWER Write Restrictions
    // =========================================================================
    console.log('--- TEST 9: VIEWER Write Restrictions ---');
    {
      // 9a. Lead creation
      const leadRes = await fetch(`${baseUrl}/api/leads`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenViewerA}`,
          'X-Workspace-Id': wsAId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Viewer Unauthorized Lead',
          company: 'Test Co',
          email: 'test@viewer.local',
        }),
      });
      assert.strictEqual(leadRes.status, 403, 'Viewer lead creation must return HTTP 403');

      // 9b. Customer creation
      const custRes = await fetch(`${baseUrl}/api/customers`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenViewerA}`,
          'X-Workspace-Id': wsAId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Viewer Unauthorized Customer',
          company: 'Test Co',
          email: 'test@viewer.local',
        }),
      });
      assert.strictEqual(custRes.status, 403, 'Viewer customer creation must return HTTP 403');

      // 9c. Follow-up creation
      const fuRes = await fetch(`${baseUrl}/api/follow-ups`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenViewerA}`,
          'X-Workspace-Id': wsAId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Viewer Unauthorized FollowUp',
          contactName: 'Test Contact',
          dueDate: new Date().toISOString(),
        }),
      });
      assert.strictEqual(fuRes.status, 403, 'Viewer follow-up creation must return HTTP 403');
      console.log('✓ PASS: VIEWER restricted writes blocked with HTTP 403 Forbidden across leads, customers & follow-ups\n');
    }

    // =========================================================================
    // TEST 10 — Team Invitation and Role Tampering
    // =========================================================================
    console.log('--- TEST 10: Team Invitation and Role Tampering ---');
    {
      // 10a. Admin attempts to invite an OWNER
      const inviteRes = await fetch(`${baseUrl}/api/workspace/members`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenAdminA}`,
          'X-Workspace-Id': wsAId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `escalate-${runId}@test.local`,
          role: 'OWNER',
        }),
      });
      assert.strictEqual(inviteRes.status, 403, 'Admin inviting Owner must return HTTP 403');

      // 10b. User Owner A attempts to modify role of member in Workspace B
      const roleRes = await fetch(`${baseUrl}/api/workspace/members/${memberBId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenOwnerA}`,
          'X-Workspace-Id': wsAId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'ADMIN' }),
      });
      assert.strictEqual(roleRes.status, 404, 'Modifying member of foreign workspace must return HTTP 404');
      console.log('✓ PASS: Role escalation & foreign member modification properly rejected\n');
    }

    // =========================================================================
    // POSITIVE REGRESSION TESTS (Step 5)
    // =========================================================================
    console.log('================================================================');
    console.log('--- RUNNING POSITIVE REGRESSION TESTS ---');
    console.log('================================================================\n');

    // Regression 1: Workspace A reading its own lead
    {
      const res = await fetch(`${baseUrl}/api/leads/${leadAId}`, {
        headers: {
          Authorization: `Bearer ${tokenOwnerA}`,
          'X-Workspace-Id': wsAId,
        },
      });
      assert.strictEqual(res.status, 200);
      const body = (await res.json()) as any;
      assert.strictEqual(body.data.id, leadAId);
      console.log('✓ PASS: Workspace A reads its own lead successfully (HTTP 200)');
    }

    // Regression 2: Workspace A updating its own lead
    {
      const res = await fetch(`${baseUrl}/api/leads/${leadAId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${tokenOwnerA}`,
          'X-Workspace-Id': wsAId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: 15500 }),
      });
      assert.strictEqual(res.status, 200);
      const updated = await prisma.lead.findUnique({ where: { id: leadAId } });
      assert.strictEqual(Number(updated?.value), 15500);
      console.log('✓ PASS: Workspace A updates its own lead successfully with scoped DB mutation');
    }

    // Regression 3: Workspace B reading its own records independently
    {
      const res = await fetch(`${baseUrl}/api/leads/${leadBId}`, {
        headers: {
          Authorization: `Bearer ${tokenOwnerB}`,
          'X-Workspace-Id': wsBId,
        },
      });
      assert.strictEqual(res.status, 200);
      const body = (await res.json()) as any;
      assert.strictEqual(body.data.id, leadBId);
      console.log('✓ PASS: Workspace B reads its own lead successfully (HTTP 200)');
    }

    // Regression 4: Admin A creating a legitimate lead in Workspace A
    {
      const res = await fetch(`${baseUrl}/api/leads`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenAdminA}`,
          'X-Workspace-Id': wsAId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Legit Admin Lead',
          company: 'Alpha Legit Corp',
          email: 'legit@alpha.local',
          value: 5000,
        }),
      });
      assert.strictEqual(res.status, 201);
      console.log('✓ PASS: Admin A creates legitimate lead in Workspace A (HTTP 201)');
    }

    // Regression 5: Viewer A reading Workspace A leads
    {
      const res = await fetch(`${baseUrl}/api/leads`, {
        headers: {
          Authorization: `Bearer ${tokenViewerA}`,
          'X-Workspace-Id': wsAId,
        },
      });
      assert.strictEqual(res.status, 200);
      const body = (await res.json()) as any;
      assert.ok(Array.isArray(body.data) && body.data.length >= 1, 'Must return leads array');
      console.log('✓ PASS: Viewer A retains legitimate read access to Workspace A leads');
    }

    // Regression 6: Workspace A deleting its own lead
    {
      const res = await fetch(`${baseUrl}/api/leads/${leadAId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenOwnerA}`,
          'X-Workspace-Id': wsAId,
        },
      });
      assert.strictEqual(res.status, 200);
      const deleted = await prisma.lead.findUnique({ where: { id: leadAId } });
      assert.strictEqual(deleted, null);
      console.log('✓ PASS: Workspace A deletes its own lead successfully with scoped DB mutation');
    }

    console.log('\n================================================================');
    console.log('--- ALL MULTI-TENANT ISOLATION & REGRESSION TESTS PASSED! ---');
    console.log('================================================================\n');
  } finally {
    if (server) {
      server.close();
    }
    await cleanupFixtures();
    await prisma.$disconnect();
  }
}

runAllTests().catch((err) => {
  console.error('\n[FATAL TEST FAILURE]', err);
  process.exit(1);
});
