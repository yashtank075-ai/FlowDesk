import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  Database,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Customer, CustomerTier, CustomerStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { CustomerModal } from '../components/customers/CustomerModal';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer, useDashboardSummary } from '../hooks/useApi';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';

export const CustomersPage: React.FC = () => {
  const { currentWorkspace } = useAuth();
  const workspaceCurrency = currentWorkspace?.currency || 'INR';
  const formatMoney = (val: number) => formatCurrency(val, workspaceCurrency);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 300ms Debounce for search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // React Query
  const { data, isLoading, isError, error, refetch, isFetching } = useCustomers({
    search: debouncedSearch,
    tier: selectedTier,
    status: selectedStatus,
    page: currentPage,
    limit: pageSize,
  });

  const { data: summaryData } = useDashboardSummary();

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();
  const { canCreateCustomers, canEditCustomers, canDeleteCustomers } = usePermissions();

  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const customers = data?.customers || [];
  const totalCustomers = data?.pagination?.total ?? (data?.total ?? customers.length);
  const totalPages = data?.pagination?.totalPages ?? (Math.ceil(totalCustomers / pageSize) || 1);

  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cust: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCustomer(cust);
    setIsModalOpen(true);
  };

  const handleDeleteCustomer = async (cust: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (deletingCustomerId) return;

    const confirmMsg = `Are you sure you want to delete customer "${cust.name} (${cust.company})"? This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setDeletingCustomerId(cust.id);
      setFeedback(null);
      await deleteMutation.mutateAsync(cust.id);
      if (activeCustomer?.id === cust.id) {
        setActiveCustomer(null);
      }
      setFeedback({
        type: 'success',
        message: `Customer "${cust.company}" was removed successfully.`,
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete customer.';
      setFeedback({
        type: 'error',
        message: errMsg,
      });
    } finally {
      setDeletingCustomerId(null);
    }
  };

  const handleSaveCustomer = async (
    customerData: Omit<Customer, 'id' | 'joinedDate'>,
    customerId?: string
  ) => {
    if (customerId) {
      const updated = await updateMutation.mutateAsync({ id: customerId, data: customerData });
      if (activeCustomer?.id === customerId) {
        setActiveCustomer(updated);
      }
    } else {
      await createMutation.mutateAsync(customerData);
    }
  };

  const getStatusBadge = (status: CustomerStatus) => {
    switch (status) {
      case 'Active':
        return <Badge variant="emerald">Active</Badge>;
      case 'Onboarding':
        return <Badge variant="blue">Onboarding</Badge>;
      case 'At Risk':
        return <Badge variant="rose">At Risk</Badge>;
      case 'Churned':
        return <Badge variant="slate">Churned</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  const getTierBadge = (tier: CustomerTier) => {
    switch (tier) {
      case 'Enterprise':
        return <Badge variant="purple">Enterprise</Badge>;
      case 'Growth':
        return <Badge variant="indigo">Growth</Badge>;
      default:
        return <Badge variant="slate">Starter</Badge>;
    }
  };

  const totalMRR = useMemo(() => {
    if (summaryData?.kpis?.totalMRR !== undefined) {
      return summaryData.kpis.totalMRR;
    }
    return customers.reduce((sum, c) => sum + (c.mrr || 0), 0);
  }, [summaryData, customers]);

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold hover:opacity-75 ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Directory</h2>
            <span className="text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-600" /> PostgreSQL Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Active client accounts, recurring subscription tiers, and designated account managers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end pr-3 border-r border-slate-200 text-xs">
            <span className="text-slate-400">Total Customer MRR</span>
            <span className="font-bold text-slate-900 text-sm">{formatMoney(totalMRR)}</span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            title="Refresh from PostgreSQL"
            className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          {canCreateCustomers && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Customer
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, contact, or industry..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 flex-1 md:flex-initial">
            <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            <select
              value={selectedTier}
              onChange={(e) => {
                setSelectedTier(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700"
            >
              <option value="ALL">All Tiers</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Growth">Growth</option>
              <option value="Starter">Starter</option>
            </select>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700"
          >
            <option value="ALL">All Health States</option>
            <option value="Active">Active</option>
            <option value="Onboarding">Onboarding</option>
            <option value="At Risk">At Risk</option>
            <option value="Churned">Churned</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Customer Table + Detail Slide-in Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Table column */}
        <div
          className={`${
            activeCustomer ? 'lg:col-span-2' : 'lg:col-span-3'
          } bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-300`}
        >
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
              <span>Loading customer directory from PostgreSQL...</span>
            </div>
          ) : isError ? (
            <div className="py-16 text-center text-rose-500 text-xs flex flex-col items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>Failed to load customers: {(error as Error)?.message}</span>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Try Again
              </button>
            </div>
          ) : customers.length === 0 ? (
            !searchQuery && selectedTier === 'ALL' && selectedStatus === 'ALL' ? (
              <EmptyState
                title="No customers added yet"
                description="Customers represent active business accounts, contract renewals, subscription tiers, and recurring monthly revenue (MRR)."
                actionText={canCreateCustomers ? "Add First Customer" : undefined}
                onAction={canCreateCustomers ? () => setIsModalOpen(true) : undefined}
              />
            ) : (
              <EmptyState
                title="No customer accounts found"
                description="Clear your filter criteria or register a new customer into the system."
                actionText="Reset Filters"
                onAction={() => {
                  setSearchQuery('');
                  setSelectedTier('ALL');
                  setSelectedStatus('ALL');
                }}
              />
            )
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Company & Contact</th>
                    <th className="px-6 py-3.5">Subscription Tier</th>
                    <th className="px-6 py-3.5">Account Health</th>
                    <th className="px-6 py-3.5">MRR</th>
                    <th className="px-6 py-3.5">Account Manager</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((cust) => {
                    const isSelected = activeCustomer?.id === cust.id;
                    return (
                      <tr
                        key={cust.id}
                        onClick={() => setActiveCustomer(cust)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            {cust.company}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {cust.name} &bull; {cust.industry}
                          </div>
                        </td>

                        <td className="px-6 py-4">{getTierBadge(cust.tier)}</td>

                        <td className="px-6 py-4">{getStatusBadge(cust.status)}</td>

                        <td className="px-6 py-4 font-bold text-slate-900">
                          {formatMoney(cust.mrr)}
                          <span className="text-[10px] text-slate-400 font-normal">/mo</span>
                        </td>

                        <td className="px-6 py-4 text-slate-700 font-medium">
                          {cust.assignedManager}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canEditCustomers && (
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditModal(cust, e)}
                                title="Edit Customer"
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {canDeleteCustomers && (
                              <button
                                type="button"
                                disabled={deletingCustomerId === cust.id}
                                onClick={(e) => handleDeleteCustomer(cust, e)}
                                title="Delete Customer"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {deletingCustomerId === cust.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin text-rose-600" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <span className="text-xs text-slate-500">
                  Showing <span className="font-medium text-slate-800">{totalCustomers === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium text-slate-800">
                    {Math.min(currentPage * pageSize, totalCustomers)}
                  </span>{' '}
                  of <span className="font-medium text-slate-800">{totalCustomers}</span> customers
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

        {/* Customer Detail View Panel */}
        {activeCustomer && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)] p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  Account Details
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {activeCustomer.company}
                </h3>
                <p className="text-xs text-slate-500">{activeCustomer.industry}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCustomer(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Primary Contact</span>
                <p className="font-semibold text-slate-800 text-sm mt-0.5">
                  {activeCustomer.name}
                </p>
                <div className="flex items-center gap-2 mt-1 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeCustomer.email}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeCustomer.phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[11px] block">Contract Tier</span>
                  <div className="mt-1">{getTierBadge(activeCustomer.tier)}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 text-[11px] block">Monthly MRR</span>
                  <span className="font-bold text-slate-900 text-sm mt-1 block">
                    {formatMoney(activeCustomer.mrr)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Account Health</span>
                  {getStatusBadge(activeCustomer.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Client Since</span>
                  <span className="font-medium text-slate-800">
                    {formatDate(activeCustomer.joinedDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Renewal Date</span>
                  <span className="font-medium text-slate-800">
                    {formatDate(activeCustomer.contractRenewal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Success Manager</span>
                  <span className="font-medium text-slate-800">
                    {activeCustomer.assignedManager}
                  </span>
                </div>
              </div>

              {activeCustomer.notes && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-slate-400 block mb-1">Account Notes</span>
                  <p className="p-3 bg-slate-50 rounded-xl text-slate-600 text-xs leading-relaxed">
                    {activeCustomer.notes}
                  </p>
                </div>
              )}

              <div className="pt-3 flex gap-2">
                {canEditCustomers && (
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(activeCustomer)}
                    className="flex-1 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-center"
                  >
                    Edit Profile
                  </button>
                )}
                {canDeleteCustomers && (
                  <button
                    type="button"
                    disabled={deletingCustomerId === activeCustomer.id}
                    onClick={(e) => handleDeleteCustomer(activeCustomer, e)}
                    className="flex-1 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors text-center disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                  >
                    {deletingCustomerId === activeCustomer.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>Delete</span>
                  </button>
                )}
                {!canEditCustomers && !canDeleteCustomers && (
                  <span className="w-full py-2 text-xs font-medium text-slate-400 bg-slate-50 rounded-xl text-center italic">
                    Read-only Account
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCustomer}
        initialCustomer={editingCustomer}
      />
    </div>
  );
};
