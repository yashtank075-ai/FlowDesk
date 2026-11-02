import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';

export interface ScopedRequest extends Request {
  workspaceId: string;
}

/**
 * Resolves workspace context strictly from the authenticated user's verified workspace.
 * Prevents unauthorized access or spoofed X-Workspace-Id.
 */
export function resolveWorkspace(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.workspace?.id) {
    return res.status(403).json({
      success: false,
      error: 'Workspace context missing or access unauthorized',
    });
  }

  (req as ScopedRequest).workspaceId = authReq.workspace.id;
  next();
}



