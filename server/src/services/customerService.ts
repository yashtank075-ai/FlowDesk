import { prisma } from '../config/prisma.js';
import { normalizeDate } from '../utils/dateUtils.js';
import { NotificationService } from './notificationService.js';

export interface CustomerFilterOptions {
  search?: string;
  tier?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export class CustomerService {
  static async listCustomers(workspaceId: string, options: CustomerFilterOptions = {}) {
    const { search, tier, status, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = { workspaceId };

    if (tier && tier !== 'ALL') {
      where.tier = tier.toUpperCase();
    }

    if (status && status !== 'ALL') {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getCustomerById(workspaceId: string, id: string) {
    return prisma.customer.findFirst({
      where: { id, workspaceId },
    });
  }

  static async createCustomer(workspaceId: string, data: any) {
    const contractRenewalDate = normalizeDate(data.contractRenewal, 'contractRenewal');

    const created = await prisma.customer.create({
      data: {
        ...data,
        contractRenewal: contractRenewalDate,
        workspaceId,
      },
    });

    await NotificationService.createNotification({
      workspaceId,
      title: 'New Customer Registered',
      message: `${created.name} (${created.company}) registered as active customer.`,
      type: 'CUSTOMER_CREATED',
      link: '/customers',
    });

    return created;
  }

  static async updateCustomer(workspaceId: string, id: string, data: any) {
    const existing = await prisma.customer.findFirst({ where: { id, workspaceId } });
    if (!existing) return null;

    let contractRenewalDate: Date | null | undefined = undefined;
    if (data.contractRenewal !== undefined) {
      contractRenewalDate = normalizeDate(data.contractRenewal, 'contractRenewal');
    }

    return prisma.customer.update({
      where: { id, workspaceId },
      data: {
        ...data,
        ...(data.contractRenewal !== undefined ? { contractRenewal: contractRenewalDate } : {}),
      },
    });
  }
}
