import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/auth.js';
import { prisma } from '../config/prisma.js';
import { Role } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload & { name?: string };
  workspace?: {
    id: string;
    name: string;
    role: Role;
  };
}

export function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token missing or invalid format',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token',
    });
  }
}

/**
 * Ensures the authenticated user belongs to the target workspace.
 */
export async function requireWorkspace(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const headerWs = req.headers['x-workspace-id'] as string;
  const paramWs = req.params.workspaceId;
  const targetWorkspaceId = headerWs || paramWs;

  try {
    let membership;

    if (targetWorkspaceId) {
      membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: targetWorkspaceId,
            userId: authReq.user.userId,
          },
        },
        include: {
          workspace: true,
        },
      });
    } else {
      membership = await prisma.workspaceMember.findFirst({
        where: {
          userId: authReq.user.userId,
        },
        include: {
          workspace: true,
        },
      });
    }

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to access this workspace',
      });
    }

    authReq.workspace = {
      id: membership.workspace.id,
      name: membership.workspace.name,
      role: membership.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Enforces role-based access control.
 * OWNER > ADMIN > MANAGER > MEMBER > VIEWER
 */
export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.workspace) {
      return res.status(403).json({
        success: false,
        error: 'Workspace context missing',
      });
    }

    if (!allowedRoles.includes(authReq.workspace.role)) {
      return res.status(403).json({
        success: false,
        error: `Insufficient permissions: Requires one of [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
}
