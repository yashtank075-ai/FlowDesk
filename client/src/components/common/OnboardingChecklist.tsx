import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface OnboardingMetrics {
  totalLeads: number;
  totalCustomers: number;
  totalFollowUps: number;
  workspaceName?: string;
}

interface OnboardingChecklistProps {
  metrics: OnboardingMetrics;
  onOpenLeadModal: () => void;
  onOpenCustomerModal: () => void;
  onOpenFollowUpModal: () => void;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  metrics,
  onOpenLeadModal,
  onOpenCustomerModal,
  onOpenFollowUpModal,
}) => {
  const navigate = useNavigate();
  const { currentWorkspace } = useAuth();
  const workspaceId = currentWorkspace?.id || 'default';

  // Per-workspace dismissal storage so other workspaces or users aren't affected
  const dismissKey = `flowdesk_onboarding_dismissed_${workspaceId}`;
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return localStorage.getItem(dismissKey) === 'true';
  });
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Synced with workspace switch
  useEffect(() => {
    setIsDismissed(localStorage.getItem(dismissKey) === 'true');
  }, [dismissKey]);

  // Core actionable setup tasks based on REAL database entities
  const coreTasks = [
    {
      id: 'workspace',
      label: 'Set up business workspace',
      description: 'Your workspace name and operating currency have been initialized',
      completed: Boolean(currentWorkspace?.name && currentWorkspace.name.trim().length > 0),
      action: () => navigate('/settings'),
      actionText: 'View Workspace',
      isOptional: false,
    },
    {
      id: 'lead',
      label: 'Create first lead',
      description: 'Track potential prospects and deal value in your sales pipeline',
      completed: metrics.totalLeads > 0,
      action: onOpenLeadModal,
      actionText: 'Add Lead',
      isOptional: false,
    },
    {
      id: 'customer',
      label: 'Add first customer',
      description: 'Record active accounts, subscription tiers, and recurring MRR',
      completed: metrics.totalCustomers > 0,
      action: onOpenCustomerModal,
      actionText: 'Add Customer',
      isOptional: false,
    },
    {
      id: 'followup',
      label: 'Schedule first follow-up',
      description: 'Never miss an outreach call, product demo, or closing meeting',
      completed: metrics.totalFollowUps > 0,
      action: onOpenFollowUpModal,
      actionText: 'Schedule Task',
      isOptional: false,
    },
  ];

  // Optional guidance item (not counted toward required setup completion)
  const optionalTask = {
    id: 'insights',
    label: 'Explore business insights',
    description: 'Review pipeline analytics and automated deal health alerts',
    action: () => navigate('/insights'),
    actionText: 'View Insights',
    isOptional: true,
  };

  const allItems = [...coreTasks, optionalTask];
  const requiredTasks = coreTasks;
  const completedCount = requiredTasks.filter((t) => t.completed).length;
  const isAllRequiredCompleted = completedCount === requiredTasks.length;
  const progressPercent = Math.round((completedCount / requiredTasks.length) * 100);

  // If user dismissed, provide option to recall
  if (isDismissed) {
    return (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem(dismissKey);
            setIsDismissed(false);
          }}
          className="text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-100"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>
            {isAllRequiredCompleted
              ? `Onboarding Complete (${completedCount}/${requiredTasks.length})`
              : `Show Onboarding Guide (${completedCount}/${requiredTasks.length})`}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 shadow-[0_4px_16px_rgba(79,70,229,0.06)] overflow-hidden transition-all duration-300">
      {/* Header bar */}
      <div
        className={`p-5 sm:p-6 border-b transition-colors flex items-start justify-between gap-4 ${
          isAllRequiredCompleted
            ? 'bg-gradient-to-r from-emerald-50/80 via-slate-50 to-white border-emerald-100'
            : 'bg-gradient-to-r from-indigo-50/70 via-slate-50 to-white border-indigo-50'
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg text-white shadow-xs ${
                isAllRequiredCompleted ? 'bg-emerald-600' : 'bg-indigo-600'
              }`}
            >
              {isAllRequiredCompleted ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {isAllRequiredCompleted ? 'Workspace Onboarding Complete!' : 'Welcome to FlowDesk AI'}
            </h3>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                isAllRequiredCompleted
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {isAllRequiredCompleted ? 'All Tasks Complete (4/4)' : `${completedCount}/4 Completed`}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            {isAllRequiredCompleted
              ? 'Great job! Your business workspace is fully organized and ready for growth.'
              : "Your workspace is ready. Let's get your business organized."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title={isCollapsed ? 'Expand checklist' : 'Collapse checklist'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem(dismissKey, 'true');
              setIsDismissed(true);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Dismiss checklist"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5">
        <div
          className={`h-1.5 transition-all duration-500 ease-out ${
            isAllRequiredCompleted ? 'bg-emerald-600' : 'bg-indigo-600'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Collapsible Checklist Items */}
      {!isCollapsed && (
        <div className="p-4 sm:p-6 divide-y divide-slate-100">
          {allItems.map((task) => (
            <div
              key={task.id}
              className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                <div className="pt-0.5 shrink-0">
                  {'completed' in task && task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                  ) : task.isOptional ? (
                    <div className="w-5 h-5 rounded-full border border-dashed border-indigo-300 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    </div>
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4
                      className={`text-sm font-semibold ${
                        'completed' in task && task.completed ? 'text-slate-500 line-through' : 'text-slate-900'
                      }`}
                    >
                      {task.label}
                    </h4>
                    {task.isOptional && (
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                        Optional
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                </div>
              </div>

              {(!('completed' in task) || !task.completed) && (
                <button
                  type="button"
                  onClick={task.action}
                  className="sm:shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 rounded-xl transition-colors self-start sm:self-center"
                >
                  <span>{task.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}

          {/* Completion Celebration Footer */}
          {isAllRequiredCompleted && (
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/50 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 border-t border-emerald-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>All essential setup milestones have been achieved!</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem(dismissKey, 'true');
                  setIsDismissed(true);
                }}
                className="text-xs font-medium px-3 py-1.5 bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50 rounded-xl transition-colors self-start sm:self-auto cursor-pointer"
              >
                Dismiss Checklist
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
