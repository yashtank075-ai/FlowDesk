import { prisma } from '../config/prisma.js';

export interface VelocityDataPoint {
  date: string;       // ISO YYYY-MM-DD or Month YYYY-MM
  name: string;       // Formatted label for X-axis (e.g., 'Mon', 'Nov 02', 'Oct')
  leads: number;      // Total leads created in interval
  converted: number;  // Leads won in interval
  revenue: number;    // Total value of leads won in interval
}

export interface LeadAcquisitionVelocityResponse {
  period: '7d' | '30d' | '90d' | '6m';
  totalLeads: number;
  totalConverted: number;
  totalRevenue: number;
  data: VelocityDataPoint[];
}

export class AnalyticsService {
  /**
   * Calculate lead acquisition velocity grouped chronologically by intervals with 0-fill.
   */
  static async getLeadAcquisitionVelocity(
    workspaceId: string,
    period: '7d' | '30d' | '90d' | '6m' = '7d'
  ): Promise<LeadAcquisitionVelocityResponse> {
    const now = new Date();
    let startDate: Date;
    let mode: 'daily' | 'monthly' = 'daily';

    switch (period) {
      case '30d':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
        mode = 'daily';
        break;
      case '90d':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89, 0, 0, 0, 0);
        mode = 'daily';
        break;
      case '6m':
        // Past 6 calendar months
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
        mode = 'monthly';
        break;
      case '7d':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
        mode = 'daily';
        break;
    }

    // Query leads strictly for this workspace created on or after startDate
    const leads = await prisma.lead.findMany({
      where: {
        workspaceId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        id: true,
        createdAt: true,
        status: true,
        value: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const weekdayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dataPoints: VelocityDataPoint[] = [];

    if (mode === 'daily') {
      // Determine number of days
      const daysCount = period === '30d' ? 30 : period === '90d' ? 90 : 7;
      const buckets: Record<string, { leads: number; converted: number; revenue: number; label: string }> = {};

      for (let i = 0; i < daysCount; i++) {
        const d = new Date(startDate.getTime());
        d.setDate(d.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const key = `${yyyy}-${mm}-${dd}`;

        const label =
          period === '7d'
            ? weekdayShort[d.getDay()]
            : `${monthShort[d.getMonth()]} ${dd}`;

        buckets[key] = {
          leads: 0,
          converted: 0,
          revenue: 0,
          label,
        };
      }

      for (const lead of leads) {
        const d = lead.createdAt;
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const key = `${yyyy}-${mm}-${dd}`;

        if (buckets[key]) {
          buckets[key].leads += 1;
          if (lead.status === 'WON') {
            buckets[key].converted += 1;
            buckets[key].revenue += Number(lead.value) || 0;
          }
        }
      }

      for (const [key, val] of Object.entries(buckets)) {
        dataPoints.push({
          date: key,
          name: val.label,
          leads: val.leads,
          converted: val.converted,
          revenue: Math.round(val.revenue * 100) / 100,
        });
      }
    } else {
      // Monthly mode (6m)
      const buckets: Record<string, { leads: number; converted: number; revenue: number; label: string }> = {};

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const key = `${yyyy}-${mm}`;
        buckets[key] = {
          leads: 0,
          converted: 0,
          revenue: 0,
          label: monthShort[d.getMonth()],
        };
      }

      for (const lead of leads) {
        const d = lead.createdAt;
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const key = `${yyyy}-${mm}`;

        if (buckets[key]) {
          buckets[key].leads += 1;
          if (lead.status === 'WON') {
            buckets[key].converted += 1;
            buckets[key].revenue += Number(lead.value) || 0;
          }
        }
      }

      for (const [key, val] of Object.entries(buckets)) {
        dataPoints.push({
          date: key,
          name: val.label,
          leads: val.leads,
          converted: val.converted,
          revenue: Math.round(val.revenue * 100) / 100,
        });
      }
    }

    const totalLeads = dataPoints.reduce((sum, p) => sum + p.leads, 0);
    const totalConverted = dataPoints.reduce((sum, p) => sum + p.converted, 0);
    const totalRevenue = dataPoints.reduce((sum, p) => sum + p.revenue, 0);

    return {
      period,
      totalLeads,
      totalConverted,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      data: dataPoints,
    };
  }
}

