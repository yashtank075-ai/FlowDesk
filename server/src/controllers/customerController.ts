import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customerService.js';
import { ScopedRequest } from '../middleware/workspace.js';

export class CustomerController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = (req as ScopedRequest).workspaceId;
      const { search, tier, status, page, limit } = req.query;

      const result = await CustomerService.listCustomers(workspaceId, {
        search: search as string,
        tier: tier as string,
        status: status as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
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
}

