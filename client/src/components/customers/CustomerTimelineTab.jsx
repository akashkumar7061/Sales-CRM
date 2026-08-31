import React from 'react';
import {
  Clock,
  PlusCircle,
  PhoneCall,
  FileText,
  UserCheck,
  RefreshCw,
  Tag,
  ArrowRight,
} from 'lucide-react';

export const CustomerTimelineTab = ({ customer }) => {
  const timeline = customer?.timeline || [];

  if (timeline.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center text-center p-6">
        <Clock className="h-8 w-8 text-slate-400 mb-2" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No timeline events yet</p>
        <p className="text-xs text-slate-400 mt-0.5">
          Actions, status updates, and call notes will appear here chronologically.
        </p>
      </div>
    );
  }

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATED':
      case 'IMPORTED':
        return <PlusCircle className="h-4 w-4 text-emerald-500" />;
      case 'CALL_LOGGED':
        return <PhoneCall className="h-4 w-4 text-blue-500" />;
      case 'DOC_UPLOADED':
      case 'DOC_DELETED':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'STATUS_CHANGE':
        return <Tag className="h-4 w-4 text-amber-500" />;
      case 'REASSIGNED':
        return <UserCheck className="h-4 w-4 text-indigo-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-slate-400" />;
    }
  };

  // Sort descending by timestamp
  const sorted = [...timeline].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="py-2 space-y-4">
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {sorted.map((item, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline node icon */}
            <div className="absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 group-hover:border-indigo-500 transition-colors shadow-xs">
              {getActionIcon(item.action)}
            </div>

            {/* Content box */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-3.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {item.action?.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {new Date(item.timestamp).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {item.description}
              </p>

              {item.performerName && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                  <span>By:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{item.performerName}</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
