import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FlowDeskLogo } from '../common/FlowDeskLogo';
import { ArrowLeft, FileText, Shield } from 'lucide-react';

interface LegalNavbarProps {
  currentPage?: 'terms' | 'privacy';
}

export const LegalNavbar: React.FC<LegalNavbarProps> = ({ currentPage }) => {
  const location = useLocation();
  const activePage = currentPage || (location.pathname.includes('/privacy') ? 'privacy' : 'terms');

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 backdrop-blur-md bg-white/95">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Identity */}
        <Link
          to="/login"
          className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none focus:ring-2 focus:ring-indigo-500/20 rounded-xl py-1 pr-2 transition-transform active:scale-[0.98] shrink-0"
          title="FlowDesk AI Home"
        >
          <FlowDeskLogo size={36} showAura className="shrink-0 transition-transform group-hover:scale-105" />
          <div className="flex flex-col sm:flex-row sm:items-baseline">
            <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
              FlowDesk <span className="text-indigo-600">AI</span>
            </span>
            <span className="hidden md:inline-block ml-2 text-xs font-medium text-slate-400 border-l border-slate-200 pl-2">
              Legal Center
            </span>
          </div>
        </Link>

        {/* Center / Right: Page Links & Back Action */}
        <div className="flex items-center gap-1.5 sm:gap-4 md:gap-6">
          {/* Policy Links */}
          <nav className="flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-100/70 border border-slate-200/60 rounded-xl text-xs sm:text-sm font-medium">
            <Link
              to="/terms"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg transition-all ${
                activePage === 'terms'
                  ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${activePage === 'terms' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="hidden xs:inline">Terms of Service</span>
              <span className="xs:hidden">Terms</span>
            </Link>

            <Link
              to="/privacy"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg transition-all ${
                activePage === 'privacy'
                  ? 'bg-white text-emerald-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Shield className={`w-3.5 h-3.5 ${activePage === 'privacy' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className="hidden xs:inline">Privacy Policy</span>
              <span className="xs:hidden">Privacy</span>
            </Link>
          </nav>

          {/* Right: Back to Login / Application */}
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-medium rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200/60 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
            <span className="hidden sm:inline">Back to Login</span>
            <span className="sm:hidden">Login</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default LegalNavbar;

