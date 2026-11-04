function assertStrictEqual<T>(actual: T, expected: T, msg?: string) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: expected ${expected}, got ${actual}. ${msg || ''}`);
  }
}

function assertOk(value: any, msg?: string) {
  if (!value) {
    throw new Error(`Assertion failed: expected truthy value. ${msg || ''}`);
  }
}

console.log('================================================================');
console.log('--- RUNNING FRONTEND WORKSPACE SWITCHING SYNCHRONIZATION TESTS ---');
console.log('================================================================\n');

// Mock localStorage in Node environment
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
};

// Simulate API service state module
const DEMO_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';
let currentWorkspaceId: string | null = mockLocalStorage.getItem('flowdesk_workspace_id') || DEMO_WORKSPACE_ID;

const setActiveWorkspaceId = (workspaceId: string | null) => {
  currentWorkspaceId = workspaceId || DEMO_WORKSPACE_ID;
  if (workspaceId) {
    mockLocalStorage.setItem('flowdesk_workspace_id', workspaceId);
  } else {
    mockLocalStorage.removeItem('flowdesk_workspace_id');
  }
};

const getActiveWorkspaceId = () => currentWorkspaceId;

// Simulate AuthContext state and methods
interface AuthWorkspace {
  id: string;
  name: string;
  role: string;
}

interface AuthResponse {
  currentWorkspace: AuthWorkspace | null;
  workspaces?: AuthWorkspace[];
}

let currentWorkspaceState: AuthWorkspace | null = null;

const switchWorkspace = (workspace: AuthWorkspace) => {
  setActiveWorkspaceId(workspace.id);
  currentWorkspaceState = workspace;
};

const resolveInitialWorkspace = (authData: AuthResponse): AuthWorkspace | null => {
  const activeId = mockLocalStorage.getItem('flowdesk_workspace_id');
  const activeWs = authData.workspaces?.find((w) => w.id === activeId) || authData.currentWorkspace;
  if (activeWs?.id) {
    setActiveWorkspaceId(activeWs.id);
  }
  return activeWs;
};

// Test fixtures
const workspaceA: AuthWorkspace = { id: '11111111-1111-1111-1111-111111111111', name: 'Acme Corp', role: 'OWNER' };
const workspaceB: AuthWorkspace = { id: '22222222-2222-2222-2222-222222222222', name: 'Beta Ltd', role: 'MEMBER' };
const workspaceForeign: AuthWorkspace = { id: '99999999-9999-9999-9999-999999999999', name: 'Rogue Workspace', role: 'MEMBER' };

// 1. Initial login defaults to primary workspace A
console.log('1. Testing initial login / setup synchronization...');
setActiveWorkspaceId(workspaceA.id);
currentWorkspaceState = workspaceA;
assertStrictEqual(getActiveWorkspaceId(), workspaceA.id, 'Active API workspace ID must match Workspace A');
assertStrictEqual(mockLocalStorage.getItem('flowdesk_workspace_id'), workspaceA.id, 'localStorage must persist Workspace A');
console.log('✓ PASS: Initial login synchronizes active workspace ID in memory and storage');

// 2. User switches to Workspace B
console.log('2. Testing workspace switching synchronization...');
switchWorkspace(workspaceB);
assertStrictEqual(currentWorkspaceState.id, workspaceB.id, 'React context state must update to Workspace B');
assertStrictEqual(getActiveWorkspaceId(), workspaceB.id, 'Axios active workspace ID must immediately update to Workspace B');
assertStrictEqual(mockLocalStorage.getItem('flowdesk_workspace_id'), workspaceB.id, 'localStorage must update to Workspace B');
console.log('✓ PASS: switchWorkspace synchronizes React state, Axios header context, and localStorage');

// 3. User refreshes browser (simulating initAuth / refresh session)
console.log('3. Testing session refresh preservation with multiple memberships...');
const refreshData: AuthResponse = {
  currentWorkspace: workspaceA, // Server primary is A
  workspaces: [workspaceA, workspaceB], // User belongs to A and B
};
const restoredWorkspace = resolveInitialWorkspace(refreshData);
assertStrictEqual(restoredWorkspace?.id, workspaceB.id, 'Must preserve previously active Workspace B');
assertStrictEqual(getActiveWorkspaceId(), workspaceB.id, 'Axios interceptor must preserve Workspace B context across reloads');
console.log('✓ PASS: Page refresh restores previously selected workspace instead of resetting to primary');

// 4. Stale or foreign workspace ID in localStorage fallback
console.log('4. Testing foreign/revoked workspace ID fallback...');
mockLocalStorage.setItem('flowdesk_workspace_id', workspaceForeign.id);
const restoredAfterRevocation = resolveInitialWorkspace(refreshData);
assertStrictEqual(restoredAfterRevocation?.id, workspaceA.id, 'Must safely fallback to primary workspace if saved ID is unauthorized');
assertStrictEqual(getActiveWorkspaceId(), workspaceA.id, 'Active workspace ID must reset to primary workspace');
console.log('✓ PASS: Unauthorized or foreign stored workspace ID safely falls back to authoritative membership');

console.log('\n================================================================');
console.log('--- ALL FRONTEND WORKSPACE SWITCHING TESTS PASSED! ---');
console.log('================================================================');
