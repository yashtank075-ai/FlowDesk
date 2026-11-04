import { Router } from 'express';
import { CustomerController } from '../controllers/customerController.js';
import { validateRequest } from '../middleware/validate.js';
import { createCustomerSchema, updateCustomerSchema, deleteCustomerSchema } from '../schemas/index.js';
import { requireRole } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

// GET: All 5 roles
router.get('/', CustomerController.list);
router.get('/:id', CustomerController.getById);

// POST & PATCH: OWNER, ADMIN, MANAGER
router.post(
  '/',
  requireRole([Role.OWNER, Role.ADMIN, Role.MANAGER]),
  validateRequest(createCustomerSchema),
  CustomerController.create
);
router.patch(
  '/:id',
  requireRole([Role.OWNER, Role.ADMIN, Role.MANAGER]),
  validateRequest(updateCustomerSchema),
  CustomerController.update
);

// DELETE: OWNER, ADMIN, MANAGER
router.delete(
  '/:id',
  requireRole([Role.OWNER, Role.ADMIN, Role.MANAGER]),
  validateRequest(deleteCustomerSchema),
  CustomerController.delete
);

export default router;


