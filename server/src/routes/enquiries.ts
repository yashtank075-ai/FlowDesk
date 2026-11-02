import { Router } from 'express';
import { EnquiryController } from '../controllers/enquiryController.js';
import { validateRequest } from '../middleware/validate.js';
import { createEnquirySchema, updateEnquirySchema } from '../schemas/index.js';
import { requireRole } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

// GET: All 5 roles
router.get('/', EnquiryController.list);
router.get('/:id', EnquiryController.getById);

// POST & PATCH: OWNER, ADMIN, MANAGER, MEMBER
router.post(
  '/',
  requireRole([Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER]),
  validateRequest(createEnquirySchema),
  EnquiryController.create
);
router.patch(
  '/:id',
  requireRole([Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER]),
  validateRequest(updateEnquirySchema),
  EnquiryController.update
);

export default router;


