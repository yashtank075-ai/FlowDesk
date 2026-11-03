import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';

/**
 * Validates Origin / Referer header on cookie-authenticated sensitive endpoints
 * to defend against Cross-Site Request Forgery (CSRF).
 */
export function requireValidOrigin(req: Request, res: Response, next: NextFunction) {
  // Allow safe requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const origin = req.headers['origin'] as string | undefined;
  const referer = req.headers['referer'] as string | undefined;

  // Expected frontend origin from config (normalized without trailing slash)
  const allowedOrigin = config.clientOrigin.replace(/\/+$/, '');

  // If Origin header is present, check it strictly
  if (origin) {
    const cleanOrigin = origin.replace(/\/+$/, '');
    if (cleanOrigin !== allowedOrigin && !(config.nodeEnv !== 'production' && cleanOrigin.includes('localhost'))) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Invalid request origin',
      });
    }
    return next();
  }

  // Fallback to Referer header if Origin is omitted (e.g. older user agents)
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      if (refererOrigin !== allowedOrigin && !(config.nodeEnv !== 'production' && refererOrigin.includes('localhost'))) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Invalid request referer origin',
        });
      }
      return next();
    } catch {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Malformed referer header',
      });
    }
  }

  // In production, require either Origin or Referer for cookie-authenticated endpoints
  if (config.nodeEnv === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Missing origin verification headers',
    });
  }

  next();
}
