import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController.js';

const router = Router();

// GET /api/notifications - List notifications and unread count
router.get('/', NotificationController.list);

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', NotificationController.markAllAsRead);

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', NotificationController.markAsRead);

export default router;

