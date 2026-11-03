import { apiClient } from './api';

export interface VelocityDataPoint {
  date: string;
  name: string;
  leads: number;
  converted: number;
  revenue: number;
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
    conversionRate: number;
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

export const analyticsService = {
  async getDashboardSummary(): Promise<DashboardSummaryResponse> {
    const response = await apiClient.get<{ success: boolean; data: DashboardSummaryResponse }>(
      '/dashboard/summary'
    );
    return response.data.data;
  },

  async getLeadAcquisitionVelocity(
    period: '7d' | '30d' | '90d' | '6m' = '7d'
  ): Promise<LeadAcquisitionVelocityResponse> {
    const response = await apiClient.get<{ success: boolean; data: LeadAcquisitionVelocityResponse }>(
      '/dashboard/lead-acquisition-velocity',
      {
        params: { period },
      }
    );
    return response.data.data;
  },
};
