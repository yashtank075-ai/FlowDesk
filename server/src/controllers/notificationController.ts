import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notificationService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ScopedRequest } from '../middleware/workspace.js';

export class NotificationController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const workspaceId = (req as ScopedRequest).workspaceId;
      const userId = authReq.user!.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await NotificationService.listNotifications(workspaceId, userId, limit);
      res.json({
        success: true,
        data: result.notifications,
        unreadCount: result.unreadCount,
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const workspaceId = (req as ScopedRequest).workspaceId;
      const userId = authReq.user!.userId;
      const notificationId = req.params.id;

      const updated = await NotificationService.markAsRead(workspaceId, userId, notificationId);
      res.json({
        success: true,
        data: updated,
        message: 'Notification marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const workspaceId = (req as ScopedRequest).workspaceId;
      const userId = authReq.user!.userId;

      await NotificationService.markAllAsRead(workspaceId, userId);
      res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  }
}

