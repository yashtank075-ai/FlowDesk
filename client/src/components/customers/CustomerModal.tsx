import React, { useState } from 'react';
import { Customer, CustomerTier, CustomerStatus } from '../../types';
import { Modal } from '../common/Modal';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (custData: Omit<Customer, 'id' | 'joinedDate'>, customerId?: string) => Promise<void> | void;
  initialCustomer?: Customer | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCustomer,
}) => {
  const [formData, setFormData] = useState({
    name: initialCustomer?.name || '',
    company: initialCustomer?.company || '',
    email: initialCustomer?.email || '',
    phone: initialCustomer?.phone || '',
    tier: (initialCustomer?.tier || 'Growth') as CustomerTier,
    status: (initialCustomer?.status || 'Active') as CustomerStatus,
    mrr: initialCustomer?.mrr?.toString() || '1500',
    assignedManager: initialCustomer?.assignedManager || 'Sarah Jenkins',
    contractRenewal: initialCustomer?.contractRenewal || '2027-11-01',
    industry: initialCustomer?.industry || 'Technology & SaaS',
    notes: initialCustomer?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (initialCustomer) {
      setFormData({
        name: initialCustomer.name,
        company: initialCustomer.company,
        email: initialCustomer.email,
        phone: initialCustomer.phone,
        tier: initialCustomer.tier,
        status: initialCustomer.status,
        mrr: initialCustomer.mrr.toString(),
        assignedManager: initialCustomer.assignedManager,
        contractRenewal: initialCustomer.contractRenewal,
        industry: initialCustomer.industry,
        notes: initialCustomer.notes || '',
      });
    } else {
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        tier: 'Growth',
        status: 'Active',
        mrr: '1500',
        assignedManager: 'Sarah Jenkins',
        contractRenewal: '2027-11-01',
        industry: 'Technology & SaaS',
        notes: '',
      });
    }
    setErrors({});
    setIsSubmitting(false);
  }, [initialCustomer, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Contact name is required.';
    if (!formData.company.trim()) errs.company = 'Company name is required.';
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Valid email address is required.';
    }
    if (!formData.mrr || isNaN(Number(formData.mrr)) || Number(formData.mrr) < 0) {
      errs.mrr = 'Valid MRR amount is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      setErrors({});
      await onSave(
        {
          name: formData.name.trim(),
          company: formData.company.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || '',
          tier: formData.tier,
          status: formData.status,
          mrr: Number(formData.mrr),
          assignedManager: formData.assignedManager.trim() || 'Unassigned',
          contractRenewal: formData.contractRenewal,
          industry: formData.industry.trim() || 'Software & Services',
          notes: formData.notes.trim(),
        },
        initialCustomer ? initialCustomer.id : undefined
      );
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

      newErrors.submit = backendMessage || err?.message || 'Failed to save customer account';
      setErrors(newErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialCustomer ? 'Edit Customer Account' : 'Register Customer'}
      subtitle="Configure account contract tiers, recurring revenue, and designated success manager"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.submit && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {errors.submit}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Primary Contact <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. David Kim"
              className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                errors.name ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="e.g. Nexus Health Tech"
              className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                errors.company ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            {errors.company && <p className="text-[11px] text-rose-500 mt-1">{errors.company}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. d.kim@nexushealth.io"
              className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                errors.email ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. +1 (555) 382-9901"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Monthly Recurring Revenue (USD) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={formData.mrr}
              onChange={(e) => setFormData({ ...formData, mrr: e.target.value })}
              placeholder="1500"
              className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                errors.mrr ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            {errors.mrr && <p className="text-[11px] text-rose-500 mt-1">{errors.mrr}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Service Tier</label>
            <select
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value as CustomerTier })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Starter">Starter</option>
              <option value="Growth">Growth</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Account Health</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Active">Active</option>
              <option value="Onboarding">Onboarding</option>
              <option value="At Risk">At Risk</option>
              <option value="Churned">Churned</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Designated Manager
            </label>
            <input
              type="text"
              value={formData.assignedManager}
              onChange={(e) => setFormData({ ...formData, assignedManager: e.target.value })}
              placeholder="e.g. Sarah Jenkins"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Renewal Date</label>
            <input
              type="date"
              value={formData.contractRenewal}
              onChange={(e) => setFormData({ ...formData, contractRenewal: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Industry</label>
            <input
              type="text"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              placeholder="e.g. B2B SaaS"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Account Notes</label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Key stakeholder context, custom SLAs, compliance mandates..."
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
          />
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
            {initialCustomer ? 'Update Profile' : 'Register Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
