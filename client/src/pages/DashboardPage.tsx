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
  Calendar,
  Layers,
  Sparkles,
  Inbox,
  UserPlus,
  CalendarPlus,
  Compass,
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
import { OnboardingChecklist } from '../components/common/OnboardingChecklist';
import { LeadModal } from '../components/leads/LeadModal';
import { CustomerModal } from '../components/customers/CustomerModal';
import { EnquiryModal } from '../components/enquiries/EnquiryModal';
import { FollowUpModal } from '../components/followups/FollowUpModal';
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/formatters';
import { Lead, Customer, EnquiryPriority, EnquiryStatus, FollowUp } from '../types';
import {
  useDashboardSummary,
  useLeadAcquisitionVelocity,
  useCreateLead,
  useCreateCustomer,
  useCreateEnquiry,
  useCreateFollowUp,
} from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

export const DashboardPage: React.FC = () => {
  const { user, currentWorkspace } = useAuth();
  const workspaceCurrency = currentWorkspace?.currency || 'INR';
  const formatMoney = (val: number) => formatCurrency(val, workspaceCurrency);
  const {
    canCreateLeads,
    canCreateCustomers,
    canCreateEnquiries,
    canCreateFollowUps,
  } = usePermissions();
  const [timeframe, setTimeframe] = useState<'7d' | '30d'>('7d');
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);

  // Real Database Analytics Queries
  const {
    data: summaryData,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useDashboardSummary();

  const {
    data: velocityData,
    isLoading: velocityLoading,
    isError: velocityError,
    refetch: refetchVelocity,
  } = useLeadAcquisitionVelocity(timeframe === '7d' ? '7d' : '6m');

  const createLeadMutation = useCreateLead();
  const createCustomerMutation = useCreateCustomer();
  const createEnquiryMutation = useCreateEnquiry();
  const createFollowUpMutation = useCreateFollowUp();

  const handleRefreshAll = () => {
    refetchSummary();
    refetchVelocity();
  };

  const isAnyLoading = summaryLoading || velocityLoading;

  // Real data extractions
  const kpis = summaryData?.kpis;
  const pipelineStages = summaryData?.pipelineDistribution || [];
  const recentLeads = summaryData?.recentLeads || [];
  const recentActivities = summaryData?.recentActivities || [];
  const upcomingFollowUps = summaryData?.upcomingFollowUps || [];

  const handleCreateLead = async (leadData: Omit<Lead, 'id' | 'createdAt'>) => {
    await createLeadMutation.mutateAsync(leadData);
  };

  const handleCreateCustomer = async (custData: Omit<Customer, 'id' | 'joinedDate'>) => {
    await createCustomerMutation.mutateAsync(custData);
  };

  const handleCreateEnquiry = async (enquiryData: {
    subject: string;
    customerName: string;
    customerEmail: string;
    category: string;
    priority: EnquiryPriority;
    status: EnquiryStatus;
    description: string;
    assignedAgent: string;
  }) => {
    await createEnquiryMutation.mutateAsync(enquiryData);
  };

  const handleCreateFollowUp = async (followUpData: Omit<FollowUp, 'id'>) => {
    await createFollowUpMutation.mutateAsync(followUpData);
  };

  const getStatusBadge = (status: string) => {
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

  const chartData = velocityData?.data || [];
  const hasLeadsInChart = chartData.some((point) => point.leads > 0);

  // Status-independent brand-new workspace detection:
  // Uses total record counts across all CRM modules (regardless of whether records are WON, LOST, RESOLVED, or COMPLETED)
  const totalCRMRecords =
    (kpis?.totalLeads ?? 0) +
    (kpis?.totalCustomerAccounts ?? kpis?.totalCustomers ?? 0) +
    (kpis?.totalEnquiries ?? kpis?.openEnquiries ?? 0) +
    (kpis?.totalFollowUps ?? kpis?.pendingFollowUps ?? 0);
  const isCleanWorkspace = !summaryLoading && totalCRMRecords === 0;

  // Onboarding guide visibility:
  // When a workspace is first created, it enters the onboarding flow.
  // We track onboarding initiation per-workspace so the guide remains visible through 1/4, 2/4, 3/4 and 4/4
  // until the user achieves completion or explicitly chooses to dismiss it.
  const workspaceId = currentWorkspace?.id || 'default';
  const startedKey = `flowdesk_onboarding_started_${workspaceId}`;
  const dismissedKey = `flowdesk_onboarding_dismissed_${workspaceId}`;

  // Automatically mark onboarding as started for clean workspaces
  React.useEffect(() => {
    if (isCleanWorkspace) {
      localStorage.setItem(startedKey, 'true');
    }
  }, [isCleanWorkspace, startedKey]);

  // The onboarding guide renders if:
  // 1. The workspace is clean (0 total CRM records), OR
  // 2. The user has an in-progress onboarding session in this workspace (hasStartedOnboarding === 'true')
  // AND the user has not dismissed it. Established workspaces without an active onboarding flag will not show it.
  const hasStartedOnboarding = localStorage.getItem(startedKey) === 'true';
  const isDismissed = localStorage.getItem(dismissedKey) === 'true';
  const shouldShowOnboarding = !summaryLoading && (isCleanWorkspace || hasStartedOnboarding) && !isDismissed;

  return (
    <div className="space-y-6">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Good day, {user?.name?.split(' ')[0] || 'Team'}
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
            className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isAnyLoading ? 'animate-spin' : ''}`} />
          </button>
          {canCreateLeads && (
            <button
              type="button"
              onClick={() => setIsLeadModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Lead
            </button>
          )}
        </div>
      </div>

      {/* Onboarding Experience for New & In-Progress Workspaces */}
      {shouldShowOnboarding && (
        <div className="space-y-4">
          <OnboardingChecklist
            metrics={{
              totalLeads: kpis?.totalLeads ?? 0,
              totalCustomers: kpis?.totalCustomerAccounts ?? kpis?.totalCustomers ?? 0,
              totalFollowUps: kpis?.totalFollowUps ?? kpis?.pendingFollowUps ?? 0,
              workspaceName: currentWorkspace?.name,
            }}
            onOpenLeadModal={() => setIsLeadModalOpen(true)}
            onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
            onOpenFollowUpModal={() => setIsFollowUpModalOpen(true)}
          />
        </div>
      )}

      {/* KPI Stat Cards (100% Real Database Aggregations) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads & Pipeline"
          value={summaryLoading ? '...' : (kpis?.totalLeads ?? 0)}
          helperText={`${formatMoney(kpis?.totalPipelineValue ?? 0)} pipeline`}
          icon={Users}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Active Customers"
          value={summaryLoading ? '...' : (kpis?.totalCustomers ?? 0)}
          helperText={`${formatMoney(kpis?.totalMRR ?? 0)} MRR`}
          icon={Building2}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Won Deals & Conversion"
          value={summaryLoading ? '...' : (kpis?.wonDealsCount ?? 0)}
          helperText={`${kpis?.conversionRate ?? 0}% win rate (${formatMoney(kpis?.wonDealsRevenue ?? 0)})`}
          icon={TrendingUp}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Pending Operations"
          value={summaryLoading ? '...' : ((kpis?.openEnquiries ?? 0) + (kpis?.pendingFollowUps ?? 0))}
          helperText={`${kpis?.openEnquiries ?? 0} tickets • ${kpis?.pendingFollowUps ?? 0} follow-ups`}
          icon={CalendarCheck}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Analytics Chart & Pipeline Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Performance Chart (Lead Acquisition Velocity) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">Lead Acquisition Velocity</h3>
                  <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                    <Database className="w-2.5 h-2.5" /> PostgreSQL
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Chronological inbound prospect acquisition and won deal velocity
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

            <div className="h-64 w-full relative">
              {velocityLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-xs z-10">
                  <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mb-2" />
                  <span className="text-xs font-medium text-slate-500">Loading velocity analytics...</span>
                </div>
              ) : velocityError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-red-200 p-4 text-center">
                  <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                  <p className="text-xs font-semibold text-slate-800">Failed to load analytics</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                    Could not query lead velocity metrics. Click refresh to retry.
                  </p>
                  <button
                    type="button"
                    onClick={() => refetchVelocity()}
                    className="mt-3 px-3 py-1 bg-white border border-slate-200 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    Retry
                  </button>
                </div>
              ) : !hasLeadsInChart ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-4 text-center">
                  <Users className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-800">No leads recorded in this period</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                    Create new leads or import contacts to begin tracking acquisition velocity.
                  </p>
                  {canCreateLeads && (
                    <button
                      type="button"
                      onClick={() => setIsLeadModalOpen(true)}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add First Lead
                    </button>
                  )}
                </div>
              ) : null}

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
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.75rem',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => {
                      if (name === 'Inbound Leads') return [`${value} leads`, name];
                      if (name === 'Deals Closed') return [`${value} won`, name];
                      return [value, name];
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
              {pipelineStages.map((stage) => (
                <div key={stage.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{stage.label}</span>
                    <span className="text-slate-500">
                      {stage.count} leads ({stage.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Total Pipeline Value</span>
            <span className="font-bold text-slate-900">{formatMoney(kpis?.totalPipelineValue ?? 0)}</span>
          </div>
        </div>
      </div>

      {/* Two-Column: Recent Leads Table & Live Activity Stream */}
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
            {summaryLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading leads...</div>
            ) : recentLeads.length === 0 ? (
              <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 mb-1">No leads recorded yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mb-4">
                  Add prospects and potential deals to track your conversion funnel and deal stages.
                </p>
                {canCreateLeads && (
                  <button
                    type="button"
                    onClick={() => setIsLeadModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create Your First Lead
                  </button>
                )}
              </div>
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
                  {recentLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="font-medium text-slate-900">{lead.name}</div>
                        <div className="text-[11px] text-slate-400">{lead.company}</div>
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-slate-800">
                        {formatMoney(lead.value)}
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

        {/* Live Activity Stream (Real PostgreSQL Events) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)] p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Recent Workspace Activity</h3>
              <p className="text-xs text-slate-500">Live operational events from database</p>
            </div>
          </div>

          <div className="space-y-4">
            {summaryLoading ? (
              <div className="p-4 text-center text-xs text-slate-400">Loading activity...</div>
            ) : recentActivities.length === 0 ? (
              <div className="py-8 px-4 text-center flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center mb-2.5">
                  <Clock className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-semibold text-slate-700 mb-0.5">No activity recorded</h4>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Actions you and your team perform will automatically generate an audit trail here.
                </p>
              </div>
            ) : (
              recentActivities.map((act) => {
                const iconMap = {
                  lead: <Users className="w-3.5 h-3.5 text-blue-600" />,
                  customer: <Building2 className="w-3.5 h-3.5 text-emerald-600" />,
                  enquiry: <AlertCircle className="w-3.5 h-3.5 text-amber-600" />,
                  followup: <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />,
                };
                return (
                  <div key={act.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {iconMap[act.type] || <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />}
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
              })
            )}
          </div>
        </div>
      </div>

      {/* Real Upcoming Follow-ups Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)] p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Upcoming Follow-ups & Tasks</h3>
            <p className="text-xs text-slate-500">Pending outreach actions scheduled in PostgreSQL</p>
          </div>
          <a
            href="/follow-ups"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            View Schedule <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {summaryLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading follow-ups...</div>
        ) : upcomingFollowUps.length === 0 ? (
          <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 mb-1">No follow-ups or tasks scheduled</h4>
            <p className="text-xs text-slate-500 max-w-sm mb-4">
              Schedule meetings, discovery calls, and contract reviews to stay organized with your prospects.
            </p>
            {canCreateFollowUps && (
              <button
                type="button"
                onClick={() => setIsFollowUpModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Schedule First Follow-up
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingFollowUps.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {task.type}
                    </span>
                    {task.isOverdue ? (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                        Overdue
                      </span>
                    ) : task.isDueToday ? (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        Due Today
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">{task.priority}</span>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 mb-1">{task.title}</h4>
                  <p className="text-[11px] text-slate-500">
                    {task.contactName} &bull; {task.contactCompany}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {task.dueDate}
                  </span>
                  <span>{task.dueTime}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSave={handleCreateLead}
      />
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSave={handleCreateCustomer}
      />
      <EnquiryModal
        isOpen={isEnquiryModalOpen}
        onClose={() => setIsEnquiryModalOpen(false)}
        onSave={handleCreateEnquiry}
      />
      <FollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        onSave={handleCreateFollowUp}
      />
    </div>
  );
};
