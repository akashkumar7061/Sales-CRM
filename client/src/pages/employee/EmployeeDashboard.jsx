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
  FileText,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [targetData, setTargetData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customerForCall, setCustomerForCall] = useState(null);
  const [customerForWhatsApp, setCustomerForWhatsApp] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [resStats, resTarget] = await Promise.all([
        api.get('/analytics/employee'),
        api.get('/targets/my-target'),
      ]);

      if (resStats.data.success) {
        setData(resStats.data);
      }
      if (resTarget.data.success) {
        setTargetData(resTarget.data);
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
            {user?.designation} • Here is your sales targets, follow-up alarms, and lead pipeline
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

      {/* Target Progress Banner */}
      {progress && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  Monthly Target Quotas ({target?.month})
                </h3>
                <p className="text-[11px] text-slate-400">Track your assigned vs achieved sales milestones</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Monthly Leads */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-500">Monthly Leads</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {progress.monthlyLeads.achieved} / {progress.monthlyLeads.assigned}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{ width: `${progress.monthlyLeads.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{progress.monthlyLeads.percentage}% Done</span>
                <span>{progress.monthlyLeads.remaining} Remaining</span>
              </div>
            </div>

            {/* Monthly Conversions */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-500">Deals Won</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {progress.monthlyConversions.achieved} / {progress.monthlyConversions.assigned}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${progress.monthlyConversions.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{progress.monthlyConversions.percentage}% Done</span>
                <span>{progress.monthlyConversions.remaining} Remaining</span>
              </div>
            </div>

            {/* Daily Leads */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-500">Today's Leads</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {progress.dailyLeads.achieved} / {progress.dailyLeads.assigned}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${progress.dailyLeads.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{progress.dailyLeads.percentage}% Done</span>
                <span>{progress.dailyLeads.remaining} to Goal</span>
              </div>
            </div>

            {/* Daily Calls */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-500">Today's Calls</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {progress.dailyCalls.achieved} / {progress.dailyCalls.assigned}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${progress.dailyCalls.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{progress.dailyCalls.percentage}% Done</span>
                <span>{progress.dailyCalls.remaining} to Goal</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats */}
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
