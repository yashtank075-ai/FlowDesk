import React, { useState } from 'react';
import { Lead, LeadStatus, LeadSource } from '../../types';
import { Modal } from '../common/Modal';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (leadData: Omit<Lead, 'id' | 'createdAt'>, leadId?: string) => void;
  initialLead?: Lead | null;
}

const statusOptions: LeadStatus[] = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
];

const sourceOptions: LeadSource[] = [
  'Website',
  'Referral',
  'LinkedIn',
  'Organic Search',
  'Outbound',
  'Event',
];

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialLead,
}) => {
  const [formData, setFormData] = useState({
    name: initialLead?.name || '',
    company: initialLead?.company || '',
    email: initialLead?.email || '',
    phone: initialLead?.phone || '',
    value: initialLead?.value?.toString() || '15000',
    status: (initialLead?.status || 'New') as LeadStatus,
    source: (initialLead?.source || 'Website') as LeadSource,
    assignedTo: initialLead?.assignedTo || 'Sarah Jenkins',
    lastContact: initialLead?.lastContact || new Date().toISOString().split('T')[0],
    notes: initialLead?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync state when initialLead changes or modal opens
  React.useEffect(() => {
    if (initialLead) {
      setFormData({
        name: initialLead.name,
        company: initialLead.company,
        email: initialLead.email,
        phone: initialLead.phone,
        value: initialLead.value.toString(),
        status: initialLead.status,
        source: initialLead.source,
        assignedTo: initialLead.assignedTo,
        lastContact: initialLead.lastContact,
        notes: initialLead.notes || '',
      });
    } else {
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        value: '15000',
        status: 'New',
        source: 'Website',
        assignedTo: 'Sarah Jenkins',
        lastContact: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
    setErrors({});
  }, [initialLead, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Contact name is required.';
    if (!formData.company.trim()) errs.company = 'Company name is required.';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please provide a valid email format.';
    }
    if (!formData.value || isNaN(Number(formData.value)) || Number(formData.value) < 0) {
      errs.value = 'Valid estimated value is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave(
      {
        name: formData.name.trim(),
        company: formData.company.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || '+1 (555) 000-0000',
        value: Number(formData.value),
        status: formData.status,
        source: formData.source,
        assignedTo: formData.assignedTo,
        lastContact: formData.lastContact,
        notes: formData.notes.trim(),
      },
      initialLead ? initialLead.id : undefined
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialLead ? 'Edit Lead Opportunity' : 'Create New Lead'}
      subtitle={
        initialLead
          ? 'Update pipeline stage, deal valuation, and customer notes'
          : 'Capture a prospective customer into the FlowDesk sales pipeline'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contact Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Elena Rostova"
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
              placeholder="e.g. Apex Logistics"
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
              Business Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="elena@company.com"
              className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                errors.email ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (415) 890-1243"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Estimated Value ($) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                errors.value ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            {errors.value && <p className="text-[11px] text-rose-500 mt-1">{errors.value}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pipeline Stage</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {statusOptions.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Source</label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value as LeadSource })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {sourceOptions.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Owner</label>
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Sarah Jenkins">Sarah Jenkins (Senior AE)</option>
              <option value="Alex Morgan">Alex Morgan (Account Exec)</option>
              <option value="David Miller">David Miller (VP Sales)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Last Contact Date</label>
            <input
              type="date"
              value={formData.lastContact}
              onChange={(e) => setFormData({ ...formData, lastContact: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Deal Notes</label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Add context, key requirements, or conversation highlights..."
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
          >
            {initialLead ? 'Save Changes' : 'Create Lead'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

