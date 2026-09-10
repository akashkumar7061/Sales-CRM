import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  History,
  FileSpreadsheet,
  Target,
  Clock,
  DownloadCloud,
  LogOut,
  Building2,
  TrendingUp,
  FileText,
  Mic,
  Wallet,
} from 'lucide-react';

export const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const { user, isAdmin, logout } = useAuth();

  const adminNavItems = [
    {
      name: 'Admin Dashboard',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'All Customers',
      path: '/admin/customers',
      icon: Users,
    },
    {
      name: 'Employee Management',
      path: '/admin/employees',
      icon: UserCheck,
    },
    {
      name: 'Daily Cash Collection',
      path: '/admin/cash-collections',
      icon: Wallet,
    },
    {
      name: 'Call Recordings Hub',
      path: '/admin/recordings',
      icon: Mic,
    },
    {
      name: 'Sales Targets',
      path: '/admin/targets',
      icon: Target,
    },
    {
      name: 'Daily Work Reports',
      path: '/admin/reports',
      icon: Clock,
    },
    {
      name: 'Data Backup & Export',
      path: '/admin/export-center',
      icon: DownloadCloud,
    },
    {
      name: 'Audit Activity Logs',
      path: '/admin/logs',
      icon: History,
    },
  ];

  const employeeNavItems = [
    {
      name: 'Customer List',
      path: '/employee/customers',
      icon: Users,
    },
    {
      name: 'My Dashboard',
      path: '/employee/dashboard',
      icon: TrendingUp,
    },
    {
      name: 'Call Recordings',
      path: '/employee/recordings',
      icon: Mic,
    },
    {
      name: 'Daily Work Report',
      path: '/employee/reports',
      icon: Clock,
    },
    {
      name: 'My Activity Logs',
      path: '/employee/logs',
      icon: History,
    },
  ];

  const navItems = isAdmin ? adminNavItems : employeeNavItems;

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo / Brand Header */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-950">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 shadow-md shadow-indigo-500/20">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">SalesPulse CRM</h1>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Customer System
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {isAdmin ? 'Administration' : 'Sales Operations'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-500/30 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.name}
              </NavLink>
            );
          })}
        </div>

        {/* Fixed Footer: User Info & Logout Button */}
        <div className="mt-auto shrink-0 border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50/80 dark:bg-slate-950/90 backdrop-blur-xs">
          {/* User Profile Card */}
          <div className="rounded-xl bg-white dark:bg-slate-900/90 p-3 border border-slate-200 dark:border-slate-800/90 shadow-xs mb-2.5">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-white text-xs shadow-xs"
                style={{ backgroundColor: user?.avatarColor || '#4f46e5' }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.name || 'System Administrator'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.email || 'admin@crm.com'}
                </p>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
              <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role:</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/20 uppercase">
                {user?.role || 'admin'}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-950/20 px-3 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all shadow-xs active:scale-[0.98]"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
