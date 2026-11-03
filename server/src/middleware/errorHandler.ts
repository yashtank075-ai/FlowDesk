import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  errors?: any;
}

export function notFoundHandler(req: Request, res: Response, _next: NextFunction) {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      // Normalize path e.g. ['body', 'contactEmail'] -> 'contactEmail'
      const field = issue.path[0] === 'body' || issue.path[0] === 'params' || issue.path[0] === 'query'
        ? issue.path.slice(1).join('.')
        : issue.path.join('.');
      const key = field || '_general';
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }

    const firstMessage = err.issues[0]?.message || 'Validation error';

    res.status(400).json({
      success: false,
      message: firstMessage,
      errors: fieldErrors,
    });
    return;
  }

  // Handle explicit date or business validation errors with HTTP 400
  if (
    err.message &&
    (err.message.includes('valid ISO-8601 date') ||
      err.message.includes('invalid month') ||
      err.message.includes('invalid calendar date') ||
      err.message.includes('Expected YYYY-MM-DD') ||
      err.message.includes('Validation') ||
      err.message.includes('required and must be a valid date'))
  ) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error('[API Error]:', err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
