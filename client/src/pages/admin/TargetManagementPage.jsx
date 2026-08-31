import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  Target,
  Users,
  Calendar,
  Award,
  CheckCircle2,
  TrendingUp,
  Edit3,
  Plus,
  PhoneCall,
  Flame,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const TargetManagementPage = () => {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [targets, setTargets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [formData, setFormData] = useState({
    monthlyLeadTarget: 100,
    dailyLeadTarget: 5,
    monthlyCallTarget: 500,
    dailyCallTarget: 25,
    monthlyConversionTarget: 20,
    dailyConversionTarget: 1,
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  // Fetch employees list
  useEffect(() => {
    api.get('/employees/active-list')
      .then((res) => {
        if (res.data.success) {
          setEmployees(res.data.employees || []);
          if (res.data.employees.length > 0) {
            setSelectedEmployeeId(res.data.employees[0]._id);
          }
        }
      })
      .catch((err) => console.error('Failed to load employee list:', err));
  }, []);

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/targets/all?month=${month}`);
      if (res.data.success) {
        setTargets(res.data.targets || []);
      }
    } catch (err) {
      toast.error('Failed to load employee targets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, [month]);

  const handleOpenAssignModal = (targetItem = null) => {
    if (targetItem) {
      setSelectedEmployeeId(targetItem.employee._id);
      setFormData({
        monthlyLeadTarget: targetItem.target.monthlyLeadTarget || 100,
        dailyLeadTarget: targetItem.target.dailyLeadTarget || 5,
        monthlyCallTarget: targetItem.target.monthlyCallTarget || 500,
        dailyCallTarget: targetItem.target.dailyCallTarget || 25,
        monthlyConversionTarget: targetItem.target.monthlyConversionTarget || 20,
        dailyConversionTarget: targetItem.target.dailyConversionTarget || 1,
        notes: targetItem.target.notes || '',
      });
    } else {
      if (employees.length > 0) {
        setSelectedEmployeeId(employees[0]._id);
      }
      setFormData({
        monthlyLeadTarget: 100,
        dailyLeadTarget: 5,
        monthlyCallTarget: 500,
        dailyCallTarget: 25,
        monthlyConversionTarget: 20,
        dailyConversionTarget: 1,
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      toast.error('Please select an employee.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/targets', {
        userId: selectedEmployeeId,
        month,
        ...formData,
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Sales targets assigned successfully!');
        setIsModalOpen(false);
        fetchTargets();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign targets.');
    } finally {
      setSaving(false);
    }
  };

  const getRankBadge = (index) => {
    switch (index) {
      case 0:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 shadow-xs">
            🥇 1st Rank
          </span>
        );
      case 1:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 dark:bg-slate-700/50 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600/40 shadow-xs">
            🥈 2nd Rank
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-800/10 dark:bg-amber-800/30 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-400 border border-amber-800/30 shadow-xs">
            🥉 3rd Rank
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
            #{index + 1}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-50 dark:from-indigo-950/80 via-white dark:via-slate-900 to-slate-50 dark:to-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Sales Targets & Team Leaderboard
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Admin Quota Controller: Assign custom targets for Leads, Phone Calls, and Closed Conversions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 shadow-xs">
            <Calendar className="h-4 w-4 text-indigo-500" />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Main Assign CTA */}
          <button
            type="button"
            onClick={() => handleOpenAssignModal()}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Assign Employee Targets</span>
          </button>
        </div>
      </div>

      {/* Leaderboard Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : targets.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
          <Users className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No sales employees found</p>
          <p className="text-xs text-slate-400 mt-1">
            Approve employee signups in Employee Management to assign targets.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {targets.map((item, index) => (
            <div
              key={item.employee._id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs hover:border-indigo-500/40 transition-all"
            >
              {/* Employee Top Profile Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl font-bold text-white text-sm shadow-md"
                    style={{ backgroundColor: item.employee.avatarColor || '#4f46e5' }}
                  >
                    {item.employee.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.employee.name}
                      </h3>
                      {getRankBadge(index)}
                    </div>
                    <p className="text-[11px] text-slate-500">{item.employee.designation}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Score</span>
                    <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                      {item.overallScore}%
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAssignModal(item)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 transition-all"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit Quotas</span>
                  </button>
                </div>
              </div>

              {/* 3 Core Quota Progress Bars */}
              <div className="space-y-3 pt-2">
                {/* 1. Lead Generation Target */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Monthly Leads Quota</span>
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {item.progress.monthlyLeads.achieved} / {item.progress.monthlyLeads.target} ({item.progress.monthlyLeads.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${item.progress.monthlyLeads.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>Daily Quota: {item.progress.dailyLeads.achieved} / {item.progress.dailyLeads.target} today</span>
                    <span>{item.progress.monthlyLeads.remaining} remaining</span>
                  </div>
                </div>

                {/* 2. Calling Activity Target */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <PhoneCall className="h-3.5 w-3.5 text-blue-500" />
                      <span>Phone Calls Quota</span>
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {item.progress.monthlyCalls.achieved} / {item.progress.monthlyCalls.target} ({item.progress.monthlyCalls.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${item.progress.monthlyCalls.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>Daily Calls: {item.progress.dailyCalls.achieved} / {item.progress.dailyCalls.target} today</span>
                    <span>{item.progress.monthlyCalls.remaining} remaining</span>
                  </div>
                </div>

                {/* 3. Conversion / Won Deals Target */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Closed Deals / Conversions Quota</span>
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {item.progress.monthlyConversions.achieved} / {item.progress.monthlyConversions.target} ({item.progress.monthlyConversions.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${item.progress.monthlyConversions.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>Daily Goal: {item.progress.dailyConversions.achieved} / {item.progress.dailyConversions.target} today</span>
                    <span>{item.progress.monthlyConversions.remaining} remaining</span>
                  </div>
                </div>
              </div>

              {/* Admin Strategy Notes (if any) */}
              {item.target.notes && (
                <p className="text-[11px] text-slate-600 dark:text-slate-400 italic bg-slate-50/80 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <strong>Admin Note:</strong> {item.target.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Admin Assign / Edit Target Modal (Fully Viewport Responsive with Scroll) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-fade-in">
            {/* Modal Header (Fixed at top) */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 bg-indigo-50/60 dark:bg-indigo-950/30">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Set Employee Sales Quotas & Targets
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Month: {month}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Select Employee */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Sales Employee *
                </label>
                <select
                  required
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                >
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} — {emp.designation} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* 1. Leads Quotas */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3 space-y-2">
                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  1. Lead Generation Targets
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Monthly Leads Target
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.monthlyLeadTarget}
                      onChange={(e) => setFormData({ ...formData, monthlyLeadTarget: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Daily Leads Target
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.dailyLeadTarget}
                      onChange={(e) => setFormData({ ...formData, dailyLeadTarget: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Calling Quotas */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3 space-y-2">
                <h4 className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <PhoneCall className="h-3.5 w-3.5" />
                  2. Phone Calling Targets
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Monthly Calls Target
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.monthlyCallTarget}
                      onChange={(e) => setFormData({ ...formData, monthlyCallTarget: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Daily Calls Target
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.dailyCallTarget}
                      onChange={(e) => setFormData({ ...formData, dailyCallTarget: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Conversion Quotas */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3 space-y-2">
                <h4 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" />
                  3. Conversion / Closed Won Targets
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Monthly Conversions Target
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.monthlyConversionTarget}
                      onChange={(e) => setFormData({ ...formData, monthlyConversionTarget: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Daily Conversions Goal
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.dailyConversionTarget}
                      onChange={(e) => setFormData({ ...formData, dailyConversionTarget: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Strategy Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Manager Strategy Notes & Campaign Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Focus on enterprise accounts, ceramic coating promos, or specific city regions..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              {/* Modal Buttons (Inside sticky footer area) */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 pb-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 font-bold text-white shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
                >
                  <Target className="h-4 w-4" />
                  <span>{saving ? 'Saving...' : 'Publish Targets'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
