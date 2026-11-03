import { Request, Response, NextFunction } from 'express';
import { SearchService } from '../services/searchService.js';
import { ScopedRequest } from '../middleware/workspace.js';

export class SearchController {
  /**
   * GET /api/search?q=query&type=all|leads|customers|enquiries|follow-ups&limit=5
   */
  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      if (!workspaceId) {
        return res.status(400).json({ success: false, message: 'Workspace context is required.' });
      }

      const q = (req.query.q as string) || '';
      const type = (req.query.type as any) || 'all';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;

      const result = await SearchService.search(workspaceId, q, type, limit);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
