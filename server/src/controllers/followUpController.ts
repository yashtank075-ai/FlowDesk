import { Request, Response, NextFunction } from 'express';
import { FollowUpService } from '../services/followUpService.js';
import { ScopedRequest } from '../middleware/workspace.js';

export class FollowUpController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      const { status, type } = req.query;

      const followUps = await FollowUpService.listFollowUps(workspaceId, {
        status: status as string,
        type: type as string,
      });

      res.json({
        success: true,
        data: followUps,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      const followUp = await FollowUpService.createFollowUp(workspaceId, req.body);

      res.status(201).json({
        success: true,
        message: 'Follow-up scheduled successfully',
        data: followUp,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      const followUp = await FollowUpService.updateFollowUp(workspaceId, req.params.id, req.body);

      if (!followUp) {
        res.status(404).json({ success: false, message: 'Follow-up item not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Follow-up item updated',
        data: followUp,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      const deleted = await FollowUpService.deleteFollowUp(workspaceId, req.params.id);

      if (!deleted) {
        res.status(404).json({ success: false, message: 'Follow-up item not found' });
        return;
      }

      res.json({ success: true, message: 'Follow-up item deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

