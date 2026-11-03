import { apiClient } from './api';

export interface AttentionLead {
  id: string;
  name: string;
  company: string;
  value: number;
  status: string;
  assignedTo: string;
  reason: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  daysInactive?: number;
  dueDate?: string;
}

export interface HighPotentialLead {
  id: string;
  name: string;
  company: string;
  value: number;
  status: string;
  assignedTo: string;
  score: number;
  rationale: string;
}

export interface StageMetric {
  stage: string;
  label: string;
  count: number;
  value: number;
  percentage: number;
  color: string;
}

export interface PipelineInsights {
  totalLeads: number;
  activeLeads: number;
  wonLeads: number;
  lostLeads: number;
  conversionRate: number;
  totalPipelineValue: number;
  wonRevenue: number;
  avgDealSize: number;
  stages: StageMetric[];
}

export interface FollowUpPriorityItem {
  id: string;
  title: string;
  contactName: string;
  contactCompany: string;
  dueDate: string;
  dueTime: string | null;
  priority: 'NORMAL' | 'HIGH';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  urgency: 'OVERDUE' | 'TODAY' | 'UPCOMING';
  suggestedAction: string;
}

export interface WeeklySummary {
  newLeadsCount: number;
  newCustomersCount: number;
  newEnquiriesCount: number;
  completedFollowUpsCount: number;
  wonDealsCount: number;
  wonRevenue: number;
  startDate: string;
  endDate: string;
}

export interface AIRecommendation {
  id: string;
  type: 'CRITICAL' | 'OPPORTUNITY' | 'PROCESS' | 'EFFICIENCY';
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface BusinessInsights {
  overview: {
    totalActiveLeads: number;
    leadsNeedingAttentionCount: number;
    overdueFollowUpsCount: number;
    wonDealsCount: number;
    conversionRate: number;
    pipelineValue: number;
    totalMRR: number;
  };
  leadsNeedingAttention: AttentionLead[];
  highPotentialLeads: HighPotentialLead[];
  pipelineInsights: PipelineInsights;
  followUpPriorities: FollowUpPriorityItem[];
  weeklySummary: WeeklySummary;
  recommendations: AIRecommendation[];
  generatedAt: string;
}

export const insightsService = {
  async getInsights(): Promise<BusinessInsights> {
    const response = await apiClient.get<{ success: boolean; data: BusinessInsights }>('/insights');
    return response.data.data;
  },
};
