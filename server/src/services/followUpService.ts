import { prisma } from '../config/prisma.js';
import { normalizeDate } from '../utils/dateUtils.js';
import { NotificationService } from './notificationService.js';

export interface FollowUpFilterOptions {
  status?: string;
  type?: string;
  dueDate?: string;
}

export class FollowUpService {
  static async listFollowUps(workspaceId: string, options: FollowUpFilterOptions = {}) {
    const { status, type } = options;

    const where: any = { workspaceId };

    if (status && status !== 'ALL') {
      where.status = status.toUpperCase();
    }

    if (type && type !== 'ALL') {
      where.type = type.toUpperCase().replace(/\s+/g, '_');
    }

    return prisma.followUp.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });
  }

  static async createFollowUp(workspaceId: string, data: any) {
    const dueDate = normalizeDate(data.dueDate, 'dueDate', false);
    if (!dueDate) {
      throw new Error("Field 'dueDate' is required and must be a valid date.");
    }

    const created = await prisma.followUp.create({
      data: {
        ...data,
        dueDate,
        workspaceId,
      },
    });

    await NotificationService.createNotification({
      workspaceId,
      title: 'Follow-up Task Scheduled',
      message: `${created.title} with ${created.contactName} (${created.contactCompany}).`,
      type: 'FOLLOWUP_SCHEDULED',
      link: '/follow-ups',
    });

    return created;
  }

  static async updateFollowUp(workspaceId: string, id: string, data: any) {
    const existing = await prisma.followUp.findFirst({ where: { id, workspaceId } });
    if (!existing) return null;

    let dueDate: Date | undefined;
    if (data.dueDate !== undefined) {
      dueDate = normalizeDate(data.dueDate, 'dueDate', false) || undefined;
    }

    return prisma.followUp.update({
      where: { id, workspaceId },
      data: {
        ...data,
        ...(data.dueDate !== undefined ? { dueDate } : {}),
      },
    });
  }

  static async deleteFollowUp(workspaceId: string, id: string) {
    const existing = await prisma.followUp.findFirst({ where: { id, workspaceId } });
    if (!existing) return false;

    await prisma.followUp.delete({ where: { id, workspaceId } });
    return true;
  }
}
