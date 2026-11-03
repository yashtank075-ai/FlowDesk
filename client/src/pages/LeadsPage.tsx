import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Building,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Database,
  AlertTriangle,
} from 'lucide-react';
import { Lead, LeadStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { LeadModal } from '../components/leads/LeadModal';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead } from '../hooks/useApi';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';

export const LeadsPage: React.FC = () => {
  const { currentWorkspace } = useAuth();
  const workspaceCurrency = currentWorkspace?.currency || 'INR';
  const formatMoney = (val: number) => formatCurrency(val, workspaceCurrency);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // 300ms Debounce for search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // React Query Integration
  const { data, isLoading, isError, error, refetch, isFetching } = useLeads({
    search: debouncedSearch,
    status: selectedStatus,
    source: selectedSource,
    page: 1,
    limit: 100, // Fetch matching leads for client-side pagination
  });

  const createMutation = useCreateLead();
  const updateMutation = useUpdateLead();
  const deleteMutation = useDeleteLead();
  const { canCreateLeads, canEditLeads, canDeleteLeads } = usePermissions();

  const leads = data?.leads || [];

  // Pagination
  const totalPages = Math.ceil(leads.length / pageSize) || 1;
  const paginatedLeads = useMemo(() => {
    return leads.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [leads, currentPage, pageSize]);

  const handleOpenCreateModal = () => {
    setEditingLead(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setIsModalOpen(true);
  };

  const handleDeleteLead = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this lead?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleSaveLead = async (
    leadData: Omit<Lead, 'id' | 'createdAt'>,
    leadId?: string
  ) => {
    if (leadId) {
      await updateMutation.mutateAsync({ id: leadId, data: leadData });
    } else {
      await createMutation.mutateAsync(leadData);
    }
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'Won':
        return <Badge variant="emerald">Won</Badge>;
      case 'Proposal':
        return <Badge variant="amber">Proposal</Badge>;
      case 'Negotiation':
        return <Badge variant="purple">Negotiation</Badge>;
      case 'Qualified':
        return <Badge variant="indigo">Qualified</Badge>;
      case 'Contacted':
        return <Badge variant="blue">Contacted</Badge>;
      case 'Lost':
        return <Badge variant="rose">Lost</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Leads & Opportunities</h2>
            <span className="text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-600" /> PostgreSQL Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track qualified sales inquiries and advance prospects through closing stages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            title="Refresh from PostgreSQL"
            className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          {canCreateLeads && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Lead
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search leads by name, company, email..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 flex-1 md:flex-initial">
            <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700"
            >
              <option value="ALL">All Stages</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal">Proposal</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          {/* Source Filter */}
          <select
            value={selectedSource}
            onChange={(e) => {
              setSelectedSource(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700"
          >
            <option value="ALL">All Sources</option>
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Organic Search">Organic Search</option>
            <option value="Outbound">Outbound</option>
            <option value="Event">Event</option>
          </select>
        </div>
      </div>

      {/* Leads Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading leads from PostgreSQL...</span>
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-rose-500 text-xs flex flex-col items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <span>Failed to load leads: {(error as Error)?.message}</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              Try Again
            </button>
          </div>
        ) : paginatedLeads.length === 0 ? (
          <EmptyState
            title="No leads match your criteria"
            description="Try modifying search keywords or clear your stage and channel filters."
            actionText="Clear Filters"
            onAction={() => {
              setSearchInput('');
              setSelectedStatus('ALL');
              setSelectedSource('ALL');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Prospect & Company</th>
                  <th className="px-6 py-3.5">Contact Details</th>
                  <th className="px-6 py-3.5">Deal Value</th>
                  <th className="px-6 py-3.5">Pipeline Stage</th>
                  <th className="px-6 py-3.5">Source</th>
                  <th className="px-6 py-3.5">Assigned Owner</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        {lead.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        {lead.company}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-slate-700 flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {lead.email}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {lead.phone}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">
                        {formatMoney(lead.value)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Est. contract
                      </span>
                    </td>

                    <td className="px-6 py-4">{getStatusBadge(lead.status)}</td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                        {lead.source}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-slate-700 font-medium flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        {lead.assignedTo}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Touched {formatDate(lead.lastContact)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEditLeads && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(lead)}
                            title="Edit Lead"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDeleteLeads && (
                          <button
                            type="button"
                            onClick={() => handleDeleteLead(lead.id)}
                            title="Delete Lead"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {!canEditLeads && !canDeleteLeads && (
                          <span className="text-[11px] text-slate-400 italic">Read-only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <span className="text-xs text-slate-500">
            Showing <span className="font-medium text-slate-800">{leads.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-medium text-slate-800">
              {Math.min(currentPage * pageSize, leads.length)}
            </span>{' '}
            of <span className="font-medium text-slate-800">{leads.length}</span> leads
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs px-2 text-slate-600 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal for Create/Edit */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLead}
        initialLead={editingLead}
      />
    </div>
  );
};
