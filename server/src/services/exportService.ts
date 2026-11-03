import { prisma } from '../config/prisma.js';
import { SimpleCsvGenerator } from '../utils/csvGenerator.js';
import { SimplePdfDocument, PdfTableColumn } from '../utils/pdfGenerator.js';

export type ReportType = 'leads' | 'customers' | 'enquiries' | 'follow-ups' | 'analytics';
export type ExportFormat = 'csv' | 'pdf';

export interface ExportResult {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

export class ExportService {
  /**
   * Export workspace data based on report type and format
   */
  static async exportReport(
    workspaceId: string,
    reportType: ReportType,
    format: ExportFormat
  ): Promise<ExportResult> {
    // 1. Fetch workspace name for branding
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    });
    const workspaceName = workspace?.name || 'FlowDesk Workspace';
    const timestamp = new Date().toISOString().split('T')[0];

    switch (reportType) {
      case 'leads':
        return ExportService.exportLeads(workspaceId, workspaceName, format, timestamp);
      case 'customers':
        return ExportService.exportCustomers(workspaceId, workspaceName, format, timestamp);
      case 'enquiries':
        return ExportService.exportEnquiries(workspaceId, workspaceName, format, timestamp);
      case 'follow-ups':
        return ExportService.exportFollowUps(workspaceId, workspaceName, format, timestamp);
      case 'analytics':
        return ExportService.exportAnalytics(workspaceId, workspaceName, format, timestamp);
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }

  // -------------------------------------------------------------
  // LEADS EXPORT
  // -------------------------------------------------------------
  private static async exportLeads(
    workspaceId: string,
    workspaceName: string,
    format: ExportFormat,
    timestamp: string
  ): Promise<ExportResult> {
    const leads = await prisma.lead.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Lead Name',
      'Company',
      'Email',
      'Phone',
      'Lead Source',
      'Lead Status',
      'Deal Value ($)',
      'Assigned User',
      'Creation Date',
    ];

    const rows = leads.map((l) => [
      l.name,
      l.company,
      l.email,
      l.phone || '',
      l.source.replace(/_/g, ' '),
      l.status,
      Number(l.value).toFixed(2),
      l.assignedTo,
      l.createdAt.toISOString().split('T')[0],
    ]);

    const filename = `FlowDesk_Leads_${timestamp}.${format}`;

    if (format === 'csv') {
      const buffer = SimpleCsvGenerator.generateCsv(headers, rows);
      return { buffer, filename, contentType: 'text/csv; charset=utf-8' };
    }

    // PDF Format
    const totalPipeline = leads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
    const wonCount = leads.filter((l) => l.status === 'WON').length;

    const columns: PdfTableColumn[] = [
      { header: 'Name', width: 65 },
      { header: 'Company', width: 65 },
      { header: 'Email', width: 80 },
      { header: 'Source', width: 50 },
      { header: 'Status', width: 45 },
      { header: 'Value ($)', width: 45, align: 'right' },
      { header: 'Rep', width: 55 },
      { header: 'Created', width: 45 },
    ];

    const pdfRows = leads.map((l) => [
      l.name,
      l.company,
      l.email,
      l.source.replace(/_/g, ' '),
      l.status,
      `$${Number(l.value).toLocaleString()}`,
      l.assignedTo,
      l.createdAt.toISOString().split('T')[0],
    ]);

    const buffer = SimplePdfDocument.generateReport({
      title: 'Leads Pipeline & Acquisition Report',
      subtitle: `Complete pipeline audit and prospect breakdown for ${workspaceName}`,
      workspaceName,
      summaryMetrics: [
        { label: 'Total Leads', value: String(leads.length) },
        { label: 'Active Pipeline', value: `$${Math.round(totalPipeline).toLocaleString()}` },
        { label: 'Won Deals', value: String(wonCount) },
      ],
      columns,
      rows: pdfRows,
    });

    return { buffer, filename, contentType: 'application/pdf' };
  }

  // -------------------------------------------------------------
  // CUSTOMERS EXPORT
  // -------------------------------------------------------------
  private static async exportCustomers(
    workspaceId: string,
    workspaceName: string,
    format: ExportFormat,
    timestamp: string
  ): Promise<ExportResult> {
    const customers = await prisma.customer.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Customer Name',
      'Company',
      'Email',
      'Phone',
      'Customer Status',
      'Tier',
      'Monthly Recurring Revenue (MRR $)',
      'Created Date',
    ];

    const rows = customers.map((c) => [
      c.name,
      c.company,
      c.email,
      c.phone || '',
      c.status,
      c.tier,
      Number(c.mrr).toFixed(2),
      c.createdAt.toISOString().split('T')[0],
    ]);

    const filename = `FlowDesk_Customers_${timestamp}.${format}`;

    if (format === 'csv') {
      const buffer = SimpleCsvGenerator.generateCsv(headers, rows);
      return { buffer, filename, contentType: 'text/csv; charset=utf-8' };
    }

    const totalMRR = customers.reduce((sum, c) => sum + (Number(c.mrr) || 0), 0);
    const activeCount = customers.filter((c) => c.status === 'ACTIVE').length;

    const columns: PdfTableColumn[] = [
      { header: 'Customer', width: 75 },
      { header: 'Company', width: 75 },
      { header: 'Email', width: 90 },
      { header: 'Status', width: 45 },
      { header: 'Tier', width: 45 },
      { header: 'MRR ($)', width: 45, align: 'right' },
      { header: 'Joined Date', width: 55 },
    ];

    const pdfRows = customers.map((c) => [
      c.name,
      c.company,
      c.email,
      c.status,
      c.tier,
      `$${Number(c.mrr).toLocaleString()}`,
      c.createdAt.toISOString().split('T')[0],
    ]);

    const buffer = SimplePdfDocument.generateReport({
      title: 'Customer Directory & Accounts Report',
      subtitle: `Active accounts, recurring contract revenue, and tier segmentation`,
      workspaceName,
      summaryMetrics: [
        { label: 'Total Accounts', value: String(customers.length) },
        { label: 'Active Clients', value: String(activeCount) },
        { label: 'Total MRR', value: `$${Math.round(totalMRR).toLocaleString()}` },
      ],
      columns,
      rows: pdfRows,
    });

    return { buffer, filename, contentType: 'application/pdf' };
  }

  // -------------------------------------------------------------
  // ENQUIRIES EXPORT
  // -------------------------------------------------------------
  private static async exportEnquiries(
    workspaceId: string,
    workspaceName: string,
    format: ExportFormat,
    timestamp: string
  ): Promise<ExportResult> {
    const enquiries = await prisma.enquiry.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Ticket Number',
      'Subject',
      'Customer Contact',
      'Customer Email',
      'Category',
      'Priority',
      'Status',
      'Assigned User',
      'Created Date',
    ];

    const rows = enquiries.map((e) => [
      e.ticketNumber,
      e.subject,
      e.customerName,
      e.customerEmail,
      e.category,
      e.priority,
      e.status.replace(/_/g, ' '),
      e.assignedAgent || 'Unassigned',
      e.createdAt.toISOString().split('T')[0],
    ]);

    const filename = `FlowDesk_Enquiries_${timestamp}.${format}`;

    if (format === 'csv') {
      const buffer = SimpleCsvGenerator.generateCsv(headers, rows);
      return { buffer, filename, contentType: 'text/csv; charset=utf-8' };
    }

    const openCount = enquiries.filter((e) => e.status !== 'RESOLVED').length;
    const resolvedCount = enquiries.filter((e) => e.status === 'RESOLVED').length;

    const columns: PdfTableColumn[] = [
      { header: 'Ticket #', width: 55 },
      { header: 'Subject', width: 95 },
      { header: 'Customer', width: 65 },
      { header: 'Category', width: 60 },
      { header: 'Priority', width: 45 },
      { header: 'Status', width: 55 },
      { header: 'Agent', width: 55 },
      { header: 'Created', width: 45 },
    ];

    const pdfRows = enquiries.map((e) => [
      e.ticketNumber,
      e.subject,
      e.customerName,
      e.category,
      e.priority,
      e.status.replace(/_/g, ' '),
      e.assignedAgent || 'Support Team',
      e.createdAt.toISOString().split('T')[0],
    ]);

    const buffer = SimplePdfDocument.generateReport({
      title: 'Customer Enquiries & Support Tickets Report',
      subtitle: `Inbound customer issues, priority triage, and agent assignment status`,
      workspaceName,
      summaryMetrics: [
        { label: 'Total Tickets', value: String(enquiries.length) },
        { label: 'Open / In Progress', value: String(openCount) },
        { label: 'Resolved Tickets', value: String(resolvedCount) },
      ],
      columns,
      rows: pdfRows,
    });

    return { buffer, filename, contentType: 'application/pdf' };
  }

  // -------------------------------------------------------------
  // FOLLOW-UPS EXPORT
  // -------------------------------------------------------------
  private static async exportFollowUps(
    workspaceId: string,
    workspaceName: string,
    format: ExportFormat,
    timestamp: string
  ): Promise<ExportResult> {
    const followUps = await prisma.followUp.findMany({
      where: { workspaceId },
      orderBy: { dueDate: 'asc' },
    });

    const headers = [
      'Follow-up Title',
      'Related Contact',
      'Company',
      'Email',
      'Scheduled Date',
      'Scheduled Time',
      'Activity Type',
      'Status',
      'Priority',
      'Notes',
    ];

    const rows = followUps.map((f) => [
      f.title,
      f.contactName,
      f.contactCompany,
      f.contactEmail || '',
      f.dueDate.toISOString().split('T')[0],
      f.dueTime,
      f.type.replace(/_/g, ' '),
      f.status,
      f.priority,
      f.notes || '',
    ]);

    const filename = `FlowDesk_FollowUps_${timestamp}.${format}`;

    if (format === 'csv') {
      const buffer = SimpleCsvGenerator.generateCsv(headers, rows);
      return { buffer, filename, contentType: 'text/csv; charset=utf-8' };
    }

    const pendingCount = followUps.filter((f) => f.status === 'PENDING').length;
    const completedCount = followUps.filter((f) => f.status === 'COMPLETED').length;

    const columns: PdfTableColumn[] = [
      { header: 'Title', width: 85 },
      { header: 'Contact', width: 70 },
      { header: 'Company', width: 70 },
      { header: 'Type', width: 50 },
      { header: 'Date', width: 50 },
      { header: 'Time', width: 40 },
      { header: 'Status', width: 45 },
      { header: 'Priority', width: 40 },
    ];

    const pdfRows = followUps.map((f) => [
      f.title,
      f.contactName,
      f.contactCompany,
      f.type.replace(/_/g, ' '),
      f.dueDate.toISOString().split('T')[0],
      f.dueTime || '12:00',
      f.status,
      f.priority,
    ]);

    const buffer = SimplePdfDocument.generateReport({
      title: 'Outreach & Follow-ups Schedule Report',
      subtitle: `Scheduled client calls, product demos, outreach tasks, and status tracking`,
      workspaceName,
      summaryMetrics: [
        { label: 'Total Tasks', value: String(followUps.length) },
        { label: 'Pending Outreach', value: String(pendingCount) },
        { label: 'Completed Actions', value: String(completedCount) },
      ],
      columns,
      rows: pdfRows,
    });

    return { buffer, filename, contentType: 'application/pdf' };
  }

  // -------------------------------------------------------------
  // DASHBOARD ANALYTICS EXPORT
  // -------------------------------------------------------------
  private static async exportAnalytics(
    workspaceId: string,
    workspaceName: string,
    format: ExportFormat,
    timestamp: string
  ): Promise<ExportResult> {
    const [leads, customers, enquiries, followUps] = await Promise.all([
      prisma.lead.findMany({ where: { workspaceId } }),
      prisma.customer.findMany({ where: { workspaceId } }),
      prisma.enquiry.findMany({ where: { workspaceId } }),
      prisma.followUp.findMany({ where: { workspaceId } }),
    ]);

    const totalLeads = leads.length;
    const totalPipelineValue = leads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
    const wonLeads = leads.filter((l) => l.status === 'WON');
    const wonDealsCount = wonLeads.length;
    const wonDealsRevenue = wonLeads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
    const conversionRate = totalLeads > 0 ? ((wonDealsCount / totalLeads) * 100).toFixed(1) + '%' : '0.0%';

    const activeCustomers = customers.filter((c) => c.status === 'ACTIVE');
    const totalMRR = activeCustomers.reduce((sum, c) => sum + (Number(c.mrr) || 0), 0);

    const openEnquiries = enquiries.filter((e) => e.status !== 'RESOLVED').length;
    const pendingFollowUps = followUps.filter((f) => f.status === 'PENDING').length;

    const headers = ['Metric Category', 'Key Performance Indicator', 'Value', 'Unit / Currency'];
    const rows = [
      ['Pipeline', 'Total Leads Count', totalLeads, 'Count'],
      ['Pipeline', 'Total Pipeline Deal Value', totalPipelineValue.toFixed(2), 'USD'],
      ['Sales Performance', 'Won Deals Count', wonDealsCount, 'Deals'],
      ['Sales Performance', 'Won Deals Revenue Realized', wonDealsRevenue.toFixed(2), 'USD'],
      ['Sales Performance', 'Lead-to-Win Conversion Rate', conversionRate, 'Ratio'],
      ['Client Directory', 'Total Customer Accounts', customers.length, 'Accounts'],
      ['Client Directory', 'Active Recurring Customers', activeCustomers.length, 'Accounts'],
      ['Revenue Metrics', 'Active Monthly Recurring Revenue (MRR)', totalMRR.toFixed(2), 'USD'],
      ['Revenue Metrics', 'Annual Run Rate (ARR)', (totalMRR * 12).toFixed(2), 'USD'],
      ['Support Operations', 'Total Support Enquiries', enquiries.length, 'Tickets'],
      ['Support Operations', 'Open / Escalated Enquiries', openEnquiries, 'Tickets'],
      ['Sales Outreach', 'Total Outreach Tasks', followUps.length, 'Actions'],
      ['Sales Outreach', 'Pending Follow-up Actions', pendingFollowUps, 'Actions'],
    ];

    const filename = `FlowDesk_Executive_Analytics_${timestamp}.${format}`;

    if (format === 'csv') {
      const buffer = SimpleCsvGenerator.generateCsv(headers, rows);
      return { buffer, filename, contentType: 'text/csv; charset=utf-8' };
    }

    const columns: PdfTableColumn[] = [
      { header: 'Category', width: 90 },
      { header: 'Key Performance Indicator', width: 150 },
      { header: 'Value', width: 70, align: 'right' },
      { header: 'Unit', width: 50 },
    ];

    const pdfRows = rows.map((r) => [String(r[0]), String(r[1]), String(r[2]), String(r[3])]);

    const buffer = SimplePdfDocument.generateReport({
      title: 'Executive Operations & Analytics Report',
      subtitle: `Consolidated executive business KPIs and pipeline metrics for ${workspaceName}`,
      workspaceName,
      summaryMetrics: [
        { label: 'Active Pipeline', value: `$${Math.round(totalPipelineValue).toLocaleString()}` },
        { label: 'Monthly MRR', value: `$${Math.round(totalMRR).toLocaleString()}` },
        { label: 'Win Rate', value: conversionRate },
      ],
      columns,
      rows: pdfRows,
    });

    return { buffer, filename, contentType: 'application/pdf' };
  }
}
