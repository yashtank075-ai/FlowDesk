import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000002';

async function main() {
  console.log('[Seed] Seeding database for FlowDesk AI Phase 2...');

  // 1. Create or upsert Demo Workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: DEMO_WORKSPACE_ID },
    update: {},
    create: {
      id: DEMO_WORKSPACE_ID,
      name: 'Acme Enterprise HQ',
      slug: 'acme-enterprise',
      currency: 'USD',
    },
  });
  console.log(`[Seed] Workspace ready: ${workspace.name} (${workspace.id})`);

  // 2. Create or upsert Admin User
  const user = await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: {
      id: DEMO_USER_ID,
      email: 'admin@flowdesk.ai',
      name: 'Yash Sharma',
      title: 'Head of Operations',
    },
  });

  // 3. Link Workspace Member
  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: user.id,
      role: 'ADMIN',
    },
  });

  // Clean existing demo workspace items to ensure exact seeded counts
  await prisma.activity.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.followUp.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.enquiry.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.customer.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.lead.deleteMany({ where: { workspaceId: workspace.id } });

  // 4. Seed Leads (6 records)
  const leads = [
    {
      name: 'Elena Rostova',
      company: 'Apex Logistics Inc.',
      email: 'elena@apexlogistics.com',
      phone: '+1 (415) 890-1243',
      value: 18500,
      status: 'NEGOTIATION',
      source: 'WEBSITE',
      assignedTo: 'Sarah Jenkins',
      notes: 'Interested in automated inventory sync and team seats for 40 users.',
    },
    {
      name: 'Marcus Vance',
      company: 'Vanguard Capital',
      email: 'm.vance@vanguardcap.io',
      phone: '+1 (212) 555-0199',
      value: 36000,
      status: 'PROPOSAL',
      source: 'REFERRAL',
      assignedTo: 'Alex Morgan',
      notes: 'Needs custom SSO integration and dedicated SLA guarantee.',
    },
    {
      name: 'Sophia Patel',
      company: 'CloudWave Media',
      email: 'spatel@cloudwave.co',
      phone: '+1 (650) 412-8821',
      value: 9200,
      status: 'QUALIFIED',
      source: 'LINKEDIN',
      assignedTo: 'Sarah Jenkins',
      notes: 'Currently evaluating FlowDesk vs traditional CRM for 15 sales reps.',
    },
    {
      name: 'David Kim',
      company: 'Nexus Health Tech',
      email: 'dkim@nexushealth.org',
      phone: '+1 (206) 774-3329',
      value: 52000,
      status: 'WON',
      source: 'EVENT',
      assignedTo: 'David Miller',
      notes: 'Enterprise annual contract closed with 120 client seats.',
    },
    {
      name: 'Chloe Dubois',
      company: 'Atelier Studio Paris',
      email: 'chloe@atelier-paris.fr',
      phone: '+33 1 42 68 55 00',
      value: 6400,
      status: 'CONTACTED',
      source: 'ORGANIC_SEARCH',
      assignedTo: 'Alex Morgan',
      notes: 'Discovery call held, requested a follow-up walkthrough next week.',
    },
    {
      name: 'Liam Henderson',
      company: 'Frontier Robotics',
      email: 'liam@frontier-robotics.com',
      phone: '+1 (303) 902-1188',
      value: 24000,
      status: 'NEW',
      source: 'WEBSITE',
      assignedTo: 'Sarah Jenkins',
      notes: 'Signed up for self-service demo; requested enterprise pricing tier.',
    },
  ];

  for (const lead of leads) {
    await prisma.lead.create({
      data: {
        ...lead as any,
        workspaceId: workspace.id,
      },
    });
  }
  console.log(`[Seed] Seeded ${leads.length} leads.`);

  // 5. Seed Customers (4 records)
  const customers = [
    {
      name: 'David Kim',
      company: 'Nexus Health Tech',
      email: 'dkim@nexushealth.org',
      phone: '+1 (206) 774-3329',
      tier: 'ENTERPRISE',
      status: 'ACTIVE',
      mrr: 4330,
      assignedManager: 'David Miller',
      industry: 'Healthcare & Biotech',
      notes: 'Quarterly check-in requested for product roadmap updates.',
    },
    {
      name: 'Rachel Sterling',
      company: 'Sterling Creative Agency',
      email: 'rachel@sterlingagency.com',
      phone: '+1 (312) 604-9988',
      tier: 'GROWTH',
      status: 'ACTIVE',
      mrr: 1850,
      assignedManager: 'Sarah Jenkins',
      industry: 'Marketing & Advertising',
      notes: 'Power users of customer feedback workflows.',
    },
    {
      name: 'Julian Thorne',
      company: 'OmniGrid Power Solutions',
      email: 'jthorne@omnigrid.energy',
      phone: '+1 (713) 489-0211',
      tier: 'ENTERPRISE',
      status: 'ACTIVE',
      mrr: 5900,
      assignedManager: 'Alex Morgan',
      industry: 'Clean Energy & Utilities',
      notes: 'Custom webhook connections set up for telemetry alerts.',
    },
    {
      name: 'Carlos Mendoza',
      company: 'Solarix Solar Dynamics',
      email: 'carlos@solarixdynamics.com',
      phone: '+1 (602) 881-9034',
      tier: 'STARTER',
      status: 'AT_RISK',
      mrr: 490,
      assignedManager: 'Alex Morgan',
      industry: 'Renewables',
      notes: 'Usage dropped 35% in October. Flagged for executive touchpoint.',
    },
  ];

  for (const cust of customers) {
    await prisma.customer.create({
      data: {
        ...cust as any,
        workspaceId: workspace.id,
      },
    });
  }
  console.log(`[Seed] Seeded ${customers.length} customers.`);

  // 6. Seed Enquiries (3 records)
  const enquiries = [
    {
      ticketNumber: 'TICK-1094',
      subject: 'SSO SAML configuration metadata returning 403',
      customerName: 'Marcus Vance',
      customerEmail: 'm.vance@vanguardcap.io',
      category: 'Technical Support',
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      description: 'During Okta integration testing, ACS endpoint is rejecting assertions with 403.',
      assignedAgent: 'DevOps Escalation',
    },
    {
      ticketNumber: 'TICK-1092',
      subject: 'Request invoice copy for fiscal year Q3 billing',
      customerName: 'Rachel Sterling',
      customerEmail: 'rachel@sterlingagency.com',
      category: 'Billing',
      priority: 'LOW',
      status: 'OPEN',
      description: 'Accounting needs consolidated PDF invoice with tax breakdown.',
      assignedAgent: 'Finance Team',
    },
    {
      ticketNumber: 'TICK-1088',
      subject: 'Enquiry about volume discount for 200+ team seats',
      customerName: 'Elena Rostova',
      customerEmail: 'elena@apexlogistics.com',
      category: 'Sales Inquiry',
      priority: 'HIGH',
      status: 'WAITING_ON_CLIENT',
      description: 'Sent custom quote draft based on multi-year commitment.',
      assignedAgent: 'Sarah Jenkins',
    },
  ];

  for (const enq of enquiries) {
    await prisma.enquiry.create({
      data: {
        ...enq as any,
        workspaceId: workspace.id,
      },
    });
  }
  console.log(`[Seed] Seeded ${enquiries.length} enquiries.`);

  // 7. Seed Follow-ups (2 records)
  const followUps = [
    {
      title: 'Review enterprise terms & SLA addendum',
      contactName: 'Marcus Vance',
      contactCompany: 'Vanguard Capital',
      contactEmail: 'm.vance@vanguardcap.io',
      dueDate: new Date(Date.now() + 86400000), // tomorrow
      dueTime: '15:30',
      type: 'CALL',
      status: 'PENDING',
      priority: 'HIGH',
      notes: 'Clarify uptime guarantees and dedicated sandbox access.',
    },
    {
      title: 'Quarterly business review & seat expansion',
      contactName: 'David Kim',
      contactCompany: 'Nexus Health Tech',
      contactEmail: 'dkim@nexushealth.org',
      dueDate: new Date(),
      dueTime: '17:00',
      type: 'MEETING',
      status: 'PENDING',
      priority: 'HIGH',
      notes: 'Review first month telemetry and adoption metrics with CTO.',
    },
  ];

  for (const flw of followUps) {
    await prisma.followUp.create({
      data: {
        ...flw as any,
        workspaceId: workspace.id,
      },
    });
  }
  console.log(`[Seed] Seeded ${followUps.length} follow-ups.`);

  console.log('[Seed] Demo data seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

  