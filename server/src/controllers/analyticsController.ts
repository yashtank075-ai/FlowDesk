import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analyticsService.js';
import { ScopedRequest } from '../middleware/workspace.js';

export class AnalyticsController {
  /**
   * GET /api/dashboard/summary
   * Aggregated real-time metrics, pipeline distribution, activities, and follow-ups.
   */
  static async getDashboardSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      if (!workspaceId) {
        return res.status(400).json({ success: false, message: 'Workspace context is required.' });
      }

      const summary = await AnalyticsService.getDashboardSummary(workspaceId);

      return res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/dashboard/lead-acquisition-velocity?period=7d|30d|90d|6m
   */
  static async getLeadAcquisitionVelocity(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      if (!workspaceId) {
        return res.status(400).json({ success: false, message: 'Workspace context is required.' });
      }

      const rawPeriod = req.query.period as string | undefined;
      const validPeriods = ['7d', '30d', '90d', '6m'] as const;
      const period = validPeriods.includes(rawPeriod as any)
        ? (rawPeriod as '7d' | '30d' | '90d' | '6m')
        : '7d';

      const result = await AnalyticsService.getLeadAcquisitionVelocity(workspaceId, period);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
