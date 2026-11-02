import { apiClient } from './api';
import { Lead } from '../types';

export interface LeadFilterParams {
  search?: string;
  status?: string;
  source?: string;
  page?: number;
  limit?: number;
}

export interface LeadsResponse {
  leads: Lead[];
  total: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const mapBackendLead = (item: any): Lead => ({
  id: item.id,
  name: item.name,
  company: item.company,
  email: item.email,
  phone: item.phone || '',
  value: Number(item.value) || 0,
  status: (item.status.charAt(0) + item.status.slice(1).toLowerCase()) as Lead['status'],
  source: (item.source.charAt(0) + item.source.slice(1).toLowerCase().replace('_', ' ')) as Lead['source'],
  assignedTo: item.assignedTo || 'Unassigned',
  createdAt: item.createdAt ? item.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
  lastContact: item.lastContact ? item.lastContact.split('T')[0] : new Date().toISOString().split('T')[0],
  notes: item.notes || '',
});

export const leadService = {
  async getLeads(params: LeadFilterParams = {}): Promise<LeadsResponse> {
    const response = await apiClient.get<{ success: boolean; data: any[]; pagination: any }>('/leads', { params });
    const rawList = response.data?.data || [];
    const leads = rawList.map(mapBackendLead);
    return {
      leads,
      total: response.data?.pagination?.total ?? leads.length,
      pagination: response.data?.pagination,
    };
  },

  async getLeadById(id: string): Promise<Lead> {
    const response = await apiClient.get<{ success: boolean; data: any }>(`/leads/${id}`);
    return mapBackendLead(response.data.data);
  },

  async createLead(data: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> {
    const payload = {
      ...data,
      value: Number(data.value),
      status: data.status.toUpperCase(),
      source: data.source.toUpperCase().replace(/\s+/g, '_'),
    };
    const response = await apiClient.post<{ success: boolean; data: any }>('/leads', payload);
    return mapBackendLead(response.data.data);
  },

  async updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
    const payload: any = { ...data };
    if (data.value !== undefined) payload.value = Number(data.value);
    if (data.status) payload.status = data.status.toUpperCase();
    if (data.source) payload.source = data.source.toUpperCase().replace(/\s+/g, '_');

    const response = await apiClient.patch<{ success: boolean; data: any }>(`/leads/${id}`, payload);
    return mapBackendLead(response.data.data);
  },

  async deleteLead(id: string): Promise<boolean> {
    const response = await apiClient.delete<{ success: boolean }>(`/leads/${id}`);
    return response.data?.success === true;
  },
};
