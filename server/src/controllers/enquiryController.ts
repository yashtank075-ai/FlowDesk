import { Request, Response, NextFunction } from 'express';
import { EnquiryService } from '../services/enquiryService.js';
import { ScopedRequest } from '../middleware/workspace.js';

export class EnquiryController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      const { search, status, priority, page, limit } = req.query;

      const result = await EnquiryService.listEnquiries(workspaceId, {
        search: search as string,
        status: status as string,
        priority: priority as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
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

