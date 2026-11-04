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

export interface DashboardSummaryResponse {
  kpis: {
    totalLeads: number;
    totalPipelineValue: number;
    totalCustomers: number;
    totalMRR: number;
    openEnquiries: number;
    pendingFollowUps: number;
    wonDealsCount: number;
    wonDealsRevenue: number;
    conversionRate: number; // percentage (0 - 100)
    totalFollowUps: number; // Total workspace follow-up records regardless of status
    totalEnquiries: number; // Total workspace enquiry tickets regardless of status
    totalCustomerAccounts: number; // Total customer accounts regardless of status
  };
  pipelineDistribution: Array<{
    status: string;
    label: string;
    count: number;
    percentage: number;
    value: number;
    color: string;
  }>;
  recentLeads: Array<{
    id: string;
    name: string;
    company: string;
    value: number;
    status: string;
    assignedTo: string;
    createdAt: string;
  }>;
  recentActivities: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: 'lead' | 'customer' | 'enquiry' | 'followup';
    user: string;
  }>;
  upcomingFollowUps: Array<{
    id: string;
    title: string;
    contactName: string;
    contactCompany: string;
    dueDate: string;
    dueTime: string;
    status: string;
    priority: string;
    type: string;
    isOverdue: boolean;
    isDueToday: boolean;
  }>;
}

export class AnalyticsService {
  /**
   * Comprehensive Dashboard Summary Aggregation
   */
  static async getDashboardSummary(workspaceId: string): Promise<DashboardSummaryResponse> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Parallel optimized queries with Prisma
    const [
      leads,
      customers,
      enquiries,
      followUps,
      notifications,
      activitiesFromDb,
    ] = await Promise.all([
      // All leads for counts, pipeline calculation and distribution
      prisma.lead.findMany({
        where: { workspaceId },
        select: {
          id: true,
          name: true,
          company: true,
          value: true,
          status: true,
          assignedTo: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),

      // All customers for MRR and active counts
      prisma.customer.findMany({
        where: { workspaceId },
        select: {
          id: true,
          mrr: true,
          status: true,
        },
      }),

      // Enquiries
      prisma.enquiry.findMany({
        where: { workspaceId },
        select: {
          id: true,
          status: true,
        },
      }),

      // Follow-ups
      prisma.followUp.findMany({
        where: { workspaceId },
        select: {
          id: true,
          title: true,
          contactName: true,
          contactCompany: true,
          dueDate: true,
          dueTime: true,
          status: true,
          priority: true,
          type: true,
        },
        orderBy: { dueDate: 'asc' },
      }),

      // Recent notifications (used to populate real activity stream if activities table empty)
      prisma.notification.findMany({
        where: { workspaceId },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),

      // Explicit activity table records if logged
      prisma.activity.findMany({
        where: { workspaceId },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // KPI Calculations
    const totalLeads = leads.length;
    const totalPipelineValue = leads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);

    const activeCustomersList = customers.filter((c) => c.status === 'ACTIVE');
    const totalCustomers = activeCustomersList.length;
    const totalMRR = activeCustomersList.reduce((sum, c) => sum + (Number(c.mrr) || 0), 0);

    const openEnquiries = enquiries.filter((e) => e.status !== 'RESOLVED').length;
    const pendingFollowUps = followUps.filter((f) => f.status === 'PENDING').length;

    const wonLeads = leads.filter((l) => l.status === 'WON');
    const wonDealsCount = wonLeads.length;
    const wonDealsRevenue = wonLeads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
    const conversionRate = totalLeads > 0 ? Math.round((wonDealsCount / totalLeads) * 1000) / 10 : 0;

    // Stage Distribution
    const stagesConfig = [
      { status: 'NEW', label: 'New', color: 'bg-slate-400' },
      { status: 'CONTACTED', label: 'Contacted', color: 'bg-blue-400' },
      { status: 'QUALIFIED', label: 'Qualified', color: 'bg-indigo-500' },
      { status: 'PROPOSAL', label: 'Proposal', color: 'bg-amber-400' },
      { status: 'NEGOTIATION', label: 'Negotiation', color: 'bg-purple-500' },
      { status: 'WON', label: 'Won', color: 'bg-emerald-500' },
    ];

    const pipelineDistribution = stagesConfig.map((sc) => {
      const matching = leads.filter((l) => l.status === sc.status);
      const count = matching.length;
      const value = matching.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
      const percentage = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
      return {
        status: sc.status,
        label: sc.label,
        count,
        percentage,
        value: Math.round(value * 100) / 100,
        color: sc.color,
      };
    });

    // Recent 5 leads
    const recentLeads = leads.slice(0, 5).map((l) => ({
      id: l.id,
      name: l.name,
      company: l.company,
      value: Number(l.value) || 0,
      status: (l.status.charAt(0) + l.status.slice(1).toLowerCase()) as string,
      assignedTo: l.assignedTo,
      createdAt: l.createdAt.toISOString(),
    }));

    // Real Activity Stream: Prefer actual Activity records, fallback to system notifications
    let recentActivities: DashboardSummaryResponse['recentActivities'] = [];

    if (activitiesFromDb.length > 0) {
      recentActivities = activitiesFromDb.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        timestamp: a.createdAt.toISOString(),
        type: a.type.toLowerCase() as any,
        user: a.userName,
      }));
    } else {
      // Map real system notifications to activity stream
      recentActivities = notifications.map((n) => {
        let type: 'lead' | 'customer' | 'enquiry' | 'followup' = 'lead';
        if (n.type === 'CUSTOMER_CREATED') type = 'customer';
        else if (n.type === 'ENQUIRY_CREATED' || n.type === 'ENQUIRY_STATUS_CHANGED') type = 'enquiry';
        else if (n.type === 'FOLLOWUP_SCHEDULED') type = 'followup';

        return {
          id: n.id,
          title: n.title,
          description: n.message,
          timestamp: n.createdAt.toISOString(),
          type,
          user: 'FlowDesk System',
        };
      });
    }

    // Upcoming Follow-ups (Pending, sorted chronologically with overdue indicators)
    const upcomingFollowUps = followUps
      .filter((f) => f.status === 'PENDING')
      .slice(0, 5)
      .map((f) => {
        const itemDateStr = f.dueDate.toISOString().split('T')[0];
        const isOverdue = itemDateStr < todayStr;
        const isDueToday = itemDateStr === todayStr;

        return {
          id: f.id,
          title: f.title,
          contactName: f.contactName,
          contactCompany: f.contactCompany,
          dueDate: itemDateStr,
          dueTime: f.dueTime || '12:00',
          status: 'Pending',
          priority: f.priority.charAt(0) + f.priority.slice(1).toLowerCase(),
          type: f.type.charAt(0) + f.type.slice(1).toLowerCase().replace('_', ' '),
          isOverdue,
          isDueToday,
        };
      });

    return {
      kpis: {
        totalLeads,
        totalPipelineValue: Math.round(totalPipelineValue * 100) / 100,
        totalCustomers,
        totalMRR: Math.round(totalMRR * 100) / 100,
        openEnquiries,
        pendingFollowUps,
        wonDealsCount,
        wonDealsRevenue: Math.round(wonDealsRevenue * 100) / 100,
        conversionRate,
        totalFollowUps: followUps.length,
        totalEnquiries: enquiries.length,
        totalCustomerAccounts: customers.length,
      },
      pipelineDistribution,
      recentLeads,
      recentActivities,
      upcomingFollowUps,
    };
  }

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
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
        mode = 'monthly';
        break;
      case '7d':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
        mode = 'daily';
        break;
    }

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
