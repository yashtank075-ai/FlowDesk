import { Router } from 'express';
import { WorkspaceController } from '../controllers/workspaceController.js';
import { validateBody } from '../middleware/validate.js';
import {
  inviteMemberSchema,
  updateMemberRoleSchema,
  acceptInvitationSchema,
} from '../schemas/workspaceSchemas.js';
import { authenticateUser, requireWorkspace, requireRole } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { Role } from '@prisma/client';

const router = Router();

// Public acceptance & verification of invitation
router.get('/invitations/details/:token', WorkspaceController.getInvitationDetails);
router.post('/invitations/accept', validateBody(acceptInvitationSchema), WorkspaceController.acceptInvitation);

// Authenticated workspace routes (protected with apiLimiter, auth, and workspace validation)
router.use(authenticateUser, apiLimiter, requireWorkspace);

// GET /api/workspace/members - All 5 roles can view members
router.get('/members', WorkspaceController.listMembers);

// POST /api/workspace/members - OWNER & ADMIN can invite
router.post(
  '/members',
  requireRole([Role.OWNER, Role.ADMIN]),
  validateBody(inviteMemberSchema),
  WorkspaceController.inviteMember
);

// PATCH /api/workspace/members/:memberId - Strictly OWNER can change roles
router.patch(
  '/members/:memberId',
  requireRole([Role.OWNER]),
  validateBody(updateMemberRoleSchema),
  WorkspaceController.updateMemberRole
);

export default router;

