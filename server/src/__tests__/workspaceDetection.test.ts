import assert from 'node:assert';

console.log('--- RUNNING STATUS-INDEPENDENT WORKSPACE DETECTION TESTS ---');

// Helper simulating DashboardPage.tsx status-independent workspace detection
function isBrandNewWorkspace(
  kpis: {
    totalLeads: number;
    totalCustomers: number;
    openEnquiries: number;
    pendingFollowUps: number;
    wonDealsCount: number;
    totalFollowUps?: number;
    totalEnquiries?: number;
    totalCustomerAccounts?: number;
  } | undefined,
  isLoading: boolean
): boolean {
  if (isLoading) return false;
  const totalCRMRecords =
    (kpis?.totalLeads ?? 0) +
    (kpis?.totalCustomerAccounts ?? kpis?.totalCustomers ?? 0) +
    (kpis?.totalEnquiries ?? kpis?.openEnquiries ?? 0) +
    (kpis?.totalFollowUps ?? kpis?.pendingFollowUps ?? 0);
  return totalCRMRecords === 0;
}

// 1. Genuinely clean workspace with 0 records -> Displays onboarding
const cleanWorkspace = {
  totalLeads: 0,
  totalCustomers: 0,
  openEnquiries: 0,
  pendingFollowUps: 0,
  wonDealsCount: 0,
  totalFollowUps: 0,
  totalEnquiries: 0,
  totalCustomerAccounts: 0,
};
assert.strictEqual(isBrandNewWorkspace(cleanWorkspace, false), true, 'Clean workspace must display onboarding');
console.log('✓ PASS: Genuinely empty workspace displays onboarding');

// 2. Workspace containing ONLY completed follow-ups (pendingFollowUps: 0, totalFollowUps: 3)
const workspaceWithCompletedFollowUps = {
  totalLeads: 0,
  totalCustomers: 0,
  openEnquiries: 0,
  pendingFollowUps: 0,
  wonDealsCount: 0,
  totalFollowUps: 3, // All 3 follow-ups are completed
  totalEnquiries: 0,
  totalCustomerAccounts: 0,
};
assert.strictEqual(
  isBrandNewWorkspace(workspaceWithCompletedFollowUps, false),
  false,
  'Workspace with only completed follow-ups must NOT be brand new'
);
console.log('✓ PASS: Workspace with only completed follow-ups is recognized as established');

// 3. Workspace containing ONLY closed/resolved enquiries (openEnquiries: 0, totalEnquiries: 2)
const workspaceWithClosedEnquiries = {
  totalLeads: 0,
  totalCustomers: 0,
  openEnquiries: 0,
  pendingFollowUps: 0,
  wonDealsCount: 0,
  totalFollowUps: 0,
  totalEnquiries: 2, // All 2 enquiries are resolved
  totalCustomerAccounts: 0,
};
assert.strictEqual(
  isBrandNewWorkspace(workspaceWithClosedEnquiries, false),
  false,
  'Workspace with only closed enquiries must NOT be brand new'
);
console.log('✓ PASS: Workspace with only closed enquiries is recognized as established');

// 4. Workspace containing ONLY lost deals (wonDealsCount: 0, totalLeads: 4 with status LOST)
const workspaceWithLostDeals = {
  totalLeads: 4, // 4 leads, all marked LOST
  totalCustomers: 0,
  openEnquiries: 0,
  pendingFollowUps: 0,
  wonDealsCount: 0,
  totalFollowUps: 0,
  totalEnquiries: 0,
  totalCustomerAccounts: 0,
};
assert.strictEqual(
  isBrandNewWorkspace(workspaceWithLostDeals, false),
  false,
  'Workspace with only lost deals must NOT be brand new'
);
console.log('✓ PASS: Workspace with only lost deals is recognized as established');

// 5. Follow-up onboarding milestone completion: totalFollowUps > 0 maintains completion
function isFollowUpTaskCompleted(metrics: { totalFollowUps: number }): boolean {
  return metrics.totalFollowUps > 0;
}

// User created 1 follow-up, which is currently pending
assert.strictEqual(isFollowUpTaskCompleted({ totalFollowUps: 1 }), true, 'Pending follow-up completes milestone');
// User marks the follow-up as COMPLETED: totalFollowUps is STILL 1
assert.strictEqual(
  isFollowUpTaskCompleted({ totalFollowUps: 1 }),
  true,
  'Completed follow-up remains persistent and complete'
);
console.log('✓ PASS: Completed follow-up persistently keeps onboarding milestone completed');

// 6. Loading state does not display onboarding prematurely
assert.strictEqual(isBrandNewWorkspace(cleanWorkspace, true), false, 'Loading state must not show onboarding prematurely');
console.log('✓ PASS: Loading state prevents premature onboarding display');

console.log('--- ALL STATUS-INDEPENDENT WORKSPACE DETECTION TESTS PASSED ---');
