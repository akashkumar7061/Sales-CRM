import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => {
  const colorMap = {
    blue: 'from-blue-500/10 to-indigo-500/5 text-blue-400 border-blue-500/20',
    green: 'from-emerald-500/10 to-teal-500/5 text-emerald-400 border-emerald-500/20',
    purple: 'from-purple-500/10 to-pink-500/5 text-purple-400 border-purple-500/20',
    amber: 'from-amber-500/10 to-orange-500/5 text-amber-400 border-amber-500/20',
    rose: 'from-rose-500/10 to-red-500/5 text-rose-400 border-rose-500/20',
    cyan: 'from-cyan-500/10 to-blue-500/5 text-cyan-400 border-cyan-500/20',
  };

  const iconBgMap = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-emerald-500/20 text-emerald-400',
    purple: 'bg-purple-500/20 text-purple-400',
    amber: 'bg-amber-500/20 text-amber-400',
    rose: 'bg-rose-500/20 text-rose-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
        colorMap[color] || colorMap.blue
      } bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${iconBgMap[color] || iconBgMap.blue}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 mr-1.5">{trend}</span> vs previous period
        </div>
      )}
    </div>
  );
};
