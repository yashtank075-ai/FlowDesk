import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
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
  CalendarCheck,
  HelpCircle,
  Users,
  Check,
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';
import { GlobalSearch } from '../common/GlobalSearch';

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
  '/insights': {
    title: 'AI Business Insights',
    subtitle: 'Pipeline intelligence, high-potential scoring, and actionable recommendations',
  },
  '/export': {
    title: 'Export Reports',
    subtitle: 'Download spreadsheet CSVs and branded executive PDF summaries',
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
  const { notifications, unreadCount, markAsRead, markAllAsRead, isMarkingAll } = useNotifications();

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
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onMobileMenuOpen}
          aria-label="Open mobile navigation menu"
          className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 text-slate-500 rounded-lg hover:bg-slate-100 lg:hidden shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <h1 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 tracking-tight truncate">
              {currentMeta.title}
            </h1>
            {currentWorkspace && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded-full shrink-0">
                <Building2 className="w-3 h-3" /> {currentWorkspace.name}
              </span>
            )}
          </div>
          <span className="hidden md:block text-xs text-slate-400 truncate">
            {currentMeta.subtitle}
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search Component */}
        <GlobalSearch className="hidden sm:block" />

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 text-slate-500 rounded-xl hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-indigo-600 rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="fixed inset-x-3 top-16 sm:inset-x-auto sm:right-0 sm:absolute sm:top-auto sm:mt-2 w-auto sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-slate-200 z-40 p-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-indigo-50 text-indigo-700 font-semibold rounded-full border border-indigo-200/60">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      disabled={isMarkingAll}
                      onClick={() => markAllAsRead()}
                      className="text-[11px] text-indigo-600 font-medium hover:underline disabled:opacity-50"
                    >
                      {isMarkingAll ? 'Marking...' : 'Mark all read'}
                    </button>
                  )}
                </div>

                <div className="py-2 space-y-2 max-h-[65vh] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const getIcon = () => {
                        switch (n.type) {
                          case 'LEAD_CREATED':
                            return <Users className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />;
                          case 'CUSTOMER_CREATED':
                            return <Building2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />;
                          case 'ENQUIRY_CREATED':
                            return <HelpCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />;
                          case 'FOLLOWUP_SCHEDULED':
                            return <CalendarCheck className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />;
                          default:
                            return <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />;
                        }
                      };

                      return (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.read) markAsRead(n.id);
                            if (n.link) {
                              setNotificationsOpen(false);
                              navigate(n.link);
                            }
                          }}
                          className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                            n.read ? 'hover:bg-slate-50 opacity-75' : 'bg-indigo-50/40 border border-indigo-100/60 hover:bg-indigo-50/70'
                          }`}
                        >
                          {getIcon()}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-xs ${n.read ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'} truncate`}>
                                {n.title}
                              </p>
                              {!n.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {formatRelativeTime(n.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
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
