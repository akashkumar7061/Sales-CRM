import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge, CompanyBadge, PriorityBadge } from '../../components/common/Badge';
import { CustomerDetailModal } from '../../components/customers/CustomerDetailModal';
import { CustomerFormModal } from '../../components/customers/CustomerFormModal';
import { ImportModal } from '../../components/import/ImportModal';
import { ChangePasswordModal } from '../../components/common/ChangePasswordModal';
import { AddEmployeeModal } from '../../components/employees/AddEmployeeModal';
import {
  Users,
  UserCheck,
  UserPlus,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  MapPin,
  FileSpreadsheet,
  Plus,
  ArrowRight,
  Shield,
  Briefcase,
  Layers,
  PhoneCall,
  AlertTriangle,
  Flame,
  Target,
  KeyRound,
  Mic,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { Link } from 'react-router-dom';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#06b6d4', '#ef4444'];
const PRIORITY_COLORS = { Hot: '#ef4444', Warm: '#f59e0b', Cold: '#3b82f6' };

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(() => {
    try {
      const cached = sessionStorage.getItem('crm_admin_dash_cache');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    return !sessionStorage.getItem('crm_admin_dash_cache');
  });

  // Modals
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('/analytics/admin');
      if (res.data.success) {
        setData(res.data);
        sessionStorage.setItem('crm_admin_dash_cache', JSON.stringify(res.data));
      }
    } catch (error) {
      console.error('Failed to load admin stats:', error);
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

  const { stats, charts, recentCustomers } = data || {};

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-50 dark:from-indigo-950/80 via-white dark:via-slate-900 to-slate-50 dark:to-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Executive Sales Command Center
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Real-time business intelligence, sales quotas, team performance, and customer pipeline
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add Employee Direct Shortcut */}
          <button
            type="button"
            onClick={() => setIsAddEmployeeOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-950/40 px-3.5 py-2 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition-colors shadow-xs"
            title="Create New Employee Account"
          >
            <UserPlus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span>+ Add Employee</span>
          </button>

          <Link
            to="/admin/employees"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Team List</span>
          </Link>

          <Link
            to="/admin/recordings"
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors shadow-xs"
          >
            <Mic className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Call Recordings</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
            title="Change Admin Password"
          >
            <KeyRound className="h-3.5 w-3.5 text-indigo-500" />
            <span>Change Password</span>
          </button>

          <Link
            to="/admin/targets"
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors shadow-xs"
          >
            <Target className="h-3.5 w-3.5" />
            <span>Sales Targets</span>
          </Link>

          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Overdue Follow-up Alert Banner (if any) */}
      {stats?.overdueFollowups > 0 && (
        <div className="flex items-center justify-between rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 p-4 text-rose-800 dark:text-rose-200">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500 text-white shadow-md shadow-rose-500/20">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold">
                ⚠️ {stats.overdueFollowups} Customer Follow-ups are Currently Overdue!
              </h4>
              <p className="text-[11px] text-rose-600 dark:text-rose-400">
                Sales reps need to re-engage with these pending leads immediately to avoid dropped deals.
              </p>
            </div>
          </div>
          <Link
            to="/admin/customers"
            className="rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-xs"
          >
            View Overdue Leads
          </Link>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Customer Leads"
          value={stats?.totalCustomers || 0}
          subtitle={`+${stats?.todayCustomers || 0} new leads today`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Sales Reps"
          value={stats?.activeEmployees || 0}
          subtitle={`${stats?.pendingEmployees || 0} pending approval`}
          icon={UserCheck}
          color="purple"
        />
        <StatCard
          title="Total Calls Logged"
          value={stats?.totalCalls || 0}
          subtitle={`+${stats?.todayCalls || 0} calls recorded today`}
          icon={PhoneCall}
          color="cyan"
        />
        <StatCard
          title="Won / Conversion Rate"
          value={`${stats?.conversionRate || 0}%`}
          subtitle={`${stats?.completedFollowups || 0} deals won & converted`}
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center justify-between rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Pending Follow-ups</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{stats?.pendingFollowups || 0}</p>
            </div>
          </div>
          <Link
            to="/admin/customers"
            className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
          >
            View <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Won & Converted</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{stats?.completedFollowups || 0}</p>
            </div>
          </div>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Success
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Lost / Dropped</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{stats?.lostFollowups || 0}</p>
            </div>
          </div>
          <span className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
            Closed
          </span>
        </div>
      </div>

      {/* Visual Charts Grid (Row 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Customer Records by Sales Employee */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                Customer Records by Sales Employee
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Total assigned leads vs Won deals</p>
            </div>
            <Link
              to="/admin/employees"
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
            >
              Manage Team <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={charts?.customersByEmployee || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <XAxis
                  dataKey="employee"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="total" name="Total Leads" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="won" name="Won / Converted" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Follow-up Status Distribution */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-xs transition-colors">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
              Lead Stage & Status Pipeline
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Current progress of all active leads</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.statusDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="status"
                >
                  {(charts?.statusDistribution || []).map((entry, index) => (
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
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Customers Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
              Recently Added Customers
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Latest enquiries across both brands</p>
          </div>
          <Link
            to="/admin/customers"
            className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
          >
            View All Records <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
              <tr>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Priority</th>
                <th className="pb-3">Brand</th>
                <th className="pb-3">Mobile</th>
                <th className="pb-3">Location</th>
                <th className="pb-3">Product</th>
                <th className="pb-3">Follow-up</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Sales Rep</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {recentCustomers?.map((c) => (
                <tr
                  key={c._id}
                  onClick={() => setSelectedCustomer(c)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="py-3 font-bold text-slate-900 dark:text-white">{c.customerName}</td>
                  <td className="py-3"><PriorityBadge priority={c.priority} /></td>
                  <td className="py-3"><CompanyBadge company={c.companyName} /></td>
                  <td className="py-3 font-mono text-slate-600 dark:text-slate-300">{c.mobileNumber}</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">{c.city}</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300 max-w-[150px] truncate">{c.productInterested}</td>
                  <td className="py-3 font-medium text-amber-600 dark:text-amber-400">
                    {new Date(c.followUpDate).toLocaleDateString()}
                  </td>
                  <td className="py-3"><StatusBadge status={c.followUpStatus} /></td>
                  <td className="py-3 font-medium text-indigo-600 dark:text-indigo-400">{c.salesEmployeeName}</td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {/* Excel Import Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={fetchStats}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      {/* Add New Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddEmployeeOpen}
        onClose={() => setIsAddEmployeeOpen(false)}
        onSuccess={fetchStats}
      />
    </div>
  );
};
