import { z } from 'zod';
import { Role } from '@prisma/client';

export const inviteMemberSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase(),
  role: z.enum([Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER, Role.VIEWER], {
    errorMap: () => ({ message: 'Invalid role specified' }),
  }),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum([Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER, Role.VIEWER], {
    errorMap: () => ({ message: 'Invalid role specified' }),
  }),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(10, 'Invalid invitation token'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
