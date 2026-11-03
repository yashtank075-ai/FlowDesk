import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-100">
              F
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight">FlowDesk AI</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-400 border-l border-slate-200 pl-2">
                Terms of Service
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link
              to="/privacy"
              className="text-slate-600 hover:text-indigo-600 transition-colors hidden sm:block"
            >
              Privacy Policy
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Register</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Document Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm mb-8">
          <div className="flex items-center gap-3 text-indigo-600 mb-3">
            <FileText className="w-6 h-6" />
            <span className="text-xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
              Legal Documentation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Last Updated: November 3, 2026 • Version 1.0 (Public Beta)
          </p>
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
            <span className="font-semibold">Notice for Public Beta Users:</span> FlowDesk AI is currently provided under Public Beta evaluation terms. Formal legal entity designation, registered operating address, and jurisdiction details are marked below for platform owner confirmation before commercial launch.
          </div>
        </div>

        {/* Terms Sections */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-10 text-sm leading-relaxed text-slate-600">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-indigo-600 font-mono text-sm">1.</span> Introduction and Acceptance of Terms
            </h2>
            <p>
              Welcome to FlowDesk AI ("the Service", "the Application", "we", "us"). By registering for an account, accessing, or using FlowDesk AI, you ("User", "Subscriber", "Customer") agree to be bound by these Terms of Service. If you do not agree to all terms and conditions stated herein, you must immediately refrain from creating an account or using the Application.
            </p>
            <p>
              If you access or use FlowDesk AI on behalf of a company, organization, or other entity, you represent and warrant that you have authority to bind that entity to these Terms.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-indigo-600 font-mono text-sm">2.</span> Account Registration and Responsibilities
            </h2>
            <p>
              To access FlowDesk AI, you must register for an account by providing accurate, current, and complete information, including a valid email address and account credentials.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>You are solely responsible for maintaining the confidentiality of your login credentials.</li>
              <li>You must immediately notify the platform operator of any suspected unauthorized access or compromise of your account.</li>
              <li>You agree not to share account credentials across multiple individuals; each authorized user within a workspace must maintain their own distinct account.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-indigo-600 font-mono text-sm">3.</span> Workspace Ownership and Membership Hierarchy
            </h2>
            <p>
              FlowDesk AI operates on a multi-tenant workspace architecture. Each workspace is governed by a defined Role-Based Access Control (RBAC) structure:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                <span className="font-semibold text-slate-800 block text-xs uppercase tracking-wider text-indigo-600">Owner</span>
                <span className="text-xs text-slate-600 mt-1 block">Full administrative ownership, member role assignment, and workspace configuration control.</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                <span className="font-semibold text-slate-800 block text-xs uppercase tracking-wider text-indigo-600">Admin</span>
                <span className="text-xs text-slate-600 mt-1 block">Team member invitations, operational oversight, and complete CRM data management.</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                <span className="font-semibold text-slate-800 block text-xs uppercase tracking-wider text-indigo-600">Manager & Member</span>
                <span className="text-xs text-slate-600 mt-1 block">Create, update, and manage leads, customer pipelines, follow-ups, and support enquiries.</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                <span className="font-semibold text-slate-800 block text-xs uppercase tracking-wider text-indigo-600">Viewer</span>
                <span className="text-xs text-slate-600 mt-1 block">Read-only visibility across workspace data without modification or deletion permissions.</span>
              </div>
            </div>
            <p className="pt-2">
              The Workspace Owner is the ultimate custodian of all records, data, and configurations housed within the respective workspace.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-indigo-600 font-mono text-sm">4.</span> Acceptable and Prohibited Use
            </h2>
            <p>
              You agree to use FlowDesk AI exclusively for lawful business operations. You expressly agree not to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Violate any local, national, or international law, regulation, or privacy mandate.</li>
              <li>Upload, transmit, or store malicious code, viruses, automated crawlers, or destructive payloads.</li>
              <li>Attempt to circumvent, probe, reverse engineer, or defeat tenant data isolation, authorization checks, or API rate limitations.</li>
              <li>Impersonate any person or entity or misrepresent affiliation with an organization.</li>
              <li>Harvest or collect personal identifying information (PII) of third parties without verifiable consent.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-indigo-600 font-mono text-sm">5.</span> User-Submitted Business Data & Intellectual Property
            </h2>
            <p>
              You retain all ownership, title, and intellectual property rights in and to all business data, customer contacts, sales pipelines, notes, and records you submit to FlowDesk AI ("Customer Data").
            </p>
            <p>
              You grant FlowDesk AI a limited, non-exclusive license to process, store, and display your Customer Data strictly to the extent necessary to provide, maintain, and support the Service. FlowDesk AI does not sell or rent Customer Data to third-party marketing services.
            </p>
            <p>
              FlowDesk AI, including all software interfaces, visual designs, database schemas, code, algorithms, and brand assets, remains the exclusive property of the FlowDesk AI operators and contributors.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-indigo-600 font-mono text-sm">6.</span> Account Suspension and Manual Deletion
            </h2>
            <p>
              We reserve the right to suspend account access with prior reasonable notice if you breach these Terms of Service. In cases of malicious security activity, API abuse, or severe statutory violations, suspension may take effect immediately without prior notification.
            </p>
            <p>
              Self-service automated account/workspace deletion is not currently implemented in the user interface. Workspace Owners may submit a manual account closure or workspace removal request to platform administration using the contact details below.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-indigo-600 font-mono text-sm">7.</span> Service Availability & Limitations
            </h2>
            <p>
              FlowDesk AI is delivered on a cloud infrastructure model. While we make reasonable commercial efforts to maintain continuous system availability, the Service is provided on an <span className="font-semibold text-slate-800">"AS IS"</span> and <span className="font-semibold text-slate-800">"AS AVAILABLE"</span> basis.
            </p>
            <p>
              We do not guarantee uninterrupted, bug-free, or zero-downtime operation, particularly during planned maintenance windows, emergency security patching, or third-party infrastructure outages.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-indigo-600 font-mono text-sm">8.</span> Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, in no event shall FlowDesk AI, its operators, affiliates, or infrastructure providers be liable for any indirect, incidental, consequential, special, or punitive damages—including loss of profits, loss of sales revenue, business interruption, or loss of data—arising out of or in connection with the use or inability to use the Service.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-indigo-600 font-mono text-sm">9.</span> Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms and any dispute or claim arising out of or in connection with them shall be governed by and construed in accordance with the laws of the platform operator's primary jurisdiction, excluding conflict of law principles.
            </p>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-xs text-slate-600">
              <span className="font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                [Owner Confirmation Required]:
              </span>
              Jurisdiction / Applicable State & Country: <em>[To be confirmed by Platform Owner upon legal entity registration]</em>.
            </div>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-indigo-600 font-mono text-sm">10.</span> Contact Information
            </h2>
            <p>
              For legal inquiries, terms clarification, or notices, contact the FlowDesk AI administrative team:
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <p><span className="font-semibold">Platform Operator:</span> FlowDesk AI Platform Administration (Unincorporated Project)</p>
              <p><span className="font-semibold">Support Email:</span> <em>[Pending Owner Confirmation: e.g. support@flowdesk.ai or designated administrator email]</em></p>
              <p><span className="font-semibold">Legal Inquiries:</span> <em>[Pending Owner Confirmation: e.g. legal@flowdesk.ai]</em></p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 FlowDesk AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="font-semibold text-slate-700 hover:text-indigo-600">
              Terms of Service
            </Link>
            <Link to="/privacy" className="hover:text-indigo-600">
              Privacy Policy
            </Link>
            <Link to="/login" className="hover:text-indigo-600">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsPage;
