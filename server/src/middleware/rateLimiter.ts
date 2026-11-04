import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';
import { AuthenticatedRequest } from './auth.js';

/**
 * Generates rate limit key prioritizing authenticated user ID over client IP address.
 * Uses express-rate-limit's built-in ipKeyGenerator to ensure proper IPv6 normalization
 * and safe handling behind reverse proxies (like Render).
 */
export function userOrIpKeyGenerator(req: Request): string {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user?.userId) {
    return `user:${authReq.user.userId}`;
  }
  return ipKeyGenerator(req.ip ?? '127.0.0.1');
}

/**
 * Strict rate limiting for authentication endpoints (/login, /register)
 * to prevent credential stuffing and brute-force attacks.
 * Limit: 30 requests per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per 15m window
  standardHeaders: true, // draft-6 / draft-7 RateLimit headers: RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset
  legacyHeaders: false, // X-RateLimit-* disabled
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? '127.0.0.1'),
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

/**
 * API-wide business rate limiter to protect authenticated CRM routes against scraping and abuse.
 * Keying: Uses authenticated user ID when available, falling back to IP.
 * Limit: 180 requests per minute (~3 req/sec continuous), ample for heavy CRM usage, tab sync,
 * and background refetches without interrupting legitimate operators, while strictly curbing automated scrapers.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 180, // 180 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKeyGenerator,
  message: {
    success: false,
    error: 'Rate limit exceeded. Too many requests. Please wait a moment before trying again.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});
