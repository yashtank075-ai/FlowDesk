import { Request, Response, NextFunction } from 'express';
import { EnquiryService } from '../services/enquiryService.js';
import { ScopedRequest } from '../middleware/workspace.js';

export class EnquiryController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      const { search, status, priority, page, limit } = req.query;

      // Strict safe integer parsing and bounds clamping
      let parsedPage = 1;
      if (typeof page === 'string' && page.trim() !== '') {
        const trimmed = page.trim();
        if (/^\d+$/.test(trimmed)) {
          const num = Number(trimmed);
          if (!Number.isSafeInteger(num) || num < 1) {
            res.status(400).json({
              success: false,
              message: 'Invalid pagination parameter: page must be a safe positive integer.',
            });
            return;
          }
          parsedPage = num;
        }
      }

      let parsedLimit = 20;
      if (typeof limit === 'string' && limit.trim() !== '') {
        const trimmed = limit.trim();
        if (/^\d+$/.test(trimmed)) {
          const num = Number(trimmed);
          if (!Number.isSafeInteger(num) || num < 1) {
            res.status(400).json({
              success: false,
              message: 'Invalid pagination parameter: limit must be a safe positive integer.',
            });
            return;
          }
          parsedLimit = Math.min(100, num);
        }
      }

      // Calculate and validate offset safety
      const skip = (parsedPage - 1) * parsedLimit;
      if (!Number.isSafeInteger(skip) || skip < 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid pagination parameters: calculated offset is outside the safe range.',
        });
        return;
      }

      const result = await EnquiryService.listEnquiries(workspaceId, {
        search: search as string,
        status: status as string,
        priority: priority as string,
        page: parsedPage,
        limit: parsedLimit,
      });

      res.json({
        success: true,
        data: result.enquiries,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      const enquiry = await EnquiryService.getEnquiryById(workspaceId, req.params.id);

      if (!enquiry) {
        res.status(404).json({ success: false, message: 'Enquiry not found' });
        return;
      }

      res.json({ success: true, data: enquiry });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      const enquiry = await EnquiryService.createEnquiry(workspaceId, req.body);

      res.status(201).json({
        success: true,
        message: 'Enquiry created successfully',
        data: enquiry,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      const enquiry = await EnquiryService.updateEnquiry(workspaceId, req.params.id, req.body);

      if (!enquiry) {
        res.status(404).json({ success: false, message: 'Enquiry not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Enquiry updated successfully',
        data: enquiry,
      });
    } catch (error) {
      next(error);
    }
  }
}

