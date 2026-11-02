import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  workspaceName: z.string().min(2, 'Workspace name must be at least 2 characters').max(100),
  email: z.string().email('Please provide a valid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
  confirmPassword: z.string().optional(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }).optional(),
}).refine((data) => {
  if (data.confirmPassword !== undefined && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters').max(100).optional(),
  title: z.string().max(100).optional().nullable().or(z.literal('')),
  avatarUrl: z
    .string()
    .url('Must be a valid URL (e.g. https://example.com/avatar.jpg)')
    .optional()
    .nullable()
    .or(z.literal('')),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;


