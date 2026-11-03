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
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        {/* Left: Brand Identity */}
        <Link
          to="/login"
          className="flex items-center gap-1.5 sm:gap-3 group focus:outline-none focus:ring-2 focus:ring-indigo-500/20 rounded-xl py-1 pr-1 sm:pr-2 transition-transform active:scale-[0.98] shrink-0 min-w-0"
          title="FlowDesk AI Home"
        >
          {/* Logo with responsive sizing */}
          <div className="w-7 h-7 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center">
            <FlowDeskLogo size="100%" showAura className="w-full h-full transition-transform group-hover:scale-105" />
          </div>

          <div className="flex items-baseline min-w-0">
            <span className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight leading-none whitespace-nowrap">
              FlowDesk <span className="text-indigo-600">AI</span>
            </span>
            <span className="hidden md:inline-block ml-2 text-xs font-medium text-slate-400 border-l border-slate-200 pl-2 whitespace-nowrap">
              Legal Center
            </span>
          </div>
        </Link>

        {/* Center / Right: Policy Switcher & Login Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4 shrink-0">
          {/* Policy Segmented Control */}
          <nav className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-slate-100/80 border border-slate-200/70 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium">
            <Link
              to="/terms"
              className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg transition-all ${
                activePage === 'terms'
                  ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              title="Terms of Service"
            >
              <FileText className={`w-3.5 h-3.5 shrink-0 ${activePage === 'terms' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Terms of Service</span>
              <span className="sm:hidden text-[11px] font-semibold">Terms</span>
            </Link>

            <Link
              to="/privacy"
              className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg transition-all ${
                activePage === 'privacy'
                  ? 'bg-white text-emerald-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              title="Privacy Policy"
            >
              <Shield className={`w-3.5 h-3.5 shrink-0 ${activePage === 'privacy' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Privacy Policy</span>
              <span className="sm:hidden text-[11px] font-semibold">Privacy</span>
            </Link>
          </nav>

          {/* Right: Back to Login Button */}
          <Link
            to="/login"
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200/60 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            title="Back to Sign In"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 shrink-0" />
            <span className="hidden md:inline">Back to Login</span>
            <span className="md:hidden text-[11px]">Login</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default LegalNavbar;
