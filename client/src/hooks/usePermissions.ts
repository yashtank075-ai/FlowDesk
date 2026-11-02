import { useAuth } from '../context/AuthContext';

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';

export interface RolePermissions {
  // Navigation & View
  canViewDashboard: boolean;
  canViewLeads: boolean;
  canViewCustomers: boolean;
  canViewEnquiries: boolean;
  canViewFollowUps: boolean;
  canViewMembers: boolean;

  // Leads
  canCreateLeads: boolean;
  canEditLeads: boolean;
  canDeleteLeads: boolean;

  // Customers
  canCreateCustomers: boolean;
  canEditCustomers: boolean;
  canDeleteCustomers: boolean;

  // Enquiries
  canCreateEnquiries: boolean;
  canEditEnquiries: boolean;
  canDeleteEnquiries: boolean;

  // Follow-ups
  canCreateFollowUps: boolean;
  canEditFollowUps: boolean;
  canDeleteFollowUps: boolean;

  // Team & Workspace Management
  canInviteMembers: boolean;
  canChangeRoles: boolean;
}

export const getPermissionsForRole = (role?: string | null): RolePermissions => {
  const currentRole = (role || 'VIEWER') as WorkspaceRole;

  switch (currentRole) {
    case 'OWNER':
      return {
        canViewDashboard: true,
        canViewLeads: true,
        canViewCustomers: true,
        canViewEnquiries: true,
        canViewFollowUps: true,
        canViewMembers: true,

        canCreateLeads: true,
        canEditLeads: true,
        canDeleteLeads: true,

        canCreateCustomers: true,
        canEditCustomers: true,
        canDeleteCustomers: true,

        canCreateEnquiries: true,
        canEditEnquiries: true,
        canDeleteEnquiries: true,

        canCreateFollowUps: true,
        canEditFollowUps: true,
        canDeleteFollowUps: true,

        canInviteMembers: true,
        canChangeRoles: true,
      };

    case 'ADMIN':
      return {
        canViewDashboard: true,
        canViewLeads: true,
        canViewCustomers: true,
        canViewEnquiries: true,
        canViewFollowUps: true,
        canViewMembers: true,

        canCreateLeads: true,
        canEditLeads: true,
        canDeleteLeads: true,

        canCreateCustomers: true,
        canEditCustomers: true,
        canDeleteCustomers: true,

        canCreateEnquiries: true,
        canEditEnquiries: true,
        canDeleteEnquiries: true,

        canCreateFollowUps: true,
        canEditFollowUps: true,
        canDeleteFollowUps: true,

        canInviteMembers: true,
        canChangeRoles: false, // Strictly OWNER can change roles
      };

    case 'MANAGER':
      return {
        canViewDashboard: true,
        canViewLeads: true,
        canViewCustomers: true,
        canViewEnquiries: true,
        canViewFollowUps: true,
        canViewMembers: true,

        canCreateLeads: true,
        canEditLeads: true,
        canDeleteLeads: true,

        canCreateCustomers: true,
        canEditCustomers: true,
        canDeleteCustomers: true,

        canCreateEnquiries: true,
        canEditEnquiries: true,
        canDeleteEnquiries: true,

        canCreateFollowUps: true,
        canEditFollowUps: true,
        canDeleteFollowUps: true,

        canInviteMembers: false,
        canChangeRoles: false,
      };

    case 'MEMBER':
      return {
        canViewDashboard: true,
        canViewLeads: true,
        canViewCustomers: true,
        canViewEnquiries: true,
        canViewFollowUps: true,
        canViewMembers: true,

        canCreateLeads: true,
        canEditLeads: true,
        canDeleteLeads: false, // Cannot delete leads

        canCreateCustomers: false, // Cannot mutate customers
        canEditCustomers: false,
        canDeleteCustomers: false,

        canCreateEnquiries: true,
        canEditEnquiries: true,
        canDeleteEnquiries: false, // Cannot delete enquiries

        canCreateFollowUps: true,
        canEditFollowUps: true,
        canDeleteFollowUps: false, // Cannot delete follow-ups

        canInviteMembers: false,
        canChangeRoles: false,
      };

    case 'VIEWER':
    default:
      return {
        canViewDashboard: true,
        canViewLeads: true,
        canViewCustomers: true,
        canViewEnquiries: true,
        canViewFollowUps: true,
        canViewMembers: true,

        canCreateLeads: false,
        canEditLeads: false,
        canDeleteLeads: false,

        canCreateCustomers: false,
        canEditCustomers: false,
        canDeleteCustomers: false,

        canCreateEnquiries: false,
        canEditEnquiries: false,
        canDeleteEnquiries: false,

        canCreateFollowUps: false,
        canEditFollowUps: false,
        canDeleteFollowUps: false,

        canInviteMembers: false,
        canChangeRoles: false,
      };
  }
};

/**
 * React hook to retrieve current user permissions based on their active workspace membership role
 */
export const usePermissions = () => {
  const { currentWorkspace } = useAuth();
  const permissions = getPermissionsForRole(currentWorkspace?.role);

  return {
    role: (currentWorkspace?.role || 'VIEWER') as WorkspaceRole,
    ...permissions,
  };
};

