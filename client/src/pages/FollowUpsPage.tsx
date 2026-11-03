import React, { useState, useMemo } from 'react';
import {
  Plus,
  Clock,
  Calendar,
  Phone,
  Mail,
  Video,
  FileText,
  Check,
  Building,
  RefreshCw,
  Database,
  AlertTriangle,
} from 'lucide-react';
import { FollowUp, FollowUpStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { FollowUpModal } from '../components/followups/FollowUpModal';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate, getLocalDateString } from '../utils/formatters';
import { useFollowUps, useCreateFollowUp, useUpdateFollowUp } from '../hooks/useApi';
import { usePermissions } from '../hooks/usePermissions';

export const FollowUpsPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DUE' | 'UPCOMING' | 'OVERDUE' | 'COMPLETED'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);

  // Use local calendar date rather than UTC ISO string to prevent timezone offset bugs
  const today = getLocalDateString();

  // React Query
  const { data: followUps = [], isLoading, isError, error, refetch, isFetching } = useFollowUps();
  const createMutation = useCreateFollowUp();
  const updateMutation = useUpdateFollowUp();
  const { canCreateFollowUps, canEditFollowUps } = usePermissions();

  const filteredItems = useMemo(() => {
    return followUps.filter((item) => {
      if (activeFilter === 'COMPLETED') return item.status === 'Completed';
      if (activeFilter === 'DUE') return item.status === 'Pending' && item.dueDate === today;
      if (activeFilter === 'UPCOMING') return item.status === 'Pending' && item.dueDate > today;
      if (activeFilter === 'OVERDUE') return item.status === 'Pending' && item.dueDate < today;
      return true;
    });
  }, [followUps, activeFilter, today]);

  const handleToggleComplete = async (id: string) => {
    const item = followUps.find((f) => f.id === id);
    if (!item) return;

    const nextStatus: FollowUpStatus = item.status === 'Completed' ? 'Pending' : 'Completed';
    await updateMutation.mutateAsync({ id, data: { status: nextStatus } });
  };

  const handleSaveFollowUp = async (data: Omit<FollowUp, 'id'>, followUpId?: string) => {
    if (followUpId) {
      await updateMutation.mutateAsync({ id: followUpId, data });
    } else {
      await createMutation.mutateAsync(data);
      // If the user was on a specific filter where this new item wouldn't be visible (e.g. COMPLETED or OVERDUE),
      // switch to ALL so they immediately see their scheduled item
      if (activeFilter === 'COMPLETED' || activeFilter === 'OVERDUE') {
        setActiveFilter('ALL');
      } else if (activeFilter === 'DUE' && data.dueDate !== today) {
        // If they scheduled for a future day while on 'Due Today', switch to UPCOMING or ALL
        setActiveFilter(data.dueDate > today ? 'UPCOMING' : 'ALL');
      }
    }
  };

  const getTypeIcon = (type: FollowUp['type']) => {
    switch (type) {
      case 'Call':
        return <Phone className="w-3.5 h-3.5 text-blue-600" />;
      case 'Meeting':
      case 'Demo':
        return <Video className="w-3.5 h-3.5 text-purple-600" />;
      case 'Email':
        return <Mail className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Contract Review':
        return <FileText className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Follow-ups & Outreach</h2>
            <span className="text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-600" /> PostgreSQL Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track call schedules, scheduled demos, contract walkthroughs, and proactive client touchpoints
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
          {canCreateFollowUps && (
            <button
              type="button"
              onClick={() => {
                setEditingFollowUp(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Schedule Follow-up
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full">
          {[
            { id: 'ALL', label: 'All Actions', count: followUps.length },
            {
              id: 'DUE',
              label: 'Due Today',
              count: followUps.filter((f) => f.status === 'Pending' && f.dueDate === today).length,
            },
            {
              id: 'UPCOMING',
              label: 'Upcoming',
              count: followUps.filter((f) => f.status === 'Pending' && f.dueDate > today).length,
            },
            {
              id: 'OVERDUE',
              label: 'Overdue',
              count: followUps.filter((f) => f.status === 'Pending' && f.dueDate < today).length,
            },
            {
              id: 'COMPLETED',
              label: 'Completed',
              count: followUps.filter((f) => f.status === 'Completed').length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeFilter === tab.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeFilter === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Follow-up Cards List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading follow-up schedule from PostgreSQL...</span>
          </div>
        ) : isError ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-rose-500 text-xs flex flex-col items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <span>Failed to load follow-ups: {(error as Error)?.message}</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              Try Again
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
            <EmptyState
              title="No follow-up actions found"
              description="No follow-ups match this timeframe or completion state."
              actionText="Schedule New Action"
              onAction={() => {
                setEditingFollowUp(null);
                setIsModalOpen(true);
              }}
            />
          </div>
        ) : (
          filteredItems.map((item) => {
            const isCompleted = item.status === 'Completed';
            const isOverdue = !isCompleted && item.dueDate < today;
            const isToday = !isCompleted && item.dueDate === today;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-[0_2px_4px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'opacity-60 bg-slate-50/50 border-slate-200'
                    : isOverdue
                    ? 'border-rose-200 bg-rose-50/20'
                    : isToday
                    ? 'border-blue-200 bg-blue-50/15'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {canEditFollowUps ? (
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(item.id)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors mt-0.5 flex-shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-blue-500 bg-white'
                      }`}
                      aria-label="Toggle completed"
                    >
                      {isCompleted && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ) : (
                    <div
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center mt-0.5 flex-shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-200 bg-slate-100 opacity-60'
                      }`}
                    >
                      {isCompleted && <Check className="w-3.5 h-3.5" />}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-sm font-semibold text-slate-900 ${
                          isCompleted ? 'line-through text-slate-500' : ''
                        }`}
                      >
                        {item.title}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        {getTypeIcon(item.type)} {item.type}
                      </span>
                      {item.priority === 'High' && (
                        <Badge variant="rose" size="sm">
                          Urgent
                        </Badge>
                      )}
                      {isOverdue && (
                        <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          Overdue
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-700">{item.contactName}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        {item.contactCompany}
                      </span>
                      {item.contactEmail && (
                        <>
                          <span>&bull;</span>
                          <span>{item.contactEmail}</span>
                        </>
                      )}
                    </div>

                    {item.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg max-w-2xl mt-1.5">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(item.dueDate)}
                    </span>
                    <span className="text-[11px] text-slate-400 block">{item.dueTime}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFollowUp(item);
                        setIsModalOpen(true);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 hover:underline px-2 py-1"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Follow-up Modal */}
      <FollowUpModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveFollowUp}
        initialFollowUp={editingFollowUp}
      />
    </div>
  );
};
