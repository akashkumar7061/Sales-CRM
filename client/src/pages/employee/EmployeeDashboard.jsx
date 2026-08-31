import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge, CompanyBadge, PriorityBadge } from '../../components/common/Badge';
import { CustomerDetailModal } from '../../components/customers/CustomerDetailModal';
import { CustomerFormModal } from '../../components/customers/CustomerFormModal';
import { WhatsAppModal } from '../../components/common/WhatsAppModal';
import { CallLogModal } from '../../components/customers/CallLogModal';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
  Phone,
  PhoneCall,
  MessageSquare,
  ArrowRight,
  Sparkles,
  CalendarDays,
  Target,
  AlertTriangle,
  Flame,
  Award,
  Zap,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(() => {
    try {
      const cached = sessionStorage.getItem('crm_emp_dash_cache');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [targetData, setTargetData] = useState(() => {
    try {
      const cached = sessionStorage.getItem('crm_emp_target_cache');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    return !sessionStorage.getItem('crm_emp_dash_cache');
  });

  // Modals
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customerForCall, setCustomerForCall] = useState(null);
  const [customerForWhatsApp, setCustomerForWhatsApp] = useState(null);

  const fetchStats = async () => {
    try {
      const [resStats, resTarget] = await Promise.all([
        api.get('/analytics/employee'),
        api.get('/targets/my-target'),
      ]);

      if (resStats.data.success) {
        setData(resStats.data);
        sessionStorage.setItem('crm_emp_dash_cache', JSON.stringify(resStats.data));
      }
      if (resTarget.data.success) {
        setTargetData(resTarget.data);
        sessionStorage.setItem('crm_emp_target_cache', JSON.stringify(resTarget.data));
      }
    } catch (error) {
      console.error('Failed to load employee stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const { stats, charts, upcomingFollowups, overdueFollowupList, myRecentCustomers } = data || {};
  const { target, progress } = targetData || {};

  // Calculate Overall Average Score %
  const overallScore = progress
    ? Math.round(
        ((progress.monthlyLeads?.percentage || 0) +
          (progress.monthlyCalls?.percentage || 0) +
          (progress.monthlyConversions?.percentage || 0)) /
          3
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-50 dark:from-indigo-950/80 via-white dark:via-slate-900 to-slate-50 dark:to-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back, {user?.name}!
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {user?.designation || 'Sales Executive'} • Here is your sales quota breakdown, targets, and active lead pipeline
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/employee/reports"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
          >
            <Clock className="h-4 w-4 text-emerald-500" />
            <span>Daily Work Report</span>
          </Link>

          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Customer</span>
          </button>
        </div>
      </div>

      {/* 🎯 Full Sales Targets & Performance Dashboard */}
      {progress && (
        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50/40 dark:from-indigo-950/20 via-white dark:via-slate-900 to-slate-50 dark:to-slate-900/50 p-5 md:p-6 shadow-xs space-y-5">
          {/* Target Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/25">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                    My Sales Targets & Performance Quotas
                  </h2>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                    Month: {target?.month}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Target defined by Admin for your leads generation, phone calling, and deal conversions
                </p>
              </div>
            </div>

            {/* Overall Achievement Badge */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto bg-white dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Overall Target Score
                </span>
                <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                  {overallScore}% Achieved
                </span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-200 dark:border-indigo-500/20">
                {overallScore >= 100 ? '🏆' : overallScore >= 75 ? '🔥' : '⚡'}
              </div>
            </div>
          </div>

          {/* Monthly Target Cards (3 Pillars: Leads, Calls, Conversions) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                <span>Monthly Quota Milestones</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Monthly Leads Target */}
              <div className="rounded-xl border border-blue-200 dark:border-blue-500/30 bg-white dark:bg-slate-950 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      New Leads Target
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                    {progress.monthlyLeads.percentage}%
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {progress.monthlyLeads.achieved}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {' '}/ {progress.monthlyLeads.assigned} leads
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    {progress.monthlyLeads.remaining > 0
                      ? `${progress.monthlyLeads.remaining} remaining`
                      : '✅ Target Reached!'}
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, progress.monthlyLeads.percentage)}%` }}
                  />
                </div>
              </div>

              {/* 2. Monthly Calls Target */}
              <div className="rounded-xl border border-purple-200 dark:border-purple-500/30 bg-white dark:bg-slate-950 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                      <PhoneCall className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Phone Calls Outreach
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400">
                    {progress.monthlyCalls.percentage}%
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {progress.monthlyCalls.achieved}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {' '}/ {progress.monthlyCalls.assigned} calls
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    {progress.monthlyCalls.remaining > 0
                      ? `${progress.monthlyCalls.remaining} remaining`
                      : '✅ Target Reached!'}
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, progress.monthlyCalls.percentage)}%` }}
                  />
                </div>
              </div>

              {/* 3. Monthly Conversions / Deals Won */}
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-slate-950 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Deals Converted (Won)
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    {progress.monthlyConversions.percentage}%
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {progress.monthlyConversions.achieved}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {' '}/ {progress.monthlyConversions.assigned} sales
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    {progress.monthlyConversions.remaining > 0
                      ? `${progress.monthlyConversions.remaining} remaining`
                      : '🏆 Goal Achieved!'}
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, progress.monthlyConversions.percentage)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Today's Daily Target Checklist & Manager Note */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Daily Leads */}
            <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                  Today's Leads Goal
                </span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {progress.dailyLeads.achieved} / {progress.dailyLeads.assigned} Added
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  progress.dailyLeads.achieved >= progress.dailyLeads.assigned
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                }`}
              >
                {progress.dailyLeads.percentage}%
              </span>
            </div>

            {/* Daily Calls */}
            <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                  Today's Calls Goal
                </span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {progress.dailyCalls.achieved} / {progress.dailyCalls.assigned} Dialed
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  progress.dailyCalls.achieved >= progress.dailyCalls.assigned
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                }`}
              >
                {progress.dailyCalls.percentage}%
              </span>
            </div>

            {/* Daily Conversions */}
            <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                  Today's Conversions
                </span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {progress.dailyConversions?.achieved || 0} / {progress.dailyConversions?.assigned || 1} Closed
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  (progress.dailyConversions?.achieved || 0) >= (progress.dailyConversions?.assigned || 1)
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                }`}
              >
                {progress.dailyConversions?.percentage || 0}%
              </span>
            </div>
          </div>

          {/* Manager Strategy Note (if present) */}
          {target?.notes && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 flex items-start gap-2.5">
              <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  Manager Strategy Guidance:
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-400 mt-0.5">
                  {target.notes}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My Total Leads"
          value={stats?.myTotalCustomers || 0}
          subtitle={`+${stats?.myTodayCustomers || 0} added today`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Scheduled for Today"
          value={stats?.myTodayScheduledFollowups || 0}
          subtitle="Follow-up appointments today"
          icon={CalendarDays}
          color="amber"
        />
        <StatCard
          title="Total Calls Recorded"
          value={stats?.myCallsCount || 0}
          subtitle={`+${stats?.myTodayCallsCount || 0} calls logged today`}
          icon={PhoneCall}
          color="purple"
        />
        <StatCard
          title="My Won Deals"
          value={stats?.myCompletedFollowups || 0}
          subtitle={`${stats?.myConversionRate || 0}% conversion rate`}
          icon={CheckCircle2}
          color="green"
        />
      </div>

      {/* Overdue Follow-ups Alarm Section (if any) */}
      {overdueFollowupList && overdueFollowupList.length > 0 && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20 p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-rose-200 dark:border-rose-500/20">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
              <AlertTriangle className="h-4 w-4 animate-bounce" />
              <span>⚠️ Overdue Follow-ups ({overdueFollowupList.length} leads requiring urgent action)</span>
            </div>
            <Link
              to="/employee/customers"
              className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline"
            >
              Filter in Table →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overdueFollowupList.map((c) => (
              <div
                key={c._id}
                className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{c.customerName}</h4>
                    <CompanyBadge company={c.companyName} />
                  </div>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                    Due on {new Date(c.followUpDate).toLocaleDateString()} ({c.followUpTime || '11:00 AM'})
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${c.mobileNumber}`}
                    className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                    title="Call"
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                  <button
                    onClick={() => setCustomerForWhatsApp(c)}
                    className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100"
                    title="WhatsApp"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setCustomerForCall(c)}
                    className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100"
                    title="Log Call"
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Row: Upcoming Follow-ups & Pipeline Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Upcoming Follow-up Action List */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Scheduled Follow-up Reminders
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Upcoming client calls and meetings</p>
            </div>
            <Link
              to="/employee/customers"
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
            >
              All My Leads <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {upcomingFollowups && upcomingFollowups.length > 0 ? (
              upcomingFollowups.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="text-xs font-bold text-slate-900 dark:text-white hover:underline truncate"
                      >
                        {c.customerName}
                      </button>
                      <PriorityBadge priority={c.priority} />
                      <CompanyBadge company={c.companyName} />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {c.productInterested} • {c.location}, {c.city}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">
                        {new Date(c.followUpDate).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-slate-400">{c.followUpTime || '11:00 AM'}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <a
                        href={`tel:${c.mobileNumber}`}
                        className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                        title="Call"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => setCustomerForWhatsApp(c)}
                        className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100"
                        title="WhatsApp"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setCustomerForCall(c)}
                        className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100"
                        title="Log Call"
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No upcoming follow-ups scheduled. Click "Add New Customer" to log a lead.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: My Pipeline Stage Chart */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-xs transition-colors">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
              My Pipeline Stages
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Distribution of your customer leads</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.myStatusDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="status"
                >
                  {(charts?.myStatusDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Customer Detail Profile Modal */}
      <CustomerDetailModal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
        onEdit={(cust) => {
          setSelectedCustomer(null);
          setIsFormOpen(true);
        }}
        onCustomerUpdated={fetchStats}
      />

      {/* Customer Add Modal */}
      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchStats}
      />

      {/* Log Call Modal */}
      <CallLogModal
        isOpen={!!customerForCall}
        onClose={() => setCustomerForCall(null)}
        customer={customerForCall}
        onCallLogged={fetchStats}
      />

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={!!customerForWhatsApp}
        onClose={() => setCustomerForWhatsApp(null)}
        customer={customerForWhatsApp}
      />
    </div>
  );
};
