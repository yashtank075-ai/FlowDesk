import { Request, Response, NextFunction } from 'express';
import { ScopedRequest } from '../middleware/workspace.js';
import { InsightsService } from '../services/insightsService.js';

export class InsightsController {
  /**
   * GET /api/insights
   * Returns deterministic business insights, attention queues, and recommendations
   */
  static async getInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      if (!workspaceId) {
        res.status(400).json({
          success: false,
          error: { message: 'Workspace context missing' },
        });
        return;
      }

      const insights = await InsightsService.getInsights(workspaceId);

      res.status(200).json({
        success: true,
        data: insights,
      });
    } catch (error) {
      next(error);
    }
  }
}
