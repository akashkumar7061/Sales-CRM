import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  Bell,
  X,
  CheckCheck,
  AlertTriangle,
  Calendar,
  UserCheck,
  Target,
  PhoneCall,
  Info,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const NotificationDrawer = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [alerts, setAlerts] = useState({ overdueFollowups: 0, dueTodayFollowups: 0 });
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setAlerts(res.data.alerts || { overdueFollowups: 0, dueTodayFollowups: 0 });
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      toast.error('Failed to update notification.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error('Failed to mark all as read.');
    }
  };

  if (!isOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-rose-500" />;
      case 'followup':
        return <Calendar className="h-4 w-4 text-amber-500" />;
      case 'target':
        return <Target className="h-4 w-4 text-indigo-500" />;
      case 'approval':
        return <UserCheck className="h-4 w-4 text-emerald-500" />;
      case 'call_logged':
        return <PhoneCall className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 transition-transform">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Notifications & Alerts</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Follow-up reminders & CRM updates</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              title="Mark all as read"
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Alert Banner Counters */}
        <div className="p-4 space-y-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
          {alerts.overdueFollowups > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500 animate-bounce" />
                <span className="text-xs font-bold">{alerts.overdueFollowups} Overdue Follow-ups!</span>
              </div>
              <span className="text-[10px] font-semibold uppercase bg-rose-200/60 dark:bg-rose-500/20 px-2 py-0.5 rounded-md">
                Immediate Action
              </span>
            </div>
          )}

          {alerts.dueTodayFollowups > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-bold">{alerts.dueTodayFollowups} Scheduled for Today</span>
              </div>
              <span className="text-[10px] font-semibold uppercase bg-amber-200/60 dark:bg-amber-500/20 px-2 py-0.5 rounded-md">
                Due Today
              </span>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
                <Bell className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">All caught up!</p>
              <p className="text-xs text-slate-400 mt-0.5">No unread notifications at the moment.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => !n.isRead && handleMarkAsRead(n._id)}
                className={`flex gap-3 rounded-xl p-3.5 border transition-all cursor-pointer ${
                  n.isRead
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-75'
                    : 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-500/30 shadow-xs'
                }`}
              >
                <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{n.title}</p>
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                    {new Date(n.createdAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
