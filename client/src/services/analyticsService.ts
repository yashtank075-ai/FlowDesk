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

export const analyticsService = {
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

