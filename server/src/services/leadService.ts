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
      where: { id },
      data: {
        ...data,
        ...(data.lastContact !== undefined ? { lastContact: lastContactDate } : {}),
      },
    });
  }

  static async deleteLead(workspaceId: string, id: string) {
    const existing = await prisma.lead.findFirst({ where: { id, workspaceId } });
    if (!existing) return false;

    await prisma.lead.delete({ where: { id } });
    return true;
  }
}
