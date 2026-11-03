import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, AlertCircle } from 'lucide-react';
import { LegalNavbar } from '../components/layout/LegalNavbar';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between overflow-x-hidden">
      {/* Top Navigation Bar */}
      <LegalNavbar currentPage="privacy" />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-14 min-w-0">
        {/* Document Header */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-8 lg:p-10 shadow-sm mb-6 sm:mb-8 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 text-emerald-600 mb-2.5 sm:mb-3">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
              Privacy & Data Governance
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight break-words">
            Privacy Policy
          </h1>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-500">
            Last Updated: November 3, 2026 • Version 1.0 (Public Beta)
          </p>
          <div className="mt-3.5 sm:mt-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed break-words">
            <span className="font-semibold">Notice for Public Beta Users:</span> This privacy policy describes the technical architecture, data handling practices, and third-party cloud infrastructure currently utilized by FlowDesk AI. Contact addresses and data controller entity details are flagged below for platform owner confirmation before commercial launch.
          </div>
        </div>

        {/* Policy Sections */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-8 lg:p-10 shadow-sm space-y-8 sm:space-y-10 text-xs sm:text-sm leading-relaxed text-slate-600 min-w-0">
          {/* Section 1 */}
          <section className="space-y-2.5 sm:space-y-3 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-start sm:items-center gap-2 break-words">
              <span className="text-indigo-600 font-mono text-sm shrink-0">1.</span>
              <span>Information We Collect</span>
            </h2>
            <p className="break-words">
              FlowDesk AI collects information directly provided by users and their authorized team members in connection with account creation and SaaS CRM utilization:
            </p>
            <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 text-slate-600 break-words">
              <li><span className="font-semibold text-slate-700">Account Credentials:</span> Full name, business email address, and hashed password during registration.</li>
              <li><span className="font-semibold text-slate-700">Workspace Metadata:</span> Workspace name, slug identifier, and workspace currency setting (e.g. INR or USD).</li>
              <li><span className="font-semibold text-slate-700">Business Operational Records:</span> CRM leads (contact names, company, email, phone, deal values, pipeline stage), customer records (MRR values, renewal dates), customer service enquiries, and sales follow-up tasks.</li>
              <li><span className="font-semibold text-slate-700">Technical Connection Data:</span> Client IP address and browser User-Agent header recorded in session tokens for security origin verification and session rotation.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-2.5 sm:space-y-3 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-start sm:items-center gap-2 break-words">
              <span className="text-indigo-600 font-mono text-sm shrink-0">2.</span>
              <span>How Information Is Used</span>
            </h2>
            <p className="break-words">
              We process your data strictly to operate, secure, and deliver the core capabilities of FlowDesk AI:
            </p>
            <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 text-slate-600 break-words">
              <li>Authenticating users, maintaining isolated sessions, and enforcing role-based permissions.</li>
              <li>Computing real-time pipeline analytics, revenue forecasting, win-rate metrics, and heuristic rule-based operational insights.</li>
              <li>Generating executive CSV and PDF reports on demand within your workspace.</li>
              <li>Preventing unauthorized cross-tenant data access, CSRF exploits, and credential abuse.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-2.5 sm:space-y-3 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-start sm:items-center gap-2 break-words">
              <span className="text-indigo-600 font-mono text-sm shrink-0">3.</span>
              <span>Multi-Tenant Data Isolation & Security Architecture</span>
            </h2>
            <p className="break-words">
              Data confidentiality and multi-tenant isolation are central pillars of FlowDesk AI’s technical architecture:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
              <div className="p-3 sm:p-3.5 rounded-lg sm:rounded-xl border border-slate-100 bg-slate-50 min-w-0">
                <span className="font-semibold text-slate-800 block text-xs uppercase tracking-wider text-emerald-600">Database Tenant Scoping</span>
                <span className="text-xs text-slate-600 mt-1 block break-words">Every database query is strictly scoped by verified PostgreSQL workspace memberships. Request headers cannot bypass membership validation.</span>
              </div>
              <div className="p-3 sm:p-3.5 rounded-lg sm:rounded-xl border border-slate-100 bg-slate-50 min-w-0">
                <span className="font-semibold text-slate-800 block text-xs uppercase tracking-wider text-emerald-600">In-Memory Tokens & Secure Cookies</span>
                <span className="text-xs text-slate-600 mt-1 block break-words">Short-lived JWT access tokens reside only in client memory. Refresh tokens are secured in HTTP-only, Secure cross-site cookies with server-side Origin verification to protect against unauthorized access and CSRF.</span>
              </div>
              <div className="p-3 sm:p-3.5 rounded-lg sm:rounded-xl border border-slate-100 bg-slate-50 min-w-0">
                <span className="font-semibold text-slate-800 block text-xs uppercase tracking-wider text-emerald-600">Password Hashing</span>
                <span className="text-xs text-slate-600 mt-1 block break-words">Passwords are salted and hashed using bcryptjs with 12 computational rounds before storage. Plaintext passwords are never logged or stored.</span>
              </div>
              <div className="p-3 sm:p-3.5 rounded-lg sm:rounded-xl border border-slate-100 bg-slate-50 min-w-0">
                <span className="font-semibold text-slate-800 block text-xs uppercase tracking-wider text-emerald-600">Encrypted Transport</span>
                <span className="text-xs text-slate-600 mt-1 block break-words">All communications between client, reverse proxy, and API servers are strictly transmitted over TLS/HTTPS with HSTS enforcement.</span>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-2.5 sm:space-y-3 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-start sm:items-center gap-2 break-words">
              <span className="text-indigo-600 font-mono text-sm shrink-0">4.</span>
              <span>Third-Party Cloud Infrastructure Providers</span>
            </h2>
            <p className="break-words">
              FlowDesk AI partners with enterprise-grade cloud infrastructure vendors to host and execute the platform:
            </p>
            {/* Responsive Table Wrapper */}
            <div className="w-full overflow-x-auto -mx-1 sm:mx-0 p-1">
              <div className="min-w-[280px] divide-y divide-slate-100 border border-slate-200 rounded-lg sm:rounded-xl overflow-hidden text-xs">
                <div className="p-2.5 sm:p-3 bg-slate-50 font-semibold text-slate-700 flex justify-between gap-2">
                  <span>Infrastructure Provider</span>
                  <span>Operational Role</span>
                </div>
                <div className="p-2.5 sm:p-3 flex justify-between items-start sm:items-center gap-2">
                  <span className="font-medium text-slate-800 shrink-0">Vercel Inc.</span>
                  <span className="text-slate-500 text-right">Global Edge CDN & Frontend Single-Page Application Hosting</span>
                </div>
                <div className="p-2.5 sm:p-3 flex justify-between items-start sm:items-center gap-2">
                  <span className="font-medium text-slate-800 shrink-0">Render Services, Inc.</span>
                  <span className="text-slate-500 text-right">Backend Node.js API Web Service & Reverse Proxy</span>
                </div>
                <div className="p-2.5 sm:p-3 flex justify-between items-start sm:items-center gap-2">
                  <span className="font-medium text-slate-800 shrink-0">Supabase (AWS EU-West)</span>
                  <span className="text-slate-500 text-right">Managed PostgreSQL Relational Database & Connection Pooling</span>
                </div>
              </div>
            </div>
            <p className="pt-1 text-xs text-slate-500 break-words">
              FlowDesk AI does not sell, license, or monetize customer data with third-party advertising networks or data brokers.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-2.5 sm:space-y-3 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-start sm:items-center gap-2 break-words">
              <span className="text-indigo-600 font-mono text-sm shrink-0">5.</span>
              <span>Data Retention & Manual Deletion Requests</span>
            </h2>
            <p className="break-words">
              We retain account credentials and workspace business records for as long as your workspace account remains active.
            </p>
            <p className="break-words">
              Self-service automated account or workspace deletion is not currently implemented in the user interface. Workspace Owners may submit a manual account closure or workspace removal request to platform administration using the contact details below. Upon verification, associated database records are manually removed from the active database.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-2.5 sm:space-y-3 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-start sm:items-center gap-2 break-words">
              <span className="text-indigo-600 font-mono text-sm shrink-0">6.</span>
              <span>Your Data Rights</span>
            </h2>
            <p className="break-words">
              As a user of FlowDesk AI, you have the right to:
            </p>
            <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 text-slate-600 break-words">
              <li><span className="font-semibold text-slate-700">Access and Export:</span> You can download complete CSV and PDF exports of your leads, customers, enquiries, follow-ups, and executive analytics at any time via the Reports interface.</li>
              <li><span className="font-semibold text-slate-700">Correction:</span> You may update user profile details and CRM records directly within the application interface.</li>
              <li><span className="font-semibold text-slate-700">Manual Erasure:</span> You may request manual account and workspace deletion by contacting platform administration.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-2.5 sm:space-y-3 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-start sm:items-center gap-2 break-words">
              <span className="text-indigo-600 font-mono text-sm shrink-0">7.</span>
              <span>Policy Updates</span>
            </h2>
            <p className="break-words">
              We may update this Privacy Policy from time to time to reflect modifications in our software architecture, security mechanisms, or regulatory guidelines. We will notify registered users of material changes via an application notice or email update.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-2.5 sm:space-y-3 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-start sm:items-center gap-2 break-words">
              <span className="text-indigo-600 font-mono text-sm shrink-0">8.</span>
              <span>Privacy & Security Inquiries</span>
            </h2>
            <p className="break-words">
              For questions regarding this policy, data protection inquiries, or manual deletion requests, contact our team:
            </p>
            <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5 break-words">
              <p><span className="font-semibold">Privacy Administration:</span> FlowDesk AI Platform Administration (Unincorporated Project)</p>
              <p><span className="font-semibold">Security & Privacy Email:</span> <em>[Pending Owner Confirmation: e.g. privacy@flowdesk.ai or designated administrator email]</em></p>
              <p><span className="font-semibold">Data Controller / Entity:</span> <em>[Pending Owner Confirmation: To be established upon corporate incorporation]</em></p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-8 sm:mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
          <p>© 2026 FlowDesk AI. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link to="/terms" className="hover:text-indigo-600 transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="font-semibold text-slate-700 hover:text-indigo-600 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/login" className="hover:text-indigo-600 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPage;
