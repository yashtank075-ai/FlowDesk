import React, { useState } from 'react';
import {
  Users,
  Building2,
  HelpCircle,
  CalendarCheck,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { LeadModal } from '../components/leads/LeadModal';
import {
  mockActivities,
  mockLeadTrendData,
  mockMonthlyTrendData,
} from '../data/mockData';
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/formatters';
import { Lead } from '../types';
import { useLeads, useCustomers, useEnquiries, useFollowUps, useCreateLead } from '../hooks/useApi';

export const DashboardPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d'>('7d');
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  // Real API Queries
  const { data: leadsData, isLoading: leadsLoading, refetch: refetchLeads } = useLeads({ limit: 100 });
  const { data: customersData, isLoading: customersLoading, refetch: refetchCustomers } = useCustomers({ limit: 100 });
  const { data: enquiriesData, isLoading: enquiriesLoading, refetch: refetchEnquiries } = useEnquiries({ limit: 100 });
  const { data: followUpsData, isLoading: followUpsLoading, refetch: refetchFollowUps } = useFollowUps();

  const createLeadMutation = useCreateLead();

  const leads = leadsData?.leads || [];
  const customers = customersData?.customers || [];
  const enquiries = enquiriesData?.enquiries || [];
  const followUps = followUpsData || [];

  const handleRefreshAll = () => {
    refetchLeads();
    refetchCustomers();
    refetchEnquiries();
    refetchFollowUps();
  };

  const isAnyLoading = leadsLoading || customersLoading || enquiriesLoading || followUpsLoading;

  // Real computed metrics
  const totalPipelineValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);
  const totalCustomers = customers.length;
  const totalMRR = customers.reduce((sum, cust) => sum + (cust.mrr || 0), 0);
  const openEnquiries = enquiries.filter((e) => e.status !== 'Resolved').length;
  const pendingFollowups = followUps.filter((f) => f.status === 'Pending').length;

  const pipelineStages = [
    { label: 'New', count: leads.filter((l) => l.status === 'New').length, color: 'bg-slate-400' },
    { label: 'Contacted', count: leads.filter((l) => l.status === 'Contacted').length, color: 'bg-blue-400' },
    { label: 'Qualified', count: leads.filter((l) => l.status === 'Qualified').length, color: 'bg-indigo-500' },
    { label: 'Proposal', count: leads.filter((l) => l.status === 'Proposal').length, color: 'bg-amber-400' },
    { label: 'Negotiation', count: leads.filter((l) => l.status === 'Negotiation').length, color: 'bg-purple-500' },
    { label: 'Won', count: leads.filter((l) => l.status === 'Won').length, color: 'bg-emerald-500' },
  ];

  const handleCreateLead = async (leadData: Omit<Lead, 'id' | 'createdAt'>) => {
    await createLeadMutation.mutateAsync(leadData);
  };

  const getStatusBadge = (status: Lead['status']) => {
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
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const chartData = timeframe === '7d' ? mockLeadTrendData : mockMonthlyTrendData;

  return (
    <div className="space-y-6">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Good day, Yash
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-medium border border-emerald-200/80 inline-flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-600" /> PostgreSQL Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {todayStr} &bull; Real-time pipeline connected
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefreshAll}
            title="Refresh all metrics from PostgreSQL"
            className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isAnyLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsLeadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* KPI Stat Cards (Real Database Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads & Pipeline"
          value={leadsLoading ? '...' : leads.length}
          change="+18.4%"
          isPositive={true}
          helperText={`${formatCurrency(totalPipelineValue)} active`}
          icon={Users}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Active Customers"
          value={customersLoading ? '...' : totalCustomers}
          change="+8.2%"
          isPositive={true}
          helperText={`${formatCurrency(totalMRR)} MRR`}
          icon={Building2}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Open Enquiries"
          value={enquiriesLoading ? '...' : openEnquiries}
          change="-4.5%"
          isPositive={true}
          helperText="Live tickets"
          icon={HelpCircle}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Follow-ups Due"
          value={followUpsLoading ? '...' : pendingFollowups}
          change="Pending"
          isPositive={false}
          helperText="Active outreach"
          icon={CalendarCheck}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Analytics Chart & Pipeline Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Performance Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">Lead Acquisition Velocity</h3>
                <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                  Demo Trend Projection
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Inbound prospect acquisition versus converted demo pipeline
              </p>
            </div>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setTimeframe('7d')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  timeframe === '7d'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Past 7 Days
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('30d')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  timeframe === '30d'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                6-Month Trend
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="convertGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#leadGrad)"
                  name="Inbound Leads"
                />
                <Area
                  type="monotone"
                  dataKey="converted"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#convertGrad)"
                  name="Deals Closed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Distribution (Real DB stage counts) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-slate-900">Pipeline Distribution</h3>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Stage concentration across all active deals in PostgreSQL
            </p>

            <div className="space-y-4">
              {pipelineStages.map((stage) => {
                const percentage =
                  leads.length > 0 ? Math.round((stage.count / leads.length) * 100) : 0;
                return (
                  <div key={stage.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{stage.label}</span>
                      <span className="text-slate-500">
                        {stage.count} leads ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Total Pipeline Value</span>
            <span className="font-bold text-slate-900">{formatCurrency(totalPipelineValue)}</span>
          </div>
        </div>
      </div>

      {/* Two-Column: Recent Leads Table & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Leads Table (Real Data) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Recent Lead Opportunities</h3>
              <p className="text-xs text-slate-500">Active records loaded directly from database</p>
            </div>
            <a
              href="/leads"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              View Pipeline <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="overflow-x-auto">
            {leadsLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading leads...</div>
            ) : leads.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No leads in database yet.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Lead & Company</th>
                    <th className="px-6 py-3">Est. Value</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Assigned Rep</th>
                    <th className="px-6 py-3 text-right">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.slice(0, 5).map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="font-medium text-slate-900">{lead.name}</div>
                        <div className="text-[11px] text-slate-400">{lead.company}</div>
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-slate-800">
                        {formatCurrency(lead.value)}
                      </td>
                      <td className="px-6 py-3.5">{getStatusBadge(lead.status)}</td>
                      <td className="px-6 py-3.5 text-slate-600">{lead.assignedTo}</td>
                      <td className="px-6 py-3.5 text-right text-slate-400">
                        {formatDate(lead.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Live Activity Stream */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)] p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Recent Workspace Activity</h3>
              <p className="text-xs text-slate-500">Live operational events</p>
            </div>
          </div>

          <div className="space-y-4">
            {mockActivities.map((act) => {
              const iconMap = {
                lead: <Users className="w-3.5 h-3.5 text-blue-600" />,
                customer: <Building2 className="w-3.5 h-3.5 text-emerald-600" />,
                enquiry: <AlertCircle className="w-3.5 h-3.5 text-amber-600" />,
                followup: <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />,
              };
              return (
                <div key={act.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {iconMap[act.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800">{act.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {act.description}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {formatRelativeTime(act.timestamp)} &bull; {act.user}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lead Create Modal */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSave={handleCreateLead}
      />
    </div>
  );
};
