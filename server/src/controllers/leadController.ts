import { Request, Response, NextFunction } from 'express';
import { LeadService } from '../services/leadService.js';
import { ScopedRequest } from '../middleware/workspace.js';

export class LeadController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      const { search, status, source, page, limit } = req.query;

      const result = await LeadService.listLeads(workspaceId, {
        search: search as string,
        status: status as string,
        source: source as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });

      res.json({
        success: true,
        data: result.leads,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      const lead = await LeadService.getLeadById(workspaceId, req.params.id);

      if (!lead) {
        res.status(404).json({ success: false, message: 'Lead not found' });
        return;
      }

      res.json({ success: true, data: lead });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      const lead = await LeadService.createLead(workspaceId, req.body);

      res.status(201).json({
        success: true,
        message: 'Lead created successfully',
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      const lead = await LeadService.updateLead(workspaceId, req.params.id, req.body);

      if (!lead) {
        res.status(404).json({ success: false, message: 'Lead not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Lead updated successfully',
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      const deleted = await LeadService.deleteLead(workspaceId, req.params.id);

      if (!deleted) {
        res.status(404).json({ success: false, message: 'Lead not found' });
        return;
      }

      res.json({ success: true, message: 'Lead deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async convert(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      const result = await LeadService.convertLeadToCustomer(workspaceId, req.params.id, req.body);

      res.status(201).json({
        success: true,
        message: 'Lead converted to customer successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

