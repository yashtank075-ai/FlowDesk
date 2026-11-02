import { Router } from 'express';
import { LeadController } from '../controllers/leadController.js';
import { validateRequest } from '../middleware/validate.js';
import { createLeadSchema, updateLeadSchema } from '../schemas/index.js';
import { requireRole } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

// GET: All 5 roles
router.get('/', LeadController.list);
router.get('/:id', LeadController.getById);

// POST & PATCH: OWNER, ADMIN, MANAGER, MEMBER
router.post(
  '/',
  requireRole([Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER]),
  validateRequest(createLeadSchema),
  LeadController.create
);
router.patch(
  '/:id',
  requireRole([Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER]),
  validateRequest(updateLeadSchema),
  LeadController.update
);

// DELETE: OWNER, ADMIN, MANAGER
router.delete(
  '/:id',
  requireRole([Role.OWNER, Role.ADMIN, Role.MANAGER]),
  LeadController.delete
);

export default router;


