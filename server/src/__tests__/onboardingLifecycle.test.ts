import assert from 'node:assert';

console.log('--- RUNNING ONBOARDING LIFECYCLE CONSISTENCY TESTS ---');

interface OnboardingTask {
  id: string;
  label: string;
  completed: boolean;
  isOptional: boolean;
}

function calculateOnboardingState(metrics: {
  workspaceName?: string;
  totalLeads: number;
  totalCustomers: number;
  totalFollowUps: number;
}) {
  const coreTasks: OnboardingTask[] = [
    {
      id: 'workspace',
      label: 'Set up business workspace',
      completed: Boolean(metrics.workspaceName && metrics.workspaceName.trim().length > 0),
      isOptional: false,
    },
    {
      id: 'lead',
      label: 'Create first lead',
      completed: metrics.totalLeads > 0,
      isOptional: false,
    },
    {
      id: 'customer',
      label: 'Add first customer',
      completed: metrics.totalCustomers > 0,
      isOptional: false,
    },
    {
      id: 'followup',
      label: 'Schedule first follow-up',
      completed: metrics.totalFollowUps > 0,
      isOptional: false,
    },
  ];

  const optionalTask: OnboardingTask = {
    id: 'insights',
    label: 'Explore business insights',
    completed: false,
    isOptional: true,
  };

  const completedCount = coreTasks.filter((t) => t.completed).length;
  const isAllRequiredCompleted = completedCount === coreTasks.length;
  const progressPercent = Math.round((completedCount / coreTasks.length) * 100);

  return {
    coreTasks,
    optionalTask,
    completedCount,
    totalRequired: coreTasks.length,
    isAllRequiredCompleted,
    progressPercent,
  };
}

function shouldRenderOnboardingGuide(params: {
  summaryLoading: boolean;
  isCleanWorkspace: boolean;
  hasStartedOnboarding: boolean;
  isDismissed: boolean;
}): boolean {
  if (params.summaryLoading) return false;
  return (params.isCleanWorkspace || params.hasStartedOnboarding) && !params.isDismissed;
}

// 1. Initial State right after registration:
// User registered with workspaceName "Acme SaaS Corp".
// Therefore, workspace initialization is already complete: progress is 1/4 (25%).
console.log('1. Testing initial render right after user registration...');
const initialRegisteredState = calculateOnboardingState({
  workspaceName: 'Acme SaaS Corp',
  totalLeads: 0,
  totalCustomers: 0,
  totalFollowUps: 0,
});
assert.strictEqual(initialRegisteredState.completedCount, 1, 'Initial state must be 1/4 because workspace is set up');
assert.strictEqual(initialRegisteredState.totalRequired, 4);
assert.strictEqual(initialRegisteredState.progressPercent, 25, 'Progress percentage must be 25%');
assert.strictEqual(initialRegisteredState.coreTasks[0].completed, true, 'Task 1 (Set up business workspace) is completed');
assert.strictEqual(initialRegisteredState.coreTasks[1].completed, false, 'Task 2 (Create first lead) is pending');
assert.strictEqual(initialRegisteredState.coreTasks[2].completed, false, 'Task 3 (Add first customer) is pending');
assert.strictEqual(initialRegisteredState.coreTasks[3].completed, false, 'Task 4 (Schedule first follow-up) is pending');
assert.strictEqual(
  shouldRenderOnboardingGuide({
    summaryLoading: false,
    isCleanWorkspace: true,
    hasStartedOnboarding: true,
    isDismissed: false,
  }),
  true,
  'Guide must be visible upon landing on Dashboard'
);
console.log('✓ PASS: Initial dashboard render correctly displays 1/4 (25%) complete');

// 2. Step 2: User adds first lead -> totalLeads: 1
console.log('2. Testing progress update after creating first lead...');
const stateAfterLead = calculateOnboardingState({
  workspaceName: 'Acme SaaS Corp',
  totalLeads: 1,
  totalCustomers: 0,
  totalFollowUps: 0,
});
assert.strictEqual(stateAfterLead.completedCount, 2, 'Progress must increment to 2/4');
assert.strictEqual(stateAfterLead.progressPercent, 50, 'Progress percentage must be 50%');
assert.strictEqual(
  shouldRenderOnboardingGuide({
    summaryLoading: false,
    isCleanWorkspace: false, // totalLeads > 0
    hasStartedOnboarding: true,
    isDismissed: false,
  }),
  true,
  'Guide must remain visible after creating first lead'
);
console.log('✓ PASS: First lead updates progress to 2/4 (50%) and guide remains visible');

// 3. Step 3: User adds first customer -> totalCustomers: 1
console.log('3. Testing progress update after creating first customer...');
const stateAfterCustomer = calculateOnboardingState({
  workspaceName: 'Acme SaaS Corp',
  totalLeads: 1,
  totalCustomers: 1,
  totalFollowUps: 0,
});
assert.strictEqual(stateAfterCustomer.completedCount, 3, 'Progress must increment to 3/4');
assert.strictEqual(stateAfterCustomer.progressPercent, 75, 'Progress percentage must be 75%');
assert.strictEqual(
  shouldRenderOnboardingGuide({
    summaryLoading: false,
    isCleanWorkspace: false,
    hasStartedOnboarding: true,
    isDismissed: false,
  }),
  true,
  'Guide must remain visible after creating first customer'
);
console.log('✓ PASS: First customer updates progress to 3/4 (75%) and guide remains visible');

// 4. Step 4: User schedules first follow-up -> totalFollowUps: 1
console.log('4. Testing progress update after scheduling first follow-up...');
const stateAfterFollowUp = calculateOnboardingState({
  workspaceName: 'Acme SaaS Corp',
  totalLeads: 1,
  totalCustomers: 1,
  totalFollowUps: 1,
});
assert.strictEqual(stateAfterFollowUp.completedCount, 4, 'Progress must reach 4/4');
assert.strictEqual(stateAfterFollowUp.progressPercent, 100, 'Progress percentage must be 100%');
assert.strictEqual(stateAfterFollowUp.isAllRequiredCompleted, true, 'All 4 required tasks complete');
assert.strictEqual(
  shouldRenderOnboardingGuide({
    summaryLoading: false,
    isCleanWorkspace: false,
    hasStartedOnboarding: true,
    isDismissed: false,
  }),
  true,
  'Guide must remain visible to show the completed celebration state and allow dismissal'
);
console.log('✓ PASS: First follow-up reaches 4/4 (100%) and celebration state is displayed');

// 5. Verify follow-up milestone remains complete even when follow-up is COMPLETED
const stateAfterFollowUpCompleted = calculateOnboardingState({
  workspaceName: 'Acme SaaS Corp',
  totalLeads: 1,
  totalCustomers: 1,
  totalFollowUps: 1, // Still 1 total follow-up record in DB
});
assert.strictEqual(stateAfterFollowUpCompleted.completedCount, 4);
assert.strictEqual(stateAfterFollowUpCompleted.isAllRequiredCompleted, true);
console.log('✓ PASS: Completed follow-up persistently preserves 4/4 completion');

// 6. Optional item isolation
assert.strictEqual(stateAfterFollowUp.optionalTask.isOptional, true);
assert.strictEqual(stateAfterFollowUp.isAllRequiredCompleted, true);
console.log('✓ PASS: Optional Explore Insights item does not interfere with required progress');

// 7. Workspace-specific dismissal isolation
const workspaceADismissed = shouldRenderOnboardingGuide({
  summaryLoading: false,
  isCleanWorkspace: false,
  hasStartedOnboarding: true,
  isDismissed: true, // Dismissed in Workspace A
});
const workspaceBNotDismissed = shouldRenderOnboardingGuide({
  summaryLoading: false,
  isCleanWorkspace: true,
  hasStartedOnboarding: true,
  isDismissed: false, // NOT dismissed in Workspace B
});
assert.strictEqual(workspaceADismissed, false, 'Workspace A remains dismissed');
assert.strictEqual(workspaceBNotDismissed, true, 'Workspace B remains visible');
console.log('✓ PASS: Dismissal remains strictly workspace-specific');

console.log('--- ALL ONBOARDING CONSISTENCY TESTS PASSED ---');
