import { z } from 'zod';
import { normalizeDate } from '../utils/dateUtils.js';

// Custom reusable Zod date preprocessor
export const dateSchema = (fieldName: string, required = false) =>
  z.preprocess((val) => {
    if (val === undefined || val === null || val === '') {
      return required ? undefined : null;
    }
    return normalizeDate(val, fieldName, !required);
  }, required ? z.date({ invalid_type_error: `Field '${fieldName}' must be a valid date` }) : z.date().nullable().optional());

// Optional string preprocessor: converts empty or whitespace-only strings to null
const optionalString = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
  z.string().optional().nullable()
);

// Optional email preprocessor: converts empty strings to null; if non-empty, validates email format
const optionalEmail = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
  z.string().email('Valid email is required').optional().nullable()
);

export const createLeadSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Lead name is required'),
    company: z.string().min(1, 'Company name is required'),
    email: z.string().email('Valid email address is required'),
    phone: optionalString,
    value: z.number().min(0, 'Value must be positive').default(0),
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).default('NEW'),
    source: z.enum(['WEBSITE', 'REFERRAL', 'LINKEDIN', 'ORGANIC_SEARCH', 'OUTBOUND', 'EVENT']).default('WEBSITE'),
    assignedTo: z.string().default('Unassigned'),
    lastContact: dateSchema('lastContact', false),
    notes: optionalString,
  }),
});

export const updateLeadSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid lead ID format'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    company: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: optionalString,
    value: z.number().min(0).optional(),
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).optional(),
    source: z.enum(['WEBSITE', 'REFERRAL', 'LINKEDIN', 'ORGANIC_SEARCH', 'OUTBOUND', 'EVENT']).optional(),
    assignedTo: z.string().optional(),
    lastContact: dateSchema('lastContact', false),
    notes: optionalString,
  }),
});

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Primary contact name is required'),
    company: z.string().min(1, 'Company name is required'),
    email: z.string().email('Valid email is required'),
    phone: optionalString,
    mrr: z.number().min(0, 'MRR must be non-negative').default(0),
    status: z.enum(['ACTIVE', 'CHURNED', 'AT_RISK']).default('ACTIVE'),
    plan: z.string().default('Starter'),
    joinedDate: dateSchema('joinedDate', false),
    notes: optionalString,
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    company: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: optionalString,
    mrr: z.number().min(0).optional(),
    status: z.enum(['ACTIVE', 'CHURNED', 'AT_RISK']).optional(),
    plan: z.string().optional(),
    joinedDate: dateSchema('joinedDate', false),
    notes: optionalString,
  }),
});

export const createEnquirySchema = z.object({
  body: z.object({
    subject: z.string().min(1, 'Subject is required'),
    customerName: z.string().min(1, 'Customer name is required'),
    customerEmail: z.string().email('Valid email is required'),
    category: z.string().default('General'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'RESOLVED']).default('OPEN'),
    description: z.string().min(1, 'Description is required'),
    assignedAgent: z.string().default('Unassigned'),
  }),
});

export const updateEnquirySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid enquiry ID'),
  }),
  body: z.object({
    subject: z.string().min(1).optional(),
    customerName: z.string().min(1).optional(),
    customerEmail: z.string().email().optional(),
    category: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'RESOLVED']).optional(),
    description: z.string().optional(),
    assignedAgent: z.string().optional(),
  }),
});

export const createFollowUpSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Action title is required'),
    contactName: z.string().min(1, 'Contact name is required'),
    contactCompany: z.string().min(1, 'Company is required'),
    contactEmail: optionalEmail,
    dueDate: dateSchema('dueDate', true),
    dueTime: optionalString,
    type: z.enum(['CALL', 'MEETING', 'DEMO', 'EMAIL', 'CONTRACT_REVIEW']).default('CALL'),
    status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).default('PENDING'),
    priority: z.enum(['NORMAL', 'HIGH']).default('NORMAL'),
    notes: optionalString,
  }),
});

export const updateFollowUpSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid follow-up ID'),
  }),
  body: z.object({
    title: z.string().min(1).optional(),
    contactName: z.string().min(1).optional(),
    contactCompany: z.string().min(1).optional(),
    contactEmail: optionalEmail,
    dueDate: dateSchema('dueDate', false),
    dueTime: optionalString,
    type: z.enum(['CALL', 'MEETING', 'DEMO', 'EMAIL', 'CONTRACT_REVIEW']).optional(),
    status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
    priority: z.enum(['NORMAL', 'HIGH']).optional(),
    notes: optionalString,
  }),
});
