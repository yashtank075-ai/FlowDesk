import { prisma } from '../config/prisma.js';

export interface SearchLeadResult {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  status: string;
  value: number;
}

export interface SearchCustomerResult {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  status: string;
  tier: string;
  mrr: number;
}

export interface SearchEnquiryResult {
  id: string;
  ticketNumber: string;
  subject: string;
  customerName: string;
  customerEmail: string;
  status: string;
  priority: string;
}

export interface SearchFollowUpResult {
  id: string;
  title: string;
  contactName: string;
  contactCompany: string;
  status: string;
  dueDate: string;
  dueTime: string;
  type: string;
}

export interface GlobalSearchResponse {
  query: string;
  results: {
    leads: SearchLeadResult[];
    customers: SearchCustomerResult[];
    enquiries: SearchEnquiryResult[];
    followUps: SearchFollowUpResult[];
  };
  total: number;
}

export class SearchService {
  /**
   * Global search across Leads, Customers, Enquiries, and FollowUps strictly scoped to workspace
   */
  static async search(
    workspaceId: string,
    query: string,
    type: 'all' | 'leads' | 'customers' | 'enquiries' | 'follow-ups' = 'all',
    limit = 5
  ): Promise<GlobalSearchResponse> {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      return {
        query: trimmed,
        results: { leads: [], customers: [], enquiries: [], followUps: [] },
        total: 0,
      };
    }

    const cappedLimit = Math.min(Math.max(1, limit), 20);

    // Queries to run based on requested type filter
    const shouldQueryLeads = type === 'all' || type === 'leads';
    const shouldQueryCustomers = type === 'all' || type === 'customers';
    const shouldQueryEnquiries = type === 'all' || type === 'enquiries';
    const shouldQueryFollowUps = type === 'all' || type === 'follow-ups';

    const [leads, customers, enquiries, followUps] = await Promise.all([
      shouldQueryLeads
        ? prisma.lead.findMany({
            where: {
              workspaceId,
              OR: [
                { name: { contains: trimmed, mode: 'insensitive' } },
                { company: { contains: trimmed, mode: 'insensitive' } },
                { email: { contains: trimmed, mode: 'insensitive' } },
                { phone: { contains: trimmed, mode: 'insensitive' } },
              ],
            },
            take: cappedLimit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              company: true,
              email: true,
              phone: true,
              status: true,
              value: true,
            },
          })
        : Promise.resolve([]),

      shouldQueryCustomers
        ? prisma.customer.findMany({
            where: {
              workspaceId,
              OR: [
                { name: { contains: trimmed, mode: 'insensitive' } },
                { company: { contains: trimmed, mode: 'insensitive' } },
                { email: { contains: trimmed, mode: 'insensitive' } },
                { phone: { contains: trimmed, mode: 'insensitive' } },
              ],
            },
            take: cappedLimit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              company: true,
              email: true,
              phone: true,
              status: true,
              tier: true,
              mrr: true,
            },
          })
        : Promise.resolve([]),

      shouldQueryEnquiries
        ? prisma.enquiry.findMany({
            where: {
              workspaceId,
              OR: [
                { ticketNumber: { contains: trimmed, mode: 'insensitive' } },
                { subject: { contains: trimmed, mode: 'insensitive' } },
                { customerName: { contains: trimmed, mode: 'insensitive' } },
                { customerEmail: { contains: trimmed, mode: 'insensitive' } },
              ],
            },
            take: cappedLimit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              ticketNumber: true,
              subject: true,
              customerName: true,
              customerEmail: true,
              status: true,
              priority: true,
            },
          })
        : Promise.resolve([]),

      shouldQueryFollowUps
        ? prisma.followUp.findMany({
            where: {
              workspaceId,
              OR: [
                { title: { contains: trimmed, mode: 'insensitive' } },
                { contactName: { contains: trimmed, mode: 'insensitive' } },
                { contactCompany: { contains: trimmed, mode: 'insensitive' } },
                { notes: { contains: trimmed, mode: 'insensitive' } },
              ],
            },
            take: cappedLimit,
            orderBy: { dueDate: 'asc' },
            select: {
              id: true,
              title: true,
              contactName: true,
              contactCompany: true,
              status: true,
              dueDate: true,
              dueTime: true,
              type: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const formattedLeads: SearchLeadResult[] = leads.map((l) => ({
      id: l.id,
      name: l.name,
      company: l.company,
      email: l.email,
      phone: l.phone,
      status: l.status,
      value: Number(l.value) || 0,
    }));

    const formattedCustomers: SearchCustomerResult[] = customers.map((c) => ({
      id: c.id,
      name: c.name,
      company: c.company,
      email: c.email,
      phone: c.phone,
      status: c.status,
      tier: c.tier,
      mrr: Number(c.mrr) || 0,
    }));

    const formattedEnquiries: SearchEnquiryResult[] = enquiries.map((e) => ({
      id: e.id,
      ticketNumber: e.ticketNumber,
      subject: e.subject,
      customerName: e.customerName,
      customerEmail: e.customerEmail,
      status: e.status,
      priority: e.priority,
    }));

    const formattedFollowUps: SearchFollowUpResult[] = followUps.map((f) => ({
      id: f.id,
      title: f.title,
      contactName: f.contactName,
      contactCompany: f.contactCompany,
      status: f.status,
      dueDate: f.dueDate.toISOString().split('T')[0],
      dueTime: f.dueTime || '12:00',
      type: f.type,
    }));

    const total =
      formattedLeads.length +
      formattedCustomers.length +
      formattedEnquiries.length +
      formattedFollowUps.length;

    return {
      query: trimmed,
      results: {
        leads: formattedLeads,
        customers: formattedCustomers,
        enquiries: formattedEnquiries,
        followUps: formattedFollowUps,
      },
      total,
    };
  }
}
