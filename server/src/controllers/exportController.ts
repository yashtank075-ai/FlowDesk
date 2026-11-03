import { Request, Response, NextFunction } from 'express';
import { ExportService, ReportType, ExportFormat } from '../services/exportService.js';
import { ScopedRequest } from '../middleware/workspace.js';

export class ExportController {
  /**
   * GET /api/export/:type?format=csv|pdf
   * Accessible by all 5 roles (OWNER, ADMIN, MANAGER, MEMBER, VIEWER) for active workspace.
   */
  static async export(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      if (!workspaceId) {
        return res.status(400).json({ success: false, message: 'Workspace context is required.' });
      }

      const { type } = req.params;
      const validTypes: ReportType[] = ['leads', 'customers', 'enquiries', 'follow-ups', 'analytics'];

      if (!validTypes.includes(type as ReportType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid report type: '${type}'. Must be one of: ${validTypes.join(', ')}`,
        });
      }

      const formatQuery = (req.query.format as string)?.toLowerCase();
      const format: ExportFormat = formatQuery === 'pdf' ? 'pdf' : 'csv';

      const result = await ExportService.exportReport(workspaceId, type as ReportType, format);

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

      return res.status(200).send(result.buffer);
    } catch (error) {
      next(error);
    }
  }
}

