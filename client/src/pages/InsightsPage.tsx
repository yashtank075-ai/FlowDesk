import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  RefreshCw,
  Target,
  Flame,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Zap,
  Info,
} from 'lucide-react';
import { useInsights } from '../hooks/useInsights';
import { formatCurrency, formatNumber } from '../utils/formatters';

export const InsightsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: insights, isLoading, isError, error, refetch, isFetching } = useInsights();

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 animate-pulse rounded-lg" />
            <div className="h-4 w-96 bg-slate-100 animate-pulse rounded-md" />
          </div>
          <div className="h-10 w-28 bg-slate-200 animate-pulse rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 p-5 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          <div className="h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md mx-auto my-12">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Failed to Generate Insights</h2>
          <p className="text-sm text-slate-600 mb-6">
            {(error as any)?.response?.data?.message || 'An unexpected error occurred while processing analytics.'}
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  const {
    overview,
    leadsNeedingAttention,
    highPotentialLeads,
    pipelineInsights,
    followUpPriorities,
    weeklySummary,
    recommendations,
  } = insights;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/30 text-blue-200 border border-blue-400/30 rounded-full text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            AI Business Intelligence Engine
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Executive Business Insights</h1>
          <p className="text-slate-300 text-sm max-w-xl">
            Deterministic pipeline analytics, high-conviction deal scoring, and prescriptive workflow priorities computed from real workspace records.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 backdrop-blur-md text-sm font-medium transition-all"
            title="Refresh Intelligence Engine"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Pipeline */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Deals</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{formatNumber(overview.totalActiveLeads)}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Pipeline Value:</span>
              <span className="font-semibold text-slate-700">{formatCurrency(overview.pipelineValue)}</span>
            </div>
          </div>
        </div>

        {/* Needs Attention */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attention Required</span>
            <div className={`p-2 rounded-xl ${overview.leadsNeedingAttentionCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{formatNumber(overview.leadsNeedingAttentionCount)}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Overdue Follow-ups:</span>
              <span className="font-semibold text-amber-600">{overview.overdueFollowUpsCount}</span>
            </div>
          </div>
        </div>

        {/* Closed Won & Rate */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Won Deals</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{formatNumber(overview.wonDealsCount)}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Conversion Rate:</span>
              <span className="font-semibold text-emerald-600">{overview.conversionRate}%</span>
            </div>
          </div>
        </div>

        {/* Recurring MRR */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active MRR</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(overview.totalMRR)}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Avg Deal Won:</span>
              <span className="font-semibold text-slate-700">{formatCurrency(pipelineInsights.avgDealSize)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Prescriptive Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Strategic Recommendations
            </h2>
            <span className="text-xs text-slate-500">Auto-prioritized by revenue impact</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => {
              const borderTheme =
                rec.type === 'CRITICAL'
                  ? 'border-red-200 bg-red-50/40 hover:bg-red-50/70'
                  : rec.type === 'OPPORTUNITY'
                  ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70'
                  : 'border-blue-200 bg-blue-50/40 hover:bg-blue-50/70';

              const iconTheme =
                rec.type === 'CRITICAL'
                  ? 'bg-red-100 text-red-600'
                  : rec.type === 'OPPORTUNITY'
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-blue-100 text-blue-600';

              return (
                <div
                  key={rec.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${borderTheme}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${iconTheme}`}>
                          {rec.type === 'CRITICAL' ? (
                            <ShieldAlert className="w-4 h-4" />
                          ) : rec.type === 'OPPORTUNITY' ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {rec.type}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          rec.impact === 'HIGH'
                            ? 'bg-red-100 text-red-700'
                            : rec.impact === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {rec.impact} IMPACT
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">{rec.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{rec.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/50 flex justify-end">
                    <button
                      onClick={() => navigate(rec.actionUrl)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {rec.actionLabel}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid: Leads Needing Attention & High Potential */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads Needing Attention */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Leads Requiring Attention
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Identified via inactivity and overdue task rules</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
              {leadsNeedingAttention.length} Flagged
            </span>
          </div>

          <div className="mt-4 flex-1 space-y-3">
            {leadsNeedingAttention.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                <p className="text-sm font-semibold text-slate-800">All Deals in Good Health</p>
                <p className="text-xs text-slate-500 mt-1">No stagnant prospects or overdue follow-up tasks detected.</p>
              </div>
            ) : (
              leadsNeedingAttention.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => navigate('/leads')}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm truncate">{lead.name}</span>
                        <span className="text-xs text-slate-500 font-medium truncate">· {lead.company}</span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1">{lead.reason}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-slate-900 text-sm">{formatCurrency(lead.value)}</span>
                      <div className="mt-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            lead.severity === 'HIGH'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {lead.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* High Potential Pipeline */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                High-Potential Opportunities
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Ranked by stage maturity and anticipated deal value</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
              Top {highPotentialLeads.length}
            </span>
          </div>

          <div className="mt-4 flex-1 space-y-3">
            {highPotentialLeads.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Target className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-800">No Open Pipeline Deals</p>
                <p className="text-xs text-slate-500 mt-1">Add new leads to the CRM to generate scoring signals.</p>
              </div>
            ) : (
              highPotentialLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => navigate('/leads')}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm truncate">{lead.name}</span>
                        <span className="text-xs text-slate-500 font-medium truncate">· {lead.company}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                          {lead.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1">{lead.rationale}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-slate-900 text-sm">{formatCurrency(lead.value)}</span>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                        Score: {lead.score}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pipeline Stage Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Pipeline Velocity by Lifecycle Stage
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time volume and capital allocation across active funnel states</p>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total Pipeline:{' '}
            <span className="font-bold text-slate-900">{formatCurrency(pipelineInsights.totalPipelineValue)}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {pipelineInsights.stages.map((stage) => (
            <div key={stage.stage} className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-xs font-bold text-slate-700 truncate">{stage.label}</span>
                </div>
                <div className="text-xl font-extrabold text-slate-900">{stage.count}</div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200/60">
                <div className="text-xs font-semibold text-slate-600">{formatCurrency(stage.value)}</div>
                <div className="text-[10px] text-slate-400 font-medium">{stage.percentage}% of leads</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Follow-up Priority Matrix & Weekly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Follow-up Priority List (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Actionable Follow-up Priority Queue
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Prescribed sequence to unblock pipeline movement</p>
            </div>
            <button
              onClick={() => navigate('/follow-ups')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-2.5">
            {followUpPriorities.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                <p className="text-sm font-semibold text-slate-800">Follow-up Queue Empty</p>
                <p className="text-xs text-slate-500 mt-1">All outreach tasks and demos are up to date.</p>
              </div>
            ) : (
              followUpPriorities.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate('/follow-ups')}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm truncate">{item.title}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          item.urgency === 'OVERDUE'
                            ? 'bg-red-100 text-red-700'
                            : item.urgency === 'TODAY'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.urgency}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {item.contactName} ({item.contactCompany}) · Due: {item.dueDate} {item.dueTime || ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs text-blue-600 font-semibold group-hover:underline">Execute</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 7-Day Performance Summary (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Past 7 Days Output
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Workspace momentum indicators</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-600">New Inbound Leads</span>
                <span className="font-extrabold text-slate-900">{weeklySummary.newLeadsCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-600">New Customers</span>
                <span className="font-extrabold text-slate-900">{weeklySummary.newCustomersCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-600">Enquiries Handled</span>
                <span className="font-extrabold text-slate-900">{weeklySummary.newEnquiriesCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-600">Completed Follow-ups</span>
                <span className="font-extrabold text-emerald-600">{weeklySummary.completedFollowUpsCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-600">Deals Won</span>
                <span className="font-extrabold text-emerald-600">{weeklySummary.wonDealsCount}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
            <span className="text-xs font-medium text-emerald-800">Won Revenue (Past 7d)</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {formatCurrency(weeklySummary.wonRevenue)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

