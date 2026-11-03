import React, { useState } from 'react';
import { EnquiryPriority, EnquiryStatus } from '../../types';
import { Modal } from '../common/Modal';

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    subject: string;
    customerName: string;
    customerEmail: string;
    category: string;
    priority: EnquiryPriority;
    status: EnquiryStatus;
    description: string;
    assignedAgent: string;
  }) => Promise<any>;
}

export const EnquiryModal: React.FC<EnquiryModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    subject: '',
    customerName: '',
    customerEmail: '',
    category: 'General',
    priority: 'Medium' as EnquiryPriority,
    status: 'Open' as EnquiryStatus,
    description: '',
    assignedAgent: 'Support Team',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        subject: '',
        customerName: '',
        customerEmail: '',
        category: 'General',
        priority: 'Medium',
        status: 'Open',
        description: '',
        assignedAgent: 'Support Team',
      });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.subject.trim()) errs.subject = 'Subject is required.';
    if (!formData.customerName.trim()) errs.customerName = 'Customer name is required.';
    if (!formData.customerEmail.trim()) {
      errs.customerEmail = 'Customer email is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.customerEmail.trim())) {
        errs.customerEmail = 'Valid email is required.';
      }
    }
    if (!formData.description.trim()) errs.description = 'Description / issue details are required.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      setErrors({});
      await onSave({
        subject: formData.subject.trim(),
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        category: formData.category.trim() || 'General',
        priority: formData.priority,
        status: formData.status,
        description: formData.description.trim(),
        assignedAgent: formData.assignedAgent.trim() || 'Support Team',
      });
      onClose();
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message;
      const backendFieldErrors = err?.response?.data?.errors;
      const newErrors: Record<string, string> = {};

      if (backendFieldErrors && typeof backendFieldErrors === 'object') {
        for (const [key, val] of Object.entries(backendFieldErrors)) {
          if (Array.isArray(val) && val.length > 0) {
            newErrors[key] = val[0];
          } else if (typeof val === 'string') {
            newErrors[key] = val;
          }
        }
      }

      newErrors.submit = backendMessage || err?.message || 'Failed to create enquiry ticket';
      setErrors(newErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Support Ticket"
      subtitle="Log a customer query, escalation, or billing inquiry directly into PostgreSQL"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.submit && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {errors.submit}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Subject <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="e.g. Webhook delivery failures on EU endpoint"
            className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
              errors.subject ? 'border-rose-400' : 'border-slate-200'
            }`}
          />
          {errors.subject && <p className="text-[11px] text-rose-500 mt-1">{errors.subject}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="e.g. Elena Rostova"
              className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                errors.customerName ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            {errors.customerName && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.customerName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              placeholder="e.g. elena@acme.com"
              className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                errors.customerEmail ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            {errors.customerEmail && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.customerEmail}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="General">General</option>
              <option value="Technical Support">Technical Support</option>
              <option value="Billing">Billing</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Sales Inquiry">Sales Inquiry</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value as EnquiryPriority })
              }
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Agent</label>
            <input
              type="text"
              value={formData.assignedAgent}
              onChange={(e) => setFormData({ ...formData, assignedAgent: e.target.value })}
              placeholder="e.g. Support Team"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Issue Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detailed overview of client request, error codes, reproduction steps..."
            className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none ${
              errors.description ? 'border-rose-400' : 'border-slate-200'
            }`}
          />
          {errors.description && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.description}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 inline-flex items-center gap-2"
          >
            {isSubmitting && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Create Ticket
          </button>
        </div>
      </form>
    </Modal>
  );
};

