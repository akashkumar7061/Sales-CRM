import React from 'react';

export const StatusBadge = ({ status }) => {
  const getStatusConfig = (st) => {
    switch (st) {
      case 'Converted':
      case 'Won / Converted':
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-500/15',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-300 dark:border-emerald-500/30',
          dot: 'bg-emerald-500 dark:bg-emerald-400',
        };
      case 'Lost':
      case 'Lost / Dropped':
        return {
          bg: 'bg-rose-100 dark:bg-rose-500/15',
          text: 'text-rose-700 dark:text-rose-300',
          border: 'border-rose-300 dark:border-rose-500/30',
          dot: 'bg-rose-500 dark:bg-rose-400',
        };
      case 'Not Interested':
        return {
          bg: 'bg-slate-200 dark:bg-slate-700/40',
          text: 'text-slate-700 dark:text-slate-300',
          border: 'border-slate-300 dark:border-slate-600/30',
          dot: 'bg-slate-400',
        };
      case 'Interested':
      case 'Quotation Sent':
        return {
          bg: 'bg-purple-100 dark:bg-purple-500/15',
          text: 'text-purple-700 dark:text-purple-300',
          border: 'border-purple-300 dark:border-purple-500/30',
          dot: 'bg-purple-500 dark:bg-purple-400',
        };
      case 'Follow-up':
      case 'In Discussion':
      case 'Follow-up Scheduled':
        return {
          bg: 'bg-amber-100 dark:bg-amber-500/15',
          text: 'text-amber-700 dark:text-amber-300',
          border: 'border-amber-300 dark:border-amber-500/30',
          dot: 'bg-amber-500 dark:bg-amber-400',
        };
      case 'Contacted':
        return {
          bg: 'bg-cyan-100 dark:bg-cyan-500/15',
          text: 'text-cyan-700 dark:text-cyan-300',
          border: 'border-cyan-300 dark:border-cyan-500/30',
          dot: 'bg-cyan-500 dark:bg-cyan-400',
        };
      case 'New Lead':
      case 'New':
      default:
        return {
          bg: 'bg-indigo-100 dark:bg-indigo-500/15',
          text: 'text-indigo-700 dark:text-indigo-300',
          border: 'border-indigo-300 dark:border-indigo-500/30',
          dot: 'bg-indigo-500 dark:bg-indigo-400',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} whitespace-nowrap shadow-xs`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      {status || 'New Lead'}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  switch (priority) {
    case 'Hot':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 shadow-xs">
          🔥 Hot
        </span>
      );
    case 'Cold':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30 shadow-xs">
          ❄️ Cold
        </span>
      );
    case 'Warm':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 shadow-xs">
          ⚡ Warm
        </span>
      );
  }
};

export const UserStatusBadge = ({ status }) => {
  const map = {
    approved: {
      label: 'Approved',
      className: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',
    },
    pending: {
      label: 'Pending Approval',
      className: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30',
    },
    rejected: {
      label: 'Rejected',
      className: 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/30',
    },
    inactive: {
      label: 'Inactive',
      className: 'bg-slate-200 dark:bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-500/30',
    },
  };

  const item = map[status] || map.pending;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.className}`}
    >
      {item.label}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30">
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30">
      Sales Rep
    </span>
  );
};

export const CompanyBadge = ({ company }) => {
  if (company === 'CleanCruisers') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30">
        🚗 CleanCruisers
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
      🛋️ SofaShine
    </span>
  );
};
