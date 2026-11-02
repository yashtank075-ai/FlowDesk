import dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DEMO_WORKSPACE_ID: z.string().default('00000000-0000-0000-0000-000000000001'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ [FATAL] Environment variable validation failed:');
  console.error(parsedEnv.error.format());
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid environment configuration in production');
  }
}

const validated = parsedEnv.success ? parsedEnv.data : (process.env as any);

const isProd = (validated.NODE_ENV || process.env.NODE_ENV) === 'production';

export const config = {
  port: validated.PORT || parseInt(process.env.PORT || '5000', 10),
  nodeEnv: validated.NODE_ENV || process.env.NODE_ENV || 'development',
  clientOrigin: validated.CLIENT_ORIGIN || process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  databaseUrl: validated.DATABASE_URL || process.env.DATABASE_URL || '',
  demoWorkspaceId: validated.DEMO_WORKSPACE_ID || process.env.DEMO_WORKSPACE_ID || '00000000-0000-0000-0000-000000000001',
  jwt: {
    accessSecret: validated.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET || 'flowdesk-default-access-secret-change-in-prod',
    accessExpiresIn: validated.JWT_ACCESS_EXPIRES_IN || process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshSecret: validated.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET || 'flowdesk-default-refresh-secret-change-in-prod',
    refreshExpiresIn: validated.JWT_REFRESH_EXPIRES_IN || process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cookie: {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  },
};
