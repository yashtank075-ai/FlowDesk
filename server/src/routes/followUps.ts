import { Router } from 'express';
import { FollowUpController } from '../controllers/followUpController.js';
import { validateRequest } from '../middleware/validate.js';
import { createFollowUpSchema, updateFollowUpSchema } from '../schemas/index.js';
import { requireRole } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

// GET: All 5 roles
router.get('/', FollowUpController.list);

// POST & PATCH: OWNER, ADMIN, MANAGER, MEMBER
router.post(
  '/',
  requireRole([Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER]),
  validateRequest(createFollowUpSchema),
  FollowUpController.create
);
router.patch(
  '/:id',
  requireRole([Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER]),
  validateRequest(updateFollowUpSchema),
  FollowUpController.update
);

export default router;


