import crypto from 'node:crypto';
import { Prisma } from '@prisma/client';
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
  static generateTicketNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomEntropy = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `TICK-${timestamp}-${randomEntropy}`;
  }

  private static isTicketUniqueConstraintViolation(err: unknown): boolean {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== 'P2002') {
      return false;
    }

    const target = err.meta?.target;

    // Prisma returns target as an array of column names in Postgres: ['workspaceId', 'ticketNumber']
    if (Array.isArray(target)) {
      const hasTicketNumber = target.includes('ticketNumber');
      const hasWorkspaceId = target.includes('workspaceId');
      return hasTicketNumber && hasWorkspaceId;
    }

    // Prisma may also return target as the constraint name string (e.g. 'enquiries_workspaceId_ticketNumber_key')
    if (typeof target === 'string') {
      const lower = target.toLowerCase();
      return lower.includes('ticketnumber') && (lower.includes('workspaceid') || lower.includes('workspace_id'));
    }

    return false;
  }

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
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
    // If a custom ticketNumber is explicitly provided by the caller
    const isCustomTicket = Boolean(data.ticketNumber && typeof data.ticketNumber === 'string' && data.ticketNumber.trim());

    if (isCustomTicket) {
      const customNumber = data.ticketNumber.trim();
      const existing = await prisma.enquiry.findFirst({
        where: { workspaceId, ticketNumber: customNumber },
      });

      if (existing) {
        const error: any = new Error(`Ticket number '${customNumber}' already exists in this workspace.`);
        error.statusCode = 409;
        throw error;
      }

      try {
        const created = await prisma.enquiry.create({
          data: {
            ...data,
            ticketNumber: customNumber,
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
      } catch (err: any) {
        if (EnquiryService.isTicketUniqueConstraintViolation(err)) {
          const error: any = new Error(`Ticket number '${customNumber}' already exists in this workspace.`);
          error.statusCode = 409;
          throw error;
        }
        throw err;
      }
    }

    // Auto-generate ticket number with bounded retry strategy
    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const ticketNumber = EnquiryService.generateTicketNumber();
      try {
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
      } catch (err: any) {
        if (EnquiryService.isTicketUniqueConstraintViolation(err)) {
          lastError = err;
          continue; // Retry with a newly generated identifier
        }
        // Do not retry unrelated database constraint errors or query errors
        throw err;
      }
    }

    const controlledError: any = new Error('Failed to generate a unique ticket number after multiple attempts. Please try again.');
    controlledError.statusCode = 500;
    throw controlledError;
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

