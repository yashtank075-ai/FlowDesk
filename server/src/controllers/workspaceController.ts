import { Request, Response, NextFunction } from 'express';
import { WorkspaceService } from '../services/workspaceService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export class WorkspaceController {
  static async listMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const workspaceId = authReq.workspace!.id;

      const members = await WorkspaceService.listMembers(workspaceId);
      res.json({
        success: true,
        data: members,
      });
    } catch (error) {
      next(error);
    }
  }

  static async inviteMember(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const workspaceId = authReq.workspace!.id;
      const inviterId = authReq.user!.userId;
      const inviterRole = authReq.workspace!.role;

      const result = await WorkspaceService.inviteMember(
        workspaceId,
        inviterId,
        inviterRole,
        req.body
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMemberRole(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const workspaceId = authReq.workspace!.id;
      const actorId = authReq.user!.userId;
      const actorRole = authReq.workspace!.role;
      const targetMembershipId = req.params.memberId;

      const result = await WorkspaceService.updateMemberRole(
        workspaceId,
        targetMembershipId,
        req.body.role,
        actorId,
        actorRole
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getInvitationDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.params.token as string;
      const details = await WorkspaceService.getInvitationDetails(token);
      res.json({
        success: true,
        data: details,
      });
    } catch (error) {
      next(error);
    }
  }

  static async acceptInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, name, password } = req.body;
      const result = await WorkspaceService.acceptInvitation(token, { name, password });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Invitation accepted and account activated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

