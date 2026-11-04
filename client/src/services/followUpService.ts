import { apiClient } from './api';
import { FollowUp, FollowUpStatus, FollowUpPriority } from '../types';

export interface FollowUpFilterParams {
  status?: string;
  type?: string;
}

const mapBackendFollowUp = (item: any): FollowUp => ({
  id: item.id,
  title: item.title,
  contactName: item.contactName,
  contactCompany: item.contactCompany,
  contactEmail: item.contactEmail || '',
  dueDate: item.dueDate ? item.dueDate.split('T')[0] : new Date().toISOString().split('T')[0],
  dueTime: item.dueTime || '12:00',
  type: item.type === 'CONTRACT_REVIEW'
    ? 'Contract Review'
    : ((item.type.charAt(0) + item.type.slice(1).toLowerCase()) as FollowUp['type']),
  status: (item.status.charAt(0) + item.status.slice(1).toLowerCase()) as FollowUpStatus,
  priority: (item.priority.charAt(0) + item.priority.slice(1).toLowerCase()) as FollowUpPriority,
  notes: item.notes || '',
});

export const followUpService = {
  async getFollowUps(params: FollowUpFilterParams = {}): Promise<FollowUp[]> {
    const response = await apiClient.get<{ success: boolean; data: any[] }>('/follow-ups', { params });
    const rawList = response.data?.data || [];
    return rawList.map(mapBackendFollowUp);
  },

  async createFollowUp(data: Omit<FollowUp, 'id'>): Promise<FollowUp> {
    const payload = {
      title: data.title.trim(),
      contactName: data.contactName.trim(),
      contactCompany: data.contactCompany.trim(),
      contactEmail: data.contactEmail?.trim() ? data.contactEmail.trim() : null,
      dueDate: data.dueDate,
      dueTime: data.dueTime?.trim() ? data.dueTime.trim() : null,
      type: data.type.toUpperCase().replace(/\s+/g, '_'),
      status: data.status ? data.status.toUpperCase() : 'PENDING',
      priority: data.priority ? data.priority.toUpperCase() : 'NORMAL',
      notes: data.notes?.trim() ? data.notes.trim() : null,
    };
    const response = await apiClient.post<{ success: boolean; data: any }>('/follow-ups', payload);
    return mapBackendFollowUp(response.data.data);
  },

  async updateFollowUp(id: string, data: Partial<FollowUp>): Promise<FollowUp> {
    const payload: any = {};
    if (data.title !== undefined) payload.title = data.title.trim();
    if (data.contactName !== undefined) payload.contactName = data.contactName.trim();
    if (data.contactCompany !== undefined) payload.contactCompany = data.contactCompany.trim();
    if (data.contactEmail !== undefined) {
      payload.contactEmail = data.contactEmail?.trim() ? data.contactEmail.trim() : null;
    }
    if (data.dueDate !== undefined) payload.dueDate = data.dueDate;
    if (data.dueTime !== undefined) {
      payload.dueTime = data.dueTime?.trim() ? data.dueTime.trim() : null;
    }
    if (data.type) payload.type = data.type.toUpperCase().replace(/\s+/g, '_');
    if (data.status) payload.status = data.status.toUpperCase();
    if (data.priority) payload.priority = data.priority.toUpperCase();
    if (data.notes !== undefined) {
      payload.notes = data.notes?.trim() ? data.notes.trim() : null;
    }

    const response = await apiClient.patch<{ success: boolean; data: any }>(`/follow-ups/${id}`, payload);
    return mapBackendFollowUp(response.data.data);
  },

  async deleteFollowUp(id: string): Promise<boolean> {
    const response = await apiClient.delete<{ success: boolean }>(`/follow-ups/${id}`);
    return response.data?.success === true;
  },
};
