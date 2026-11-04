import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  User,
  Clock,
  RefreshCw,
  Database,
  AlertTriangle,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Enquiry, EnquiryPriority, EnquiryStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { formatDateTime } from '../utils/formatters';
import {
  useEnquiries,
  useCreateEnquiry,
  useUpdateEnquiryStatus,
  useUpdateEnquiryPriority,
} from '../hooks/useApi';
import { usePermissions } from '../hooks/usePermissions';
import { EnquiryModal } from '../components/enquiries/EnquiryModal';

export const EnquiriesPage: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [activeEnquiryId, setActiveEnquiryId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 300ms Debounce for search input to prevent rapid unnecessary queries
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // React Query
  const { data, isLoading, isError, error, refetch, isFetching } = useEnquiries({
    search: debouncedSearch,
    status: selectedStatus,
    priority: selectedPriority,
    page: currentPage,
    limit: pageSize,
  });

  const createEnquiryMutation = useCreateEnquiry();
  const updateStatusMutation = useUpdateEnquiryStatus();
  const updatePriorityMutation = useUpdateEnquiryPriority();
  const { canCreateEnquiries, canEditEnquiries } = usePermissions();

  const enquiries = data?.enquiries || [];
  const totalEnquiries = data?.pagination?.total ?? (data?.total ?? enquiries.length);
  const totalPages = data?.pagination?.totalPages ?? (Math.ceil(totalEnquiries / pageSize) || 1);
  const activeEnquiry = enquiries.find((e) => e.id === activeEnquiryId) || enquiries[0] || null;

  const handleCreateEnquiry = async (formData: any) => {
    const created = await createEnquiryMutation.mutateAsync(formData);
    if (created?.id) {
      setActiveEnquiryId(created.id);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: EnquiryStatus) => {
    await updateStatusMutation.mutateAsync({ id, status: newStatus });
  };

  const handleUpdatePriority = async (id: string, newPriority: EnquiryPriority) => {
    await updatePriorityMutation.mutateAsync({ id, priority: newPriority });
  };

  const getPriorityBadge = (priority: EnquiryPriority) => {
    switch (priority) {
      case 'Urgent':
        return <Badge variant="rose">Urgent</Badge>;
      case 'High':
        return <Badge variant="amber">High Priority</Badge>;
      case 'Medium':
        return <Badge variant="blue">Medium</Badge>;
      default:
        return <Badge variant="slate">Low</Badge>;
    }
  };

  const getStatusBadge = (status: EnquiryStatus) => {
    switch (status) {
      case 'Open':
        return <Badge variant="blue">Open</Badge>;
      case 'In Progress':
        return <Badge variant="amber">In Progress</Badge>;
      case 'Waiting on Client':
        return <Badge variant="purple">Waiting on Client</Badge>;
      case 'Resolved':
        return <Badge variant="emerald">Resolved</Badge>;
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
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Support & Enquiries</h2>
            <span className="text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-600" /> PostgreSQL Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Resolve customer queries, technical escalation issues, and billing requests
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            title="Refresh tickets from PostgreSQL"
            className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-xs text-slate-500 font-medium">
            Open Tickets:{' '}
            <strong className="text-slate-800">
              {enquiries.filter((e) => e.status !== 'Resolved').length}
            </strong>
          </span>
          {canCreateEnquiries && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              New Ticket
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
            placeholder="Search tickets by subject, ID, client..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
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
              <option value="ALL">All Ticket Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting on Client">Waiting on Client</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <select
            value={selectedPriority}
            onChange={(e) => {
              setSelectedPriority(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700"
          >
            <option value="ALL">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Main Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Enquiry List Column (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
              <span>Loading support tickets from PostgreSQL...</span>
            </div>
          ) : isError ? (
            <div className="py-16 text-center text-rose-500 text-xs flex flex-col items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>Failed to load tickets: {(error as Error)?.message}</span>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Try Again
              </button>
            </div>
          ) : enquiries.length === 0 ? (
            !debouncedSearch && selectedStatus === 'ALL' && selectedPriority === 'ALL' ? (
              <EmptyState
                title="No support enquiries or tickets yet"
                description="Enquiries help your team triage client requests, resolve customer issues, assign owners, and manage SLA priorities."
                actionText={canCreateEnquiries ? 'Log First Enquiry' : undefined}
                onAction={canCreateEnquiries ? () => setIsModalOpen(true) : undefined}
              />
            ) : (
              <EmptyState
                title="No support enquiries match filters"
                description="No tickets correspond to the current search query or filter settings."
                actionText={canCreateEnquiries ? 'Create Ticket' : 'Reset Search'}
                onAction={() => {
                  if (canCreateEnquiries) {
                    setIsModalOpen(true);
                  } else {
                    setSearchInput('');
                    setSelectedStatus('ALL');
                    setSelectedPriority('ALL');
                  }
                }}
              />
            )
          ) : (
            <div className="divide-y divide-slate-100">
              {enquiries.map((ticket) => {
                const isSelected = activeEnquiry?.id === ticket.id;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setActiveEnquiryId(ticket.id)}
                    className={`p-5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/60 border-l-4 border-blue-600'
                        : 'hover:bg-slate-50/70 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-500">
                          {ticket.ticketNumber}
                        </span>
                        <span className="text-slate-300">&bull;</span>
                        <span className="text-xs text-slate-500">{ticket.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(ticket.priority)}
                        {getStatusBadge(ticket.status)}
                      </div>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-900 line-clamp-1 mb-1">
                      {ticket.subject}
                    </h4>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                      {ticket.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5 font-medium text-slate-600">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ticket.customerName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDateTime(ticket.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination Controls */}
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
                <span className="text-xs text-slate-500">
                  Showing <span className="font-medium text-slate-800">{totalEnquiries === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium text-slate-800">
                    {Math.min(currentPage * pageSize, totalEnquiries)}
                  </span>{' '}
                  of <span className="font-medium text-slate-800">{totalEnquiries}</span> tickets
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1 || isFetching}
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
                    disabled={currentPage >= totalPages || isFetching}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected Detail Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)] p-6 space-y-6">
          {activeEnquiry ? (
            <>
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {activeEnquiry.ticketNumber}
                    </span>
                    <span className="text-xs text-slate-400">{activeEnquiry.category}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-2 leading-snug">
                    {activeEnquiry.subject}
                  </h3>
                </div>
              </div>

              {/* Status Update Quick Bar */}
              {canEditEnquiries && (
                <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                  <span className="text-xs font-semibold text-slate-700 block">
                    Update Ticket Status:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Open', 'In Progress', 'Waiting on Client', 'Resolved'] as EnquiryStatus[]).map(
                      (st) => (
                        <button
                          key={st}
                          type="button"
                          disabled={updateStatusMutation.isPending}
                          onClick={() => handleUpdateStatus(activeEnquiry.id, st)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                            activeEnquiry.status === st
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {st}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Priority Update Quick Bar */}
              {canEditEnquiries && (
                <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                  <span className="text-xs font-semibold text-slate-700 block">
                    Update Priority:
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['Low', 'Medium', 'High', 'Urgent'] as EnquiryPriority[]).map((pr) => (
                      <button
                        key={pr}
                        type="button"
                        disabled={updatePriorityMutation.isPending}
                        onClick={() => handleUpdatePriority(activeEnquiry.id, pr)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors border text-center ${
                          activeEnquiry.priority === pr
                            ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {pr}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Enquiry Description Body */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">Issue Description</span>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 leading-relaxed">
                  {activeEnquiry.description}
                </div>
              </div>

              {/* Meta Details */}
              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-400">Reporter</span>
                  <span className="font-medium text-slate-800">{activeEnquiry.customerName}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-400">Email</span>
                  <span className="font-medium text-slate-800">{activeEnquiry.customerEmail}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-400">Priority</span>
                  {getPriorityBadge(activeEnquiry.priority)}
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-400">Assigned Handler</span>
                  <span className="font-medium text-slate-800">{activeEnquiry.assignedAgent}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Last Updated</span>
                  <span className="text-slate-600">{formatDateTime(activeEnquiry.updatedAt)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Select an enquiry ticket to view complete escalation details and resolution logs.
            </div>
          )}
        </div>
      </div>

      {/* Create Enquiry Modal */}
      <EnquiryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateEnquiry}
      />
    </div>
  );
};
