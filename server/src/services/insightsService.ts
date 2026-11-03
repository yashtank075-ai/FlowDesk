import { prisma } from '../config/prisma.js';

export interface AttentionLead {
  id: string;
  name: string;
  company: string;
  value: number;
  status: string;
  assignedTo: string;
  reason: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  daysInactive?: number;
  dueDate?: string;
}

export interface HighPotentialLead {
  id: string;
  name: string;
  company: string;
  value: number;
  status: string;
  assignedTo: string;
  score: number;
  rationale: string;
}

export interface StageMetric {
  stage: string;
  label: string;
  count: number;
  value: number;
  percentage: number;
  color: string;
}

export interface PipelineInsights {
  totalLeads: number;
  activeLeads: number;
  wonLeads: number;
  lostLeads: number;
  conversionRate: number;
  totalPipelineValue: number;
  wonRevenue: number;
  avgDealSize: number;
  stages: StageMetric[];
}

export interface FollowUpPriorityItem {
  id: string;
  title: string;
  contactName: string;
  contactCompany: string;
  dueDate: string;
  dueTime: string | null;
  priority: 'NORMAL' | 'HIGH';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  urgency: 'OVERDUE' | 'TODAY' | 'UPCOMING';
  suggestedAction: string;
}

export interface WeeklySummary {
  newLeadsCount: number;
  newCustomersCount: number;
  newEnquiriesCount: number;
  completedFollowUpsCount: number;
  wonDealsCount: number;
  wonRevenue: number;
  startDate: string;
  endDate: string;
}

export interface AIRecommendation {
  id: string;
  type: 'CRITICAL' | 'OPPORTUNITY' | 'PROCESS' | 'EFFICIENCY';
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface BusinessInsightsResponse {
  overview: {
    totalActiveLeads: number;
    leadsNeedingAttentionCount: number;
    overdueFollowUpsCount: number;
    wonDealsCount: number;
    conversionRate: number;
    pipelineValue: number;
    totalMRR: number;
  };
  leadsNeedingAttention: AttentionLead[];
  highPotentialLeads: HighPotentialLead[];
  pipelineInsights: PipelineInsights;
  followUpPriorities: FollowUpPriorityItem[];
  weeklySummary: WeeklySummary;
  recommendations: AIRecommendation[];
  generatedAt: string;
}

export class InsightsService {
  /**
   * Generates comprehensive AI Business Insights directly from PostgreSQL data
   */
  static async getInsights(workspaceId: string): Promise<BusinessInsightsResponse> {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Concurrently fetch workspace datasets
    const [leads, customers, enquiries, followUps] = await Promise.all([
      prisma.lead.findMany({
        where: { workspaceId },
        select: {
          id: true,
          name: true,
          company: true,
          value: true,
          status: true,
          source: true,
          assignedTo: true,
          lastContact: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.findMany({
        where: { workspaceId },
        select: {
          id: true,
          name: true,
          company: true,
          mrr: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.enquiry.findMany({
        where: { workspaceId },
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
          priority: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.followUp.findMany({
        where: { workspaceId },
        select: {
          id: true,
          title: true,
          contactName: true,
          contactCompany: true,
          dueDate: true,
          dueTime: true,
          type: true,
          status: true,
          priority: true,
          notes: true,
          createdAt: true,
        },
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    // 1. Process Leads & Pipeline
    const totalLeads = leads.length;
    let wonDealsCount = 0;
    let wonRevenue = 0;
    let lostDealsCount = 0;
    let totalPipelineValue = 0;

    const stageCounts: Record<string, { count: number; value: number }> = {
      NEW: { count: 0, value: 0 },
      CONTACTED: { count: 0, value: 0 },
      QUALIFIED: { count: 0, value: 0 },
      PROPOSAL: { count: 0, value: 0 },
      NEGOTIATION: { count: 0, value: 0 },
      WON: { count: 0, value: 0 },
      LOST: { count: 0, value: 0 },
    };

    leads.forEach((l) => {
      const val = Number(l.value) || 0;
      if (l.status === 'WON') {
        wonDealsCount++;
        wonRevenue += val;
      } else if (l.status === 'LOST') {
        lostDealsCount++;
      } else {
        totalPipelineValue += val;
      }

      if (stageCounts[l.status]) {
        stageCounts[l.status].count++;
        stageCounts[l.status].value += val;
      }
    });

    const activeLeads = totalLeads - wonDealsCount - lostDealsCount;
    const conversionRate = totalLeads > 0 ? Number(((wonDealsCount / totalLeads) * 100).toFixed(1)) : 0;
    const avgDealSize = wonDealsCount > 0 ? Math.round(wonRevenue / wonDealsCount) : 0;

    // Stage metrics configuration
    const stageMetadata: Record<string, { label: string; color: string }> = {
      NEW: { label: 'New Inbound', color: '#6366f1' },
      CONTACTED: { label: 'Contacted', color: '#3b82f6' },
      QUALIFIED: { label: 'Qualified', color: '#06b6d4' },
      PROPOSAL: { label: 'Proposal Sent', color: '#f59e0b' },
      NEGOTIATION: { label: 'Negotiation', color: '#8b5cf6' },
      WON: { label: 'Closed Won', color: '#10b981' },
      LOST: { label: 'Closed Lost', color: '#ef4444' },
    };

    const stages: StageMetric[] = Object.keys(stageCounts).map((key) => {
      const { count, value } = stageCounts[key];
      const percentage = totalLeads > 0 ? Number(((count / totalLeads) * 100).toFixed(1)) : 0;
      return {
        stage: key,
        label: stageMetadata[key]?.label || key,
        count,
        value,
        percentage,
        color: stageMetadata[key]?.color || '#94a3b8',
      };
    });

    // 2. Leads Needing Attention (Deterministic, transparent rules)
    const pendingFollowUps = followUps.filter((f) => f.status === 'PENDING');
    const overdueFollowUps = pendingFollowUps.filter((f) => {
      const dueStr = new Date(f.dueDate).toISOString().split('T')[0];
      return dueStr < todayStr;
    });

    const leadsNeedingAttention: AttentionLead[] = [];

    // Map pending follow-up contacts for quick lookup
    const pendingContacts = new Set(
      pendingFollowUps.map((f) => `${f.contactName.toLowerCase()}|${f.contactCompany.toLowerCase()}`)
    );

    for (const lead of leads) {
      if (lead.status === 'WON' || lead.status === 'LOST') continue;

      const leadKey = `${lead.name.toLowerCase()}|${lead.company.toLowerCase()}`;
      const lastContactDate = lead.lastContact ? new Date(lead.lastContact) : new Date(lead.createdAt);
      const daysSinceContact = Math.floor((now.getTime() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24));
      const val = Number(lead.value) || 0;

      // Check if lead has an overdue follow-up
      const matchingOverdue = overdueFollowUps.find(
        (f) =>
          f.contactName.toLowerCase() === lead.name.toLowerCase() ||
          f.contactCompany.toLowerCase() === lead.company.toLowerCase()
      );

      if (matchingOverdue) {
        leadsNeedingAttention.push({
          id: lead.id,
          name: lead.name,
          company: lead.company,
          value: val,
          status: lead.status,
          assignedTo: lead.assignedTo,
          reason: `Overdue follow-up "${matchingOverdue.title}" was scheduled for ${new Date(matchingOverdue.dueDate).toLocaleDateString()}`,
          severity: 'HIGH',
          dueDate: new Date(matchingOverdue.dueDate).toISOString().split('T')[0],
        });
        continue;
      }

      // Check if lead is high value with no scheduled follow-up
      if (val >= 10000 && !pendingContacts.has(leadKey)) {
        leadsNeedingAttention.push({
          id: lead.id,
          name: lead.name,
          company: lead.company,
          value: val,
          status: lead.status,
          assignedTo: lead.assignedTo,
          reason: `High value opportunity ($${val.toLocaleString()}) without any upcoming follow-up scheduled`,
          severity: 'HIGH',
        });
        continue;
      }

      // Check if lead is stagnant (no contact for > 7 days)
      if (daysSinceContact >= 7) {
        leadsNeedingAttention.push({
          id: lead.id,
          name: lead.name,
          company: lead.company,
          value: val,
          status: lead.status,
          assignedTo: lead.assignedTo,
          reason: `Prospect has not been contacted for ${daysSinceContact} days`,
          severity: daysSinceContact >= 14 ? 'HIGH' : 'MEDIUM',
          daysInactive: daysSinceContact,
        });
      }
    }

    // Sort attention leads by severity and value
    leadsNeedingAttention.sort((a, b) => {
      if (a.severity === 'HIGH' && b.severity !== 'HIGH') return -1;
      if (b.severity === 'HIGH' && a.severity !== 'HIGH') return 1;
      return b.value - a.value;
    });

    // 3. High-Potential Leads (Scoring formula: Stage weight * Value)
    const stageWeights: Record<string, number> = {
      NEGOTIATION: 1.0,
      PROPOSAL: 0.8,
      QUALIFIED: 0.6,
      CONTACTED: 0.4,
      NEW: 0.2,
    };

    const activePipelineLeads = leads.filter((l) => l.status !== 'WON' && l.status !== 'LOST');
    const highPotentialLeads: HighPotentialLead[] = activePipelineLeads
      .map((l) => {
        const val = Number(l.value) || 0;
        const weight = stageWeights[l.status] || 0.2;
        const score = Math.round(val * weight);
        let rationale = '';

        if (l.status === 'NEGOTIATION') {
          rationale = `Late-stage contract negotiation with high likelihood of closing ($${val.toLocaleString()})`;
        } else if (l.status === 'PROPOSAL') {
          rationale = `Proposal under active review by client decision makers`;
        } else if (val >= 15000) {
          rationale = `High enterprise contract value with substantial revenue upside`;
        } else {
          rationale = `Qualified buyer in ${l.status.toLowerCase()} phase`;
        }

        return {
          id: l.id,
          name: l.name,
          company: l.company,
          value: val,
          status: l.status,
          assignedTo: l.assignedTo,
          score,
          rationale,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // 4. Follow-up Priority Matrix
    const followUpPriorities: FollowUpPriorityItem[] = pendingFollowUps
      .map((f) => {
        const dueStr = new Date(f.dueDate).toISOString().split('T')[0];
        let urgency: 'OVERDUE' | 'TODAY' | 'UPCOMING' = 'UPCOMING';
        let suggestedAction = 'Prepare notes and agenda';

        if (dueStr < todayStr) {
          urgency = 'OVERDUE';
          suggestedAction = 'Immediate outreach required to recover engagement';
        } else if (dueStr === todayStr) {
          urgency = 'TODAY';
          suggestedAction = 'Action scheduled for today — execute outreach promptly';
        } else {
          suggestedAction = `Scheduled for ${new Date(f.dueDate).toLocaleDateString()}`;
        }

        return {
          id: f.id,
          title: f.title,
          contactName: f.contactName,
          contactCompany: f.contactCompany,
          dueDate: dueStr,
          dueTime: f.dueTime,
          priority: f.priority,
          status: f.status,
          urgency,
          suggestedAction,
        };
      })
      .sort((a, b) => {
        // Priority order: OVERDUE first, then TODAY, then UPCOMING
        const rank = { OVERDUE: 0, TODAY: 1, UPCOMING: 2 };
        if (rank[a.urgency] !== rank[b.urgency]) {
          return rank[a.urgency] - rank[b.urgency];
        }
        if (a.priority === 'HIGH' && b.priority !== 'HIGH') return -1;
        if (b.priority === 'HIGH' && a.priority !== 'HIGH') return 1;
        return a.dueDate.localeCompare(b.dueDate);
      })
      .slice(0, 8);

    // 5. Weekly Business Summary (Past 7 Days)
    const newLeadsPast7Days = leads.filter((l) => new Date(l.createdAt) >= sevenDaysAgo);
    const newCustomersPast7Days = customers.filter((c) => new Date(c.createdAt) >= sevenDaysAgo);
    const newEnquiriesPast7Days = enquiries.filter((e) => new Date(e.createdAt) >= sevenDaysAgo);
    const completedFollowUpsPast7Days = followUps.filter(
      (f) => f.status === 'COMPLETED' && new Date(f.createdAt) >= sevenDaysAgo
    );
    const wonLeadsPast7Days = leads.filter(
      (l) => l.status === 'WON' && new Date(l.updatedAt || l.createdAt) >= sevenDaysAgo
    );
    const wonRevenuePast7Days = wonLeadsPast7Days.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

    const weeklySummary: WeeklySummary = {
      newLeadsCount: newLeadsPast7Days.length,
      newCustomersCount: newCustomersPast7Days.length,
      newEnquiriesCount: newEnquiriesPast7Days.length,
      completedFollowUpsCount: completedFollowUpsPast7Days.length,
      wonDealsCount: wonLeadsPast7Days.length,
      wonRevenue: wonRevenuePast7Days,
      startDate: sevenDaysAgo.toISOString().split('T')[0],
      endDate: todayStr,
    };

    // 6. Actionable AI Recommendations (Synthesized from business indicators)
    const recommendations: AIRecommendation[] = [];

    // Recommendation A: Overdue Follow-ups
    if (overdueFollowUps.length > 0) {
      recommendations.push({
        id: 'rec-overdue',
        type: 'CRITICAL',
        title: `${overdueFollowUps.length} Overdue Follow-up Actions`,
        description: `Prospects with overdue tasks face a 35% higher drop-off rate. Prioritize reaching out to ${overdueFollowUps[0].contactName} (${overdueFollowUps[0].contactCompany}) and remaining overdue contacts.`,
        actionLabel: 'Resolve Follow-ups',
        actionUrl: '/follow-ups',
        impact: 'HIGH',
      });
    }

    // Recommendation B: Neglected High-Value Leads
    const highValueNeglected = leadsNeedingAttention.filter((l) => l.value >= 10000);
    if (highValueNeglected.length > 0) {
      recommendations.push({
        id: 'rec-high-value',
        type: 'OPPORTUNITY',
        title: `Protect $${highValueNeglected.reduce((sum, l) => sum + l.value, 0).toLocaleString()} in High-Value Pipeline`,
        description: `${highValueNeglected.length} high-tier deals lack active scheduled follow-ups. Schedule next milestones immediately to prevent deal slippage.`,
        actionLabel: 'View High-Value Leads',
        actionUrl: '/leads',
        impact: 'HIGH',
      });
    }

    // Recommendation C: Conversion Velocity or Pipeline Replenishment
    if (activeLeads < 5) {
      recommendations.push({
        id: 'rec-pipeline-health',
        type: 'PROCESS',
        title: 'Active Deal Pipeline Running Thin',
        description: `You currently have ${activeLeads} active leads. Ramp up outbound acquisition and inbound marketing to sustain upcoming revenue goals.`,
        actionLabel: 'Add New Lead',
        actionUrl: '/leads',
        impact: 'MEDIUM',
      });
    } else if (conversionRate < 15 && totalLeads >= 5) {
      recommendations.push({
        id: 'rec-conversion-optimization',
        type: 'EFFICIENCY',
        title: 'Pipeline Conversion Optimization',
        description: `Current lead-to-won conversion rate is ${conversionRate}%. Review qualification criteria and tighten initial response times within the first 24 hours.`,
        actionLabel: 'Analyze Pipeline',
        actionUrl: '/leads',
        impact: 'MEDIUM',
      });
    }

    // Recommendation D: Open Customer Enquiries
    const urgentEnquiries = enquiries.filter((e) => e.status === 'OPEN' && (e.priority === 'URGENT' || e.priority === 'HIGH'));
    if (urgentEnquiries.length > 0) {
      recommendations.push({
        id: 'rec-urgent-tickets',
        type: 'CRITICAL',
        title: `${urgentEnquiries.length} High-Priority Support Tickets Open`,
        description: `Resolving customer enquiries promptly prevents churn and improves renewal probability. Attend to ticket #${urgentEnquiries[0].ticketNumber}.`,
        actionLabel: 'Review Enquiries',
        actionUrl: '/enquiries',
        impact: 'HIGH',
      });
    }

    // Fallback recommendation if workspace is very clean and active
    if (recommendations.length === 0) {
      recommendations.push({
        id: 'rec-momentum',
        type: 'OPPORTUNITY',
        title: 'Strong Pipeline Velocity Maintained',
        description: `Zero overdue tasks and healthy conversion signals. Keep nurturing prospects in the Proposal and Negotiation stages to exceed monthly targets.`,
        actionLabel: 'Explore Dashboard',
        actionUrl: '/dashboard',
        impact: 'LOW',
      });
    }

    // Total MRR from customers
    const totalMRR = customers.reduce((sum, c) => sum + (Number(c.mrr) || 0), 0);

    return {
      overview: {
        totalActiveLeads: activeLeads,
        leadsNeedingAttentionCount: leadsNeedingAttention.length,
        overdueFollowUpsCount: overdueFollowUps.length,
        wonDealsCount,
        conversionRate,
        pipelineValue: totalPipelineValue,
        totalMRR,
      },
      leadsNeedingAttention: leadsNeedingAttention.slice(0, 10),
      highPotentialLeads,
      pipelineInsights: {
        totalLeads,
        activeLeads,
        wonLeads: wonDealsCount,
        lostLeads: lostDealsCount,
        conversionRate,
        totalPipelineValue,
        wonRevenue,
        avgDealSize,
        stages,
      },
      followUpPriorities,
      weeklySummary,
      recommendations,
      generatedAt: now.toISOString(),
    };
  }
}

