import React, { useState } from 'react';
import {
  FileDown,
  Users,
  Building2,
  HelpCircle,
  CalendarCheck,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Database,
} from 'lucide-react';
import { exportService, ReportType, ExportFormat } from '../services/exportService';
import { useAuth } from '../context/AuthContext';

interface ReportCardConfig {
  type: ReportType;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  includedFields: string[];
}

const reportConfigs: ReportCardConfig[] = [
  {
    type: 'leads',
    title: 'Leads & Pipeline Opportunities',
    description: 'Full record of prospects, status stages, deal values, assigned reps, and acquisition source.',
    icon: Users,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    includedFields: ['Name & Company', 'Email & Phone', 'Deal Value (₹)', 'Lead Status', 'Lead Source', 'Assigned Rep', 'Creation Date'],
  },
  {
    type: 'customers',
    title: 'Customer Directory & Accounts',
    description: 'Active client accounts, recurring revenue contracts (MRR), subscription tiers, and manager assignments.',
    icon: Building2,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    includedFields: ['Account & Company', 'Email & Contact', 'Status & Tier', 'MRR (₹)', 'Assigned Manager', 'Joined Date'],
  },
  {
    type: 'enquiries',
    title: 'Support Tickets & Inbound Inquiries',
    description: 'Customer requests, issue categories, escalation priorities, assigned support agents, and statuses.',
    icon: HelpCircle,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    includedFields: ['Ticket # & Subject', 'Contact Details', 'Category', 'Priority Level', 'Ticket Status', 'Assigned Agent', 'Logged Date'],
  },
  {
    type: 'follow-ups',
    title: 'Outreach & Follow-up Schedules',
    description: 'Scheduled outreach calls, product demos, contract reviews, due dates, and completion statuses.',
    icon: CalendarCheck,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
    includedFields: ['Task Title', 'Related Contact & Company', 'Scheduled Date & Time', 'Action Type', 'Status & Priority', 'Notes'],
  },
  {
    type: 'analytics',
    title: 'Executive Analytics & Performance',
    description: 'Consolidated executive metrics including total pipeline value, active MRR, won deals, and conversion rates.',
    icon: TrendingUp,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
    includedFields: ['Total Pipeline Value', 'Won Revenue', 'Win Conversion %', 'Total Active MRR', 'Annualized ARR', 'Operational Counts'],
  },
];

export const ExportReportsPage: React.FC = () => {
  const { currentWorkspace } = useAuth();
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleExport = async (type: ReportType, format: ExportFormat, title: string) => {
    const key = `${type}-${format}`;
    if (downloadingKey) return; // Prevent duplicate requests

    setDownloadingKey(key);
    setFeedback(null);

    try {
      await exportService.downloadReport(type, format);
      setFeedback({
        type: 'success',
        message: `Successfully generated and downloaded ${title} in ${format.toUpperCase()} format.`,
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      console.error('Export download error:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || `Failed to export ${title}. Please try again.`,
      });
    } finally {
      setDownloadingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Export Reports</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-200/80 inline-flex items-center gap-1">
              <Database className="w-3 h-3 text-indigo-600" /> PostgreSQL Audited
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Export real business records and consolidated executive analytics for{' '}
            <span className="font-semibold text-slate-700">{currentWorkspace?.name || 'Workspace'}</span> in CSV and PDF formats.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Workspace Isolated & Formula-Sanitized</span>
          </div>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs opacity-75 hover:opacity-100 font-bold ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportConfigs.map((config) => {
          const Icon = config.icon;
          const isCsvDownloading = downloadingKey === `${config.type}-csv`;
          const isPdfDownloading = downloadingKey === `${config.type}-pdf`;
          const isBusy = downloadingKey !== null;

          return (
            <div
              key={config.type}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)] p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                {/* Header Icon + Title */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl ${config.iconBg} ${config.iconColor} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{config.title}</h3>
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                      Report: {config.type}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-4 leading-relaxed">{config.description}</p>

                {/* Included fields tags */}
                <div className="mb-6">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Included Columns & Fields
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {config.includedFields.map((field) => (
                      <span
                        key={field}
                        className="text-[10px] bg-slate-50 text-slate-600 border border-slate-100 px-2 py-0.5 rounded-md font-medium"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons: CSV & PDF */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                {/* CSV Download Button */}
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleExport(config.type, 'csv', config.title)}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    isCsvDownloading
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  {isCsvDownloading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>{isCsvDownloading ? 'Generating...' : 'Export CSV'}</span>
                </button>

                {/* PDF Download Button */}
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleExport(config.type, 'pdf', config.title)}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all ${
                    isPdfDownloading
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-xs active:scale-[0.98]'
                  }`}
                >
                  {isPdfDownloading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-white" />
                  )}
                  <span>{isPdfDownloading ? 'Building PDF...' : 'Export PDF'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExportReportsPage;

