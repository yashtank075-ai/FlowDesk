import { prisma } from '../config/prisma.js';
import { NotificationService } from './notificationService.js';

export interface EnquiryFilterOptions {
  search?: string;
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}

export class EnquiryService {
  static async listEnquiries(workspaceId: string, options: EnquiryFilterOptions = {}) {
    const { search, status, priority, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = { workspaceId };

    if (status && status !== 'ALL') {
      where.status = status.toUpperCase().replace(/\s+/g, '_');
    }

    if (priority && priority !== 'ALL') {
      where.priority = priority.toUpperCase();
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [enquiries, total] = await Promise.all([
      prisma.enquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.enquiry.count({ where }),
    ]);

    return {
      enquiries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getEnquiryById(workspaceId: string, id: string) {
    return prisma.enquiry.findFirst({
      where: { id, workspaceId },
    });
  }

  static async createEnquiry(workspaceId: string, data: any) {
    const ticketCount = await prisma.enquiry.count({ where: { workspaceId } });
    const ticketNumber = data.ticketNumber || `TICK-${1000 + ticketCount + 1}`;

    const created = await prisma.enquiry.create({
      data: {
        ...data,
        ticketNumber,
        workspaceId,
      },
    });

    await NotificationService.createNotification({
      workspaceId,
      title: 'New Support Ticket',
      message: `[${created.ticketNumber}] ${created.subject} received from ${created.customerName}.`,
      type: 'ENQUIRY_CREATED',
      link: '/enquiries',
    });

    return created;
  }

  static async updateEnquiry(workspaceId: string, id: string, data: any) {
    const existing = await prisma.enquiry.findFirst({ where: { id, workspaceId } });
    if (!existing) return null;

    const updated = await prisma.enquiry.update({
      where: { id, workspaceId },
      data,
    });

    if (data.status && data.status !== existing.status) {
      await NotificationService.createNotification({
        workspaceId,
        title: 'Ticket Status Updated',
        message: `[${updated.ticketNumber}] status changed from ${existing.status} to ${updated.status}.`,
        type: 'ENQUIRY_STATUS_CHANGED',
        link: '/enquiries',
      });
    }

    return updated;
  }
}

