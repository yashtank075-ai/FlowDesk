import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadService, LeadFilterParams } from '../services/leadService';
import { customerService, CustomerFilterParams } from '../services/customerService';
import { enquiryService, EnquiryFilterParams } from '../services/enquiryService';
import { followUpService, FollowUpFilterParams } from '../services/followUpService';
import { analyticsService, LeadAcquisitionVelocityResponse } from '../services/analyticsService';
import { Lead, Customer, Enquiry, FollowUp, EnquiryStatus, EnquiryPriority } from '../types';

export const queryKeys = {
  leads: (params?: LeadFilterParams) => ['leads', params] as const,
  lead: (id: string) => ['lead', id] as const,
  dashboardSummary: () => ['dashboardSummary'] as const,
  leadAcquisitionVelocity: (period?: string) => ['leadAcquisitionVelocity', period] as const,
  customers: (params?: CustomerFilterParams) => ['customers', params] as const,
  customer: (id: string) => ['customer', id] as const,
  enquiries: (params?: EnquiryFilterParams) => ['enquiries', params] as const,
  enquiry: (id: string) => ['enquiry', id] as const,
  followUps: (params?: FollowUpFilterParams) => ['followUps', params] as const,
};

// ----------------- LEADS HOOKS -----------------
export function useLeads(params?: LeadFilterParams) {
  return useQuery({
    queryKey: queryKeys.leads(params),
    queryFn: () => leadService.getLeads(params),
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Lead, 'id' | 'createdAt'>) => leadService.createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leadAcquisitionVelocity'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) => leadService.updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leadService.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

// ----------------- DASHBOARD / ANALYTICS HOOKS -----------------
export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboardSummary(),
    queryFn: () => analyticsService.getDashboardSummary(),
  });
}

export function useLeadAcquisitionVelocity(period?: '7d' | '30d' | '90d' | '6m') {
  return useQuery<LeadAcquisitionVelocityResponse>({
    queryKey: queryKeys.leadAcquisitionVelocity(period),
    queryFn: () => analyticsService.getLeadAcquisitionVelocity(period),
  });
}

// ----------------- CUSTOMERS HOOKS -----------------
export function useCustomers(params?: CustomerFilterParams) {
  return useQuery({
    queryKey: queryKeys.customers(params),
    queryFn: () => customerService.getCustomers(params),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Customer, 'id' | 'joinedDate'>) => customerService.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) => customerService.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

// ----------------- ENQUIRIES HOOKS -----------------
export function useEnquiries(params?: EnquiryFilterParams) {
  return useQuery({
    queryKey: queryKeys.enquiries(params),
    queryFn: () => enquiryService.getEnquiries(params),
  });
}

export function useCreateEnquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      subject: string;
      customerName: string;
      customerEmail: string;
      category?: string;
      priority?: EnquiryPriority;
      status?: EnquiryStatus;
      description: string;
      assignedAgent?: string;
    }) => enquiryService.createEnquiry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

export function useUpdateEnquiryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EnquiryStatus }) =>
      enquiryService.updateEnquiryStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

export function useUpdateEnquiryPriority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: EnquiryPriority }) =>
      enquiryService.updateEnquiryPriority(id, priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

// ----------------- FOLLOW-UPS HOOKS -----------------
export function useFollowUps(params?: FollowUpFilterParams) {
  return useQuery({
    queryKey: queryKeys.followUps(params),
    queryFn: () => followUpService.getFollowUps(params),
  });
}

export function useCreateFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<FollowUp, 'id'>) => followUpService.createFollowUp(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}

export function useUpdateFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FollowUp> }) =>
      followUpService.updateFollowUp(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}
