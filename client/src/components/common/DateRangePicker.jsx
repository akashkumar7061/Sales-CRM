import React from 'react';
import { Calendar, X, Clock, Sparkles } from 'lucide-react';

export const DateRangePicker = ({
  startDate,
  endDate,
  onDateChange,
  label = 'Date Filter',
  showPresets = true,
  className = '',
}) => {
  // Preset helper
  const handlePreset = (preset) => {
    const today = new Date();
    let start = '';
    let end = '';

    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    switch (preset) {
      case 'today': {
        const todayStr = formatDate(today);
        start = todayStr;
        end = todayStr;
        break;
      }
      case 'yesterday': {
        const yest = new Date(today);
        yest.setDate(yest.getDate() - 1);
        const yestStr = formatDate(yest);
        start = yestStr;
        end = yestStr;
        break;
      }
      case 'last7': {
        const prev7 = new Date(today);
        prev7.setDate(prev7.getDate() - 6);
        start = formatDate(prev7);
        end = formatDate(today);
        break;
      }
      case 'thisMonth': {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        start = formatDate(firstDay);
        end = formatDate(today);
        break;
      }
      case 'last30': {
        const prev30 = new Date(today);
        prev30.setDate(prev30.getDate() - 29);
        start = formatDate(prev30);
        end = formatDate(today);
        break;
      }
      case 'all':
      default:
        start = '';
        end = '';
        break;
    }

    onDateChange(start, end);
  };

  const isPresetActive = (preset) => {
    const today = new Date();
    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayStr = formatDate(today);

    if (preset === 'all') return !startDate && !endDate;
    if (preset === 'today') return startDate === todayStr && endDate === todayStr;
    if (preset === 'yesterday') {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      const yestStr = formatDate(yest);
      return startDate === yestStr && endDate === yestStr;
    }
    if (preset === 'thisMonth') {
      const firstDayStr = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
      return startDate === firstDayStr && endDate === todayStr;
    }
    return false;
  };

  return (
    <div className={`flex flex-wrap items-center gap-2.5 text-xs ${className}`}>
      {/* Preset Pills */}
      {showPresets && (
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => handlePreset('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              isPresetActive('all')
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Time
          </button>
          <button
            type="button"
            onClick={() => handlePreset('today')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              isPresetActive('today')
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handlePreset('yesterday')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              isPresetActive('yesterday')
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Yesterday
          </button>
          <button
            type="button"
            onClick={() => handlePreset('last7')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => handlePreset('thisMonth')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              isPresetActive('thisMonth')
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            This Month
          </button>
        </div>
      )}

      {/* Date Pickers (Start Date & End Date) */}
      <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
        
        <div className="flex items-center gap-1 text-[11px]">
          <input
            type="date"
            title="Start Date"
            value={startDate || ''}
            onChange={(e) => onDateChange(e.target.value, endDate)}
            className="bg-transparent text-slate-900 dark:text-white focus:outline-none w-[110px]"
          />
          <span className="text-slate-400 font-bold">→</span>
          <input
            type="date"
            title="End Date"
            value={endDate || ''}
            onChange={(e) => onDateChange(startDate, e.target.value)}
            className="bg-transparent text-slate-900 dark:text-white focus:outline-none w-[110px]"
          />
        </div>

        {(startDate || endDate) && (
          <button
            type="button"
            onClick={() => onDateChange('', '')}
            title="Clear Date Range"
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
