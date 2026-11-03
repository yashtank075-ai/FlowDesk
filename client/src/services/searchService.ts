import { apiClient } from './api';

export interface SearchLeadResult {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  status: string;
  value: number;
}

export interface SearchCustomerResult {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  status: string;
  tier: string;
  mrr: number;
}

export interface SearchEnquiryResult {
  id: string;
  ticketNumber: string;
  subject: string;
  customerName: string;
  customerEmail: string;
  status: string;
  priority: string;
}

export interface SearchFollowUpResult {
  id: string;
  title: string;
  contactName: string;
  contactCompany: string;
  status: string;
  dueDate: string;
  dueTime: string;
  type: string;
}

export interface GlobalSearchResponse {
  query: string;
  results: {
    leads: SearchLeadResult[];
    customers: SearchCustomerResult[];
    enquiries: SearchEnquiryResult[];
    followUps: SearchFollowUpResult[];
  };
  total: number;
}

export interface SearchParams {
  q: string;
  type?: 'all' | 'leads' | 'customers' | 'enquiries' | 'follow-ups';
  limit?: number;
}

export const searchService = {
  /**
   * Search across workspace records
   */
  async search(params: SearchParams): Promise<GlobalSearchResponse> {
    if (!params.q || params.q.trim().length < 2) {
      return {
        query: params.q,
        results: { leads: [], customers: [], enquiries: [], followUps: [] },
        total: 0,
      };
    }

    const response = await apiClient.get<{ success: boolean; data: GlobalSearchResponse }>('/search', {
      params,
    });
    return response.data.data;
  },
};
