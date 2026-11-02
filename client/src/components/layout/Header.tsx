import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  Search,
  Bell,
  CheckCircle2,
  ChevronDown,
  User,
  ShieldCheck,
  LogOut,
  Building2,
  Info,
} from 'lucide-react';

interface HeaderProps {
  onMobileMenuOpen: () => void;
}

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Executive Overview',
    subtitle: 'High-level metrics, revenue signals, and recent activity',
  },
  '/leads': {
    title: 'Lead Pipeline',
    subtitle: 'Manage prospect lifecycles, deal values, and source channels',
  },
  '/customers': {
    title: 'Customer Directory',
    subtitle: 'Active accounts, recurring revenue, and contract renewals',
  },
  '/enquiries': {
    title: 'Support & Enquiries',
    subtitle: 'Triage inbound tickets, customer queries, and escalation statuses',
  },
  '/follow-ups': {
    title: 'Follow-ups Schedule',
    subtitle: 'Prioritize upcoming outreach calls, demos, and closing actions',
  },
  '/settings': {
    title: 'Settings & Workspace',
    subtitle: 'Configure team workspace defaults, preferences, and notifications',
  },
};

export const Header: React.FC<HeaderProps> = ({ onMobileMenuOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, currentWorkspace, logout } = useAuth();

  const currentPath = location.pathname;
  const currentMeta = pageTitles[currentPath] || {
    title: 'FlowDesk AI',
    subtitle: 'SaaS Business Operations Management',
  };

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSignOut = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'FD';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      {/* Left title & mobile button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuOpen}
          aria-label="Open mobile navigation menu"
          className="p-2 -ml-2 text-slate-500 rounded-lg hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
              {currentMeta.title}
            </h1>
            {currentWorkspace && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded-full">
                <Building2 className="w-3 h-3" /> {currentWorkspace.name}
              </span>
            )}
          </div>
          <span className="hidden md:block text-xs text-slate-400">
            {currentMeta.subtitle}
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search bar */}
        <div className="relative hidden md:block w-52 lg:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Quick search... (Cmd+K)"
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-slate-700 placeholder-slate-400"
          />
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 text-slate-500 rounded-xl hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="fixed inset-x-3 top-16 sm:inset-x-auto sm:right-0 sm:absolute sm:top-auto sm:mt-2 w-auto sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-slate-200 z-40 p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-sm font-semibold text-slate-900">Notifications</span>
                  <span className="text-[11px] text-indigo-600 font-medium cursor-pointer hover:underline">
                    Mark all read
                  </span>
                </div>
                <div className="py-2 space-y-3 max-h-[70vh] overflow-y-auto">
                  <div className="flex items-start gap-3 p-2 rounded-xl bg-slate-50">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Proposal accepted</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Nexus Health Tech signed Enterprise contract ($52,000).</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">3 hours ago</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <Info className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Workspace connected</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">PostgreSQL authenticated session verified.</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">Just now</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-white"
                onError={(e) => {
                  // Fallback to initials if broken image
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-semibold text-xs flex items-center justify-center ring-2 ring-white">
                {initials}
              </div>
            )}
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.name || 'Workspace User'}
              </span>
              <span className="text-[10px] text-slate-400 leading-tight">
                {currentWorkspace?.role || 'Owner'} • {currentWorkspace?.name || 'FlowDesk'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-40 p-2">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-800">{user?.name || 'User Profile'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email || 'user@flowdesk.ai'}</p>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Account Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    Security & RBAC
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
