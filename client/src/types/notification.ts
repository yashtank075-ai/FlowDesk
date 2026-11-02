export interface AppNotification {
  id: string;
  workspaceId: string;
  userId?: string | null;
  title: string;
  message: string;
  type:
    | 'LEAD_CREATED'
    | 'CUSTOMER_CREATED'
    | 'ENQUIRY_CREATED'
    | 'ENQUIRY_STATUS_CHANGED'
    | 'FOLLOWUP_SCHEDULED'
    | 'INVITATION_CREATED'
    | 'INVITATION_ACCEPTED'
    | 'SYSTEM';
  read: boolean;
  link?: string | null;
  createdAt: string;
}

