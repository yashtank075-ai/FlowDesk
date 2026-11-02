import React, { useState } from 'react';
import { FollowUp, FollowUpPriority } from '../../types';
import { Modal } from '../common/Modal';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<FollowUp, 'id'>, followUpId?: string) => void;
  initialFollowUp?: FollowUp | null;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialFollowUp,
}) => {
  const [formData, setFormData] = useState({
    title: initialFollowUp?.title || '',
    contactName: initialFollowUp?.contactName || '',
    contactCompany: initialFollowUp?.contactCompany || '',
    contactEmail: initialFollowUp?.contactEmail || '',
    dueDate: initialFollowUp?.dueDate || new Date().toISOString().split('T')[0],
    dueTime: initialFollowUp?.dueTime || '14:00',
    type: (initialFollowUp?.type || 'Call') as FollowUp['type'],
    priority: (initialFollowUp?.priority || 'Normal') as FollowUpPriority,
    notes: initialFollowUp?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (initialFollowUp) {
      setFormData({
        title: initialFollowUp.title,
        contactName: initialFollowUp.contactName,
        contactCompany: initialFollowUp.contactCompany,
        contactEmail: initialFollowUp.contactEmail,
        dueDate: initialFollowUp.dueDate,
        dueTime: initialFollowUp.dueTime,
        type: initialFollowUp.type,
        priority: initialFollowUp.priority,
        notes: initialFollowUp.notes || '',
      });
    } else {
      setFormData({
        title: '',
        contactName: '',
        contactCompany: '',
        contactEmail: '',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '14:00',
        type: 'Call',
        priority: 'Normal',
        notes: '',
      });
    }
    setErrors({});
  }, [initialFollowUp, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.title.trim()) errs.title = 'Title / goal is required.';
    if (!formData.contactName.trim()) errs.contactName = 'Contact name is required.';
    if (!formData.contactCompany.trim()) errs.contactCompany = 'Company is required.';
    if (!formData.dueDate) errs.dueDate = 'Due date is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave(
      {
        title: formData.title.trim(),
        contactName: formData.contactName.trim(),
        contactCompany: formData.contactCompany.trim(),
        contactEmail: formData.contactEmail.trim(),
        dueDate: formData.dueDate,
        dueTime: formData.dueTime,
        type: formData.type,
        status: initialFollowUp ? initialFollowUp.status : 'Pending',
        priority: formData.priority,
        notes: formData.notes.trim(),
      },
      initialFollowUp ? initialFollowUp.id : undefined
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialFollowUp ? 'Edit Follow-up Item' : 'Schedule Follow-up'}
      subtitle="Schedule outreach, check-ins, or contract renewal reviews"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Action Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Clarify custom SLA addendum terms"
            className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
              errors.title ? 'border-rose-400' : 'border-slate-200'
            }`}
          />
          {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contact Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              placeholder="e.g. Marcus Vance"
              className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                errors.contactName ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            {errors.contactName && <p className="text-[11px] text-rose-500 mt-1">{errors.contactName}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Company <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.contactCompany}
              onChange={(e) => setFormData({ ...formData, contactCompany: e.target.value })}
              placeholder="e.g. Vanguard Capital"
              className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                errors.contactCompany ? 'border-rose-400' : 'border-slate-200'
              }`}
            />
            {errors.contactCompany && <p className="text-[11px] text-rose-500 mt-1">{errors.contactCompany}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Due Time</label>
            <input
              type="time"
              value={formData.dueTime}
              onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Activity Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as FollowUp['type'] })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Call">Call</option>
              <option value="Meeting">Meeting</option>
              <option value="Demo">Demo</option>
              <option value="Email">Email</option>
              <option value="Contract Review">Contract Review</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as FollowUpPriority })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Normal">Normal</option>
              <option value="High">High (Immediate)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Action Notes</label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Context, agenda items, or checklist..."
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
            {initialFollowUp ? 'Update Action' : 'Schedule Item'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

