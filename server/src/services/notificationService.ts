import { prisma } from '../config/prisma.js';

export interface CreateNotificationParams {
  workspaceId: string;
  userId?: string | null;
  title: string;
  message: string;
  type?: any;
  link?: string | null;
}

export class NotificationService {
  /**
   * List notifications for a specific user and workspace
   */
  static async listNotifications(workspaceId: string, userId: string, limit = 20) {
    // Return notifications targeted to this user OR workspace-wide (userId is null)
    const notifications = await (prisma as any).notification.findMany({
      where: {
        workspaceId,
        OR: [
          { userId },
          { userId: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const unreadCount = await (prisma as any).notification.count({
      where: {
        workspaceId,
        OR: [
          { userId },
          { userId: null },
        ],
        read: false,
      },
    });

    return {
      notifications,
      unreadCount,
    };
  }

  /**
   * Create a new notification safely
   */
  static async createNotification(params: CreateNotificationParams) {
    try {
      return await (prisma as any).notification.create({
        data: {
          workspaceId: params.workspaceId,
          userId: params.userId || null,
          title: params.title,
          message: params.message,
          type: params.type || 'SYSTEM',
          link: params.link || null,
          read: false,
        },
      });
    } catch (err) {
      console.error('[NotificationService] Failed to create notification:', err);
      return null;
    }
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(workspaceId: string, userId: string, notificationId: string) {
    const notification = await (prisma as any).notification.findFirst({
      where: {
        id: notificationId,
        workspaceId,
        OR: [
          { userId },
          { userId: null },
        ],
      },
    });

    if (!notification) {
      const error: any = new Error('Notification not found or access denied');
      error.statusCode = 404;
      throw error;
    }

    return (prisma as any).notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  /**
   * Mark all notifications as read for a user in this workspace
   */
  static async markAllAsRead(workspaceId: string, userId: string) {
    await (prisma as any).notification.updateMany({
      where: {
        workspaceId,
        OR: [
          { userId },
          { userId: null },
        ],
        read: false,
      },
      data: { read: true },
    });

    return { success: true };
  }
}

