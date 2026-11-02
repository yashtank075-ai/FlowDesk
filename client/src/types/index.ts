export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';

export type LeadSource = 'Website' | 'Referral' | 'LinkedIn' | 'Organic Search' | 'Outbound' | 'Event';

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  value: number; // estimated deal value in USD
  status: LeadStatus;
  source: LeadSource;
  assignedTo: string;
  createdAt: string; // ISO date
  lastContact: string; // ISO date
  notes?: string;
}

export type CustomerTier = 'Starter' | 'Growth' | 'Enterprise';
export type CustomerStatus = 'Active' | 'Onboarding' | 'At Risk' | 'Churned';

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  tier: CustomerTier;
  status: CustomerStatus;
  mrr: number; // Monthly Recurring Revenue
  joinedDate: string;
  assignedManager: string;
  contractRenewal: string;
  industry: string;
  notes?: string;
}

export type EnquiryPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type EnquiryStatus = 'Open' | 'In Progress' | 'Waiting on Client' | 'Resolved';

export interface Enquiry {
  id: string;
  ticketNumber: string;
  subject: string;
  customerName: string;
  customerEmail: string;
  category: 'Billing' | 'Technical Support' | 'Feature Request' | 'Sales Inquiry' | 'General';
  priority: EnquiryPriority;
  status: EnquiryStatus;
  createdAt: string;
  updatedAt: string;
  description: string;
  assignedAgent: string;
}

export type FollowUpStatus = 'Pending' | 'Completed' | 'Cancelled';
export type FollowUpPriority = 'Normal' | 'High';

export interface FollowUp {
  id: string;
  title: string;
  contactName: string;
  contactCompany: string;
  contactEmail: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:mm
  type: 'Call' | 'Email' | 'Meeting' | 'Demo' | 'Contract Review';
  status: FollowUpStatus;
  priority: FollowUpPriority;
  notes?: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'lead' | 'customer' | 'enquiry' | 'followup';
  user: string;
}

