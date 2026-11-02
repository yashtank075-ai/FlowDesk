import { apiClient } from './api';
import { Enquiry, EnquiryStatus, EnquiryPriority } from '../types';

export interface EnquiryFilterParams {
  search?: string;
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}

export interface EnquiriesResponse {
  enquiries: Enquiry[];
  total: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const mapBackendEnquiry = (item: any): Enquiry => ({
  id: item.id,
  ticketNumber: item.ticketNumber,
  subject: item.subject,
  customerName: item.customerName,
  customerEmail: item.customerEmail,
  category: item.category || 'General',
  priority: (item.priority.charAt(0) + item.priority.slice(1).toLowerCase()) as EnquiryPriority,
  status: item.status
    .toLowerCase()
    .split('_')
    .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ') as EnquiryStatus,
  description: item.description,
  assignedAgent: item.assignedAgent || 'Support Team',
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

export const enquiryService = {
  async getEnquiries(params: EnquiryFilterParams = {}): Promise<EnquiriesResponse> {
    const response = await apiClient.get<{ success: boolean; data: any[]; pagination: any }>('/enquiries', { params });
    const rawList = response.data?.data || [];
    const enquiries = rawList.map(mapBackendEnquiry);
    return {
      enquiries,
      total: response.data?.pagination?.total ?? enquiries.length,
      pagination: response.data?.pagination,
    };
  },

  async getEnquiryById(id: string): Promise<Enquiry> {
    const response = await apiClient.get<{ success: boolean; data: any }>(`/enquiries/${id}`);
    return mapBackendEnquiry(response.data.data);
  },

  async createEnquiry(data: Omit<Enquiry, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>): Promise<Enquiry> {
    const payload = {
      ...data,
      priority: data.priority.toUpperCase(),
      status: data.status.toUpperCase().replace(/\s+/g, '_'),
    };
    const response = await apiClient.post<{ success: boolean; data: any }>('/enquiries', payload);
    return mapBackendEnquiry(response.data.data);
  },

  async updateEnquiryStatus(id: string, status: EnquiryStatus): Promise<Enquiry> {
    const dbStatus = status.toUpperCase().replace(/\s+/g, '_');
    const response = await apiClient.patch<{ success: boolean; data: any }>(`/enquiries/${id}`, { status: dbStatus });
    return mapBackendEnquiry(response.data.data);
  },
};
