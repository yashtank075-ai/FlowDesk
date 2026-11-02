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
} from 'lucide-react';
import { Customer, CustomerTier, CustomerStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { CustomerModal } from '../components/customers/CustomerModal';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useCustomers, useCreateCustomer, useUpdateCustomer } from '../hooks/useApi';
import { usePermissions } from '../hooks/usePermissions';

export const CustomersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // React Query
  const { data, isLoading, isError, error, refetch, isFetching } = useCustomers({
    search: searchQuery,
    tier: selectedTier,
    status: selectedStatus,
    page: 1,
    limit: 100,
  });

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const { canCreateCustomers, canEditCustomers } = usePermissions();

  const customers = data?.customers || [];

  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cust: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCustomer(cust);
    setIsModalOpen(true);
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

  const totalMRR = useMemo(() => customers.reduce((sum, c) => sum + (c.mrr || 0), 0), [customers]);

  return (
    <div className="space-y-6">
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
            <span className="font-bold text-slate-900 text-sm">{formatCurrency(totalMRR)}</span>
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
              onChange={(e) => setSelectedTier(e.target.value)}
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
            onChange={(e) => setSelectedStatus(e.target.value)}
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
                          {formatCurrency(cust.mrr)}
                          <span className="text-[10px] text-slate-400 font-normal">/mo</span>
                        </td>

                        <td className="px-6 py-4 text-slate-700 font-medium">
                          {cust.assignedManager}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditModal(cust, e)}
                              title="Edit Customer"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
                    {formatCurrency(activeCustomer.mrr)}
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
                {canEditCustomers ? (
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(activeCustomer)}
                    className="w-full py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-center"
                  >
                    Edit Profile
                  </button>
                ) : (
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
