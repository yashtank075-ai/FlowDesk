import { apiClient } from './api';
import { Customer } from '../types';

export interface CustomerFilterParams {
  search?: string;
  tier?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CustomersResponse {
  customers: Customer[];
  total: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const mapBackendCustomer = (item: any): Customer => ({
  id: item.id,
  name: item.name,
  company: item.company,
  email: item.email,
  phone: item.phone || '',
  tier: (item.tier.charAt(0) + item.tier.slice(1).toLowerCase()) as Customer['tier'],
  status: (item.status.charAt(0) + item.status.slice(1).toLowerCase().replace('_', ' ')) as Customer['status'],
  mrr: Number(item.mrr) || 0,
  joinedDate: item.createdAt ? item.createdAt.split('T')[0] : '2026-10-01',
  assignedManager: item.assignedManager || 'Unassigned',
  contractRenewal: item.contractRenewal ? item.contractRenewal.split('T')[0] : '2027-10-01',
  industry: item.industry || 'Technology',
  notes: item.notes || '',
});

export const customerService = {
  async getCustomers(params: CustomerFilterParams = {}): Promise<CustomersResponse> {
    const response = await apiClient.get<{ success: boolean; data: any[]; pagination: any }>('/customers', { params });
    const rawList = response.data?.data || [];
    const customers = rawList.map(mapBackendCustomer);
    return {
      customers,
      total: response.data?.pagination?.total ?? customers.length,
      pagination: response.data?.pagination,
    };
  },

  async getCustomerById(id: string): Promise<Customer> {
    const response = await apiClient.get<{ success: boolean; data: any }>(`/customers/${id}`);
    return mapBackendCustomer(response.data.data);
  },

  async createCustomer(data: Omit<Customer, 'id' | 'joinedDate'>): Promise<Customer> {
    const payload = {
      ...data,
      mrr: Number(data.mrr),
      tier: data.tier.toUpperCase(),
      status: data.status.toUpperCase().replace(/\s+/g, '_'),
    };
    const response = await apiClient.post<{ success: boolean; data: any }>('/customers', payload);
    return mapBackendCustomer(response.data.data);
  },

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    const payload: any = { ...data };
    if (data.mrr !== undefined) payload.mrr = Number(data.mrr);
    if (data.tier) payload.tier = data.tier.toUpperCase();
    if (data.status) payload.status = data.status.toUpperCase().replace(/\s+/g, '_');

    const response = await apiClient.patch<{ success: boolean; data: any }>(`/customers/${id}`, payload);
    return mapBackendCustomer(response.data.data);
  },

  async deleteCustomer(id: string): Promise<boolean> {
    const response = await apiClient.delete<{ success: boolean }>(`/customers/${id}`);
    return response.data?.success === true;
  },
};
