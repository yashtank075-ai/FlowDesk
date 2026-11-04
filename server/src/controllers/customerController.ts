import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customerService.js';
import { ScopedRequest } from '../middleware/workspace.js';

export class CustomerController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      const { search, tier, status, page, limit } = req.query;

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

      const result = await CustomerService.listCustomers(workspaceId, {
        search: search as string,
        tier: tier as string,
        status: status as string,
        page: parsedPage,
        limit: parsedLimit,
      });

      res.json({
        success: true,
        data: result.customers,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      const customer = await CustomerService.getCustomerById(workspaceId, req.params.id);

      if (!customer) {
        res.status(404).json({ success: false, message: 'Customer not found' });
        return;
      }

      res.json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      const customer = await CustomerService.createCustomer(workspaceId, req.body);

      res.status(201).json({
        success: true,
        message: 'Customer registered successfully',
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      const customer = await CustomerService.updateCustomer(workspaceId, req.params.id, req.body);

      if (!customer) {
        res.status(404).json({ success: false, message: 'Customer not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Customer updated successfully',
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      const deleted = await CustomerService.deleteCustomer(workspaceId, req.params.id);

      if (!deleted) {
        res.status(404).json({ success: false, message: 'Customer not found' });
        return;
      }

      res.json({ success: true, message: 'Customer deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

