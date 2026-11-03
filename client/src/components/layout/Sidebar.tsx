import React from 'react';
import { NavLink } from 'react-router';
import {
  LayoutDashboard,
  Users,
  Building2,
  HelpCircle,
  CalendarCheck,
  FileDown,
  Settings,
  ChevronLeft,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { FlowDeskLogo } from '../common/FlowDeskLogo';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', path: '/leads', icon: Users },
  { name: 'Customers', path: '/customers', icon: Building2 },
  { name: 'Enquiries', path: '/enquiries', icon: HelpCircle },
  { name: 'Follow-ups', path: '/follow-ups', icon: CalendarCheck },
  { name: 'Export Reports', path: '/export', icon: FileDown },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}) => {
  const { currentWorkspace } = useAuth();
  // Prevent background scrolling when mobile sidebar is open, preserving initial overflow
  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Brand Header */}
        <div
          className={`flex items-center h-16 border-b border-slate-100 transition-all ${
            collapsed ? 'justify-center px-2' : 'justify-between px-4'
          }`}
        >
          {collapsed ? (
            /* Collapsed view: Clicking the centered logo cleanly expands the large sidebar */
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="flex items-center justify-center p-1.5 rounded-xl hover:bg-slate-100 active:scale-95 transition-all focus:outline-hidden"
            >
              <FlowDeskLogo size={36} showAura className="shrink-0" />
            </button>
          ) : (
            /* Expanded view: Logo + Brand Title + Collapse button */
            <>
              <div className="flex items-center gap-3 overflow-hidden">
                <FlowDeskLogo size={36} showAura className="shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 tracking-tight text-base leading-tight">
                    FlowDesk<span className="text-blue-600 ml-0.5">AI</span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
                className="hidden lg:flex items-center justify-center w-7 h-7 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation list */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  } ${collapsed ? 'justify-center px-0' : ''}`
                }
                title={collapsed ? item.name : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-colors`} />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Workspace Status */}
        <div className="p-3 border-t border-slate-100">
          <div
            className={`flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100 ${
              collapsed ? 'justify-center p-2' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
              {currentWorkspace?.name ? currentWorkspace.name.slice(0, 2).toUpperCase() : 'FD'}
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-800 truncate" title={currentWorkspace?.name || 'Workspace'}>
                  {currentWorkspace?.name || 'Workspace'}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  PostgreSQL Live
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
