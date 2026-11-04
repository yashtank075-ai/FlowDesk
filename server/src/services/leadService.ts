import { prisma } from '../config/prisma.js';
import { normalizeDate } from '../utils/dateUtils.js';
import { NotificationService } from './notificationService.js';

export interface LeadFilterOptions {
  search?: string;
  status?: string;
  source?: string;
  page?: number;
  limit?: number;
}

export class LeadService {
  static async listLeads(workspaceId: string, options: LeadFilterOptions = {}) {
    const { search, status, source, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = { workspaceId };

    if (status && status !== 'ALL') {
      where.status = status.toUpperCase();
    }

    if (source && source !== 'ALL') {
      where.source = source.toUpperCase();
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lead.count({ where }),
    ]);

    return {
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getLeadById(workspaceId: string, id: string) {
    return prisma.lead.findFirst({
      where: { id, workspaceId },
    });
  }

  static async createLead(workspaceId: string, data: any) {
    // Normalize lastContact date safely
    let lastContactDate: Date | undefined;
    if (data.lastContact !== undefined && data.lastContact !== null) {
      lastContactDate = normalizeDate(data.lastContact, 'lastContact') || undefined;
    }

    const created = await prisma.lead.create({
      data: {
        ...data,
        lastContact: lastContactDate,
        workspaceId,
      },
    });

    // Create real in-app business notification
    await NotificationService.createNotification({
      workspaceId,
      title: 'New Lead Added',
      message: `${created.name} (${created.company}) added to lead pipeline.`,
      type: 'LEAD_CREATED',
      link: '/leads',
    });

    return created;
  }

  static async updateLead(workspaceId: string, id: string, data: any) {
    const existing = await prisma.lead.findFirst({ where: { id, workspaceId } });
    if (!existing) return null;

    let lastContactDate: Date | undefined;
    if (data.lastContact !== undefined && data.lastContact !== null) {
      lastContactDate = normalizeDate(data.lastContact, 'lastContact') || undefined;
    }

    return prisma.lead.update({
      where: { id, workspaceId },
      data: {
        ...data,
        ...(data.lastContact !== undefined ? { lastContact: lastContactDate } : {}),
      },
    });
  }

  static async deleteLead(workspaceId: string, id: string) {
    const existing = await prisma.lead.findFirst({ where: { id, workspaceId } });
    if (!existing) return false;

    await prisma.lead.delete({ where: { id, workspaceId } });
    return true;
  }

  static async convertLeadToCustomer(workspaceId: string, leadId: string, overrideData: any = {}) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, workspaceId },
    });

    if (!lead) {
      const error: any = new Error('Lead not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if the lead is in an invalid stage
    if (lead.status === 'LOST') {
      const error: any = new Error('Cannot convert a lost lead to a customer');
      error.statusCode = 400;
      throw error;
    }

    // Check if customer with this email already exists in workspace
    const existingCustomer = await prisma.customer.findFirst({
      where: { workspaceId, email: lead.email },
    });

    if (existingCustomer) {
      const error: any = new Error('A customer with this email address already exists in this workspace');
      error.statusCode = 409;
      throw error;
    }

    // Prepare customer values
    const mrrValue = overrideData.mrr !== undefined ? overrideData.mrr : Number(lead.value) || 0;
    const assignedManager = overrideData.assignedManager || lead.assignedTo || 'Unassigned';
    const tier = overrideData.tier || 'GROWTH';
    const status = overrideData.status || 'ACTIVE';
    const industry = overrideData.industry || undefined;
    const notes = overrideData.notes !== undefined ? overrideData.notes : lead.notes;
    const contractRenewal = overrideData.contractRenewal ? normalizeDate(overrideData.contractRenewal, 'contractRenewal') : null;

    // Execute atomic transaction: create customer and update lead status to WON
    const result = await prisma.$transaction(async (tx) => {
      const newCustomer = await tx.customer.create({
        data: {
          workspaceId,
          name: lead.name,
          company: lead.company,
          email: lead.email,
          phone: lead.phone,
          tier,
          status,
          mrr: mrrValue,
          assignedManager,
          contractRenewal,
          industry,
          notes,
        },
      });

      const updatedLead = await tx.lead.update({
        where: { id: leadId, workspaceId },
        data: {
          status: 'WON',
        },
      });

      return { customer: newCustomer, lead: updatedLead };
    });

    // Notify workspace of new customer conversion
    await NotificationService.createNotification({
      workspaceId,
      title: 'Lead Converted to Customer',
      message: `${lead.name} (${lead.company}) was successfully converted to an active customer account.`,
      type: 'CUSTOMER_CREATED',
      link: '/customers',
    });

    return result;
  }
}
