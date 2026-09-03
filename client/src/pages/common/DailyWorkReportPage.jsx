import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  Calendar,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  UserCheck,
  Send,
  Users,
  Building,
  Filter,
  Trash2,
  Edit2,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DateRangePicker } from '../../components/common/DateRangePicker';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { Modal } from '../../components/common/Modal';

export const DailyWorkReportPage = () => {
  const { user, isAdmin } = useAuth();

  // Employee Form State
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatus, setAttendanceStatus] = useState('Present');
  const [clockInTime, setClockInTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const [clockOutTime, setClockOutTime] = useState('');
  const [customersContacted, setCustomersContacted] = useState('');
  const [followupsCompleted, setFollowupsCompleted] = useState('');
  const [newLeadsAdded, setNewLeadsAdded] = useState('');
  const [dealsConverted, setDealsConverted] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Table History State (for Admin or Employee own)
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [employees, setEmployees] = useState([]);

  // Delete Modal State (Admin)
  const [reportToDelete, setReportToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Modal State (Admin)
  const [reportToEdit, setReportToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    date: '',
    attendanceStatus: 'Present',
    clockInTime: '',
    clockOutTime: '',
    customersContacted: 0,
    followupsCompleted: 0,
    newLeadsAdded: 0,
    dealsConverted: 0,
    remarks: '',
  });
  const [updating, setUpdating] = useState(false);

  // Load employee list for Admin filter
  useEffect(() => {
    if (isAdmin) {
      api.get('/employees/active-list')
        .then((res) => {
          if (res.data.success) {
            setEmployees(res.data.employees);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [isAdmin]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        employeeId: isAdmin && filterEmployee !== 'all' ? filterEmployee : undefined,
      };

      const endpoint = isAdmin ? '/reports/all' : '/reports/my-reports';
      const res = await api.get(endpoint, { params });
      if (res.data.success) {
        setReports(res.data.reports || []);
      }
    } catch (err) {
      toast.error('Failed to load daily work reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [isAdmin, startDate, endDate, filterEmployee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/reports/submit', {
        date: reportDate,
        attendanceStatus,
        clockInTime,
        clockOutTime,
        customersContacted: customersContacted !== '' ? Number(customersContacted) : undefined,
        followupsCompleted: followupsCompleted !== '' ? Number(followupsCompleted) : undefined,
        newLeadsAdded: newLeadsAdded !== '' ? Number(newLeadsAdded) : undefined,
        dealsConverted: dealsConverted !== '' ? Number(dealsConverted) : undefined,
        remarks: remarks.trim(),
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Daily report submitted successfully!');
        setRemarks('');
        fetchReports();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!reportToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/reports/${reportToDelete._id}`);
      if (res.data.success) {
        toast.success(res.data.message || 'Daily report deleted successfully.');
        setReportToDelete(null);
        fetchReports();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete report.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (report) => {
    setReportToEdit(report);
    setEditFormData({
      date: report.date ? new Date(report.date).toISOString().split('T')[0] : '',
      attendanceStatus: report.attendanceStatus || 'Present',
      clockInTime: report.clockInTime || '',
      clockOutTime: report.clockOutTime || '',
      customersContacted: report.customersContacted !== undefined ? report.customersContacted : 0,
      followupsCompleted: report.followupsCompleted !== undefined ? report.followupsCompleted : 0,
      newLeadsAdded: report.newLeadsAdded !== undefined ? report.newLeadsAdded : 0,
      dealsConverted: report.dealsConverted !== undefined ? report.dealsConverted : 0,
      remarks: report.remarks || '',
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!reportToEdit) return;
    setUpdating(true);
    try {
      const res = await api.put(`/reports/${reportToEdit._id}`, {
        date: editFormData.date,
        attendanceStatus: editFormData.attendanceStatus,
        clockInTime: editFormData.clockInTime,
        clockOutTime: editFormData.clockOutTime,
        customersContacted: Number(editFormData.customersContacted),
        followupsCompleted: Number(editFormData.followupsCompleted),
        newLeadsAdded: Number(editFormData.newLeadsAdded),
        dealsConverted: Number(editFormData.dealsConverted),
        remarks: editFormData.remarks.trim(),
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Daily report updated successfully.');
        setReportToEdit(null);
        fetchReports();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update report.');
    } finally {
      setUpdating(false);
    }
  };

  const attendanceOptions = ['Present', 'Half Day', 'Leave', 'Work From Home'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white dark:bg-slate-900/80 p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <UserCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <span>{isAdmin ? 'Team Attendance & Daily Work Reports' : 'My Daily Attendance & Work Report'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isAdmin
              ? 'Review daily login times, attendance records, and edit or manage submitted work summaries for all sales reps.'
              : 'Clock in your daily attendance and submit your end-of-day sales accomplishments.'}
          </p>
        </div>
      </div>

      {/* Employee Submission Form (Visible to Employees) */}
      {!isAdmin && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 shadow-xs"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Clock className="h-4 w-4 text-indigo-500" />
            <span>Submit Today's Work Summary</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {/* Date */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Report Date *
              </label>
              <input
                type="date"
                required
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Attendance Status */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Attendance Status *
              </label>
              <select
                value={attendanceStatus}
                onChange={(e) => setAttendanceStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:outline-none font-semibold"
              >
                {attendanceOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Clock In */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clock In Time
              </label>
              <input
                type="text"
                value={clockInTime}
                onChange={(e) => setClockInTime(e.target.value)}
                placeholder="09:30 AM"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Clock Out */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clock Out Time
              </label>
              <input
                type="text"
                value={clockOutTime}
                onChange={(e) => setClockOutTime(e.target.value)}
                placeholder="06:30 PM"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Counts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customers Contacted / Calls
              </label>
              <input
                type="number"
                min="0"
                placeholder="Auto-calculated if blank"
                value={customersContacted}
                onChange={(e) => setCustomersContacted(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Follow-ups Completed
              </label>
              <input
                type="number"
                min="0"
                placeholder="Auto-calculated if blank"
                value={followupsCompleted}
                onChange={(e) => setFollowupsCompleted(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Leads Registered
              </label>
              <input
                type="number"
                min="0"
                placeholder="Auto-calculated if blank"
                value={newLeadsAdded}
                onChange={(e) => setNewLeadsAdded(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Deals Converted (Won)
              </label>
              <input
                type="number"
                min="0"
                placeholder="Auto-calculated if blank"
                value={dealsConverted}
                onChange={(e) => setDealsConverted(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">
              Daily Summary & Remarks
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Key clients pitched, quotations prepared, pending items for tomorrow..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
            >
              <Send className="h-4 w-4" />
              <span>{submitting ? 'Submitting...' : 'Submit Daily Report'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Date Range & Team Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Filter by Date Range:
            </span>
          </div>

          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onDateChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
            showPresets={true}
          />
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/40 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 focus:outline-none"
            >
              <option value="all">👤 All Employees</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Reports Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Date</th>
                {isAdmin && <th className="px-4 py-3">Employee</th>}
                <th className="px-4 py-3">Attendance</th>
                <th className="px-4 py-3">Clock In / Out</th>
                <th className="px-4 py-3">Calls</th>
                <th className="px-4 py-3">Follow-ups</th>
                <th className="px-4 py-3">Leads Added</th>
                <th className="px-4 py-3">Conversions</th>
                <th className="px-4 py-3">Remarks</th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 10 : 9} className="py-12 text-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mx-auto" />
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 10 : 9} className="py-12 text-center text-slate-400">
                    No daily reports found for this selection.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">
                      {new Date(r.date).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        {r.employeeName}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          r.attendanceStatus === 'Present'
                            ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {r.attendanceStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
                      {r.clockInTime} {r.clockOutTime ? `— ${r.clockOutTime}` : ''}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {r.customersContacted}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {r.followupsCompleted}
                    </td>
                    <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">
                      +{r.newLeadsAdded}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {r.dealsConverted}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-[220px] truncate">
                      {r.remarks || '-'}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                            title="Edit Daily Report"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setReportToDelete(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete Daily Report"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Daily Report Modal (Admin) */}
      <Modal
        isOpen={!!reportToEdit}
        onClose={() => setReportToEdit(null)}
        title={`Edit Daily Report: ${reportToEdit?.employeeName || 'Employee'}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Report Date
              </label>
              <input
                type="date"
                required
                value={editFormData.date}
                onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Attendance Status
              </label>
              <select
                value={editFormData.attendanceStatus}
                onChange={(e) => setEditFormData({ ...editFormData, attendanceStatus: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:outline-none font-semibold"
              >
                {attendanceOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clock In Time
              </label>
              <input
                type="text"
                value={editFormData.clockInTime}
                onChange={(e) => setEditFormData({ ...editFormData, clockInTime: e.target.value })}
                placeholder="09:30 AM"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clock Out Time
              </label>
              <input
                type="text"
                value={editFormData.clockOutTime}
                onChange={(e) => setEditFormData({ ...editFormData, clockOutTime: e.target.value })}
                placeholder="06:30 PM"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Calls / Contacted
              </label>
              <input
                type="number"
                min="0"
                value={editFormData.customersContacted}
                onChange={(e) => setEditFormData({ ...editFormData, customersContacted: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Follow-ups Completed
              </label>
              <input
                type="number"
                min="0"
                value={editFormData.followupsCompleted}
                onChange={(e) => setEditFormData({ ...editFormData, followupsCompleted: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Leads Added
              </label>
              <input
                type="number"
                min="0"
                value={editFormData.newLeadsAdded}
                onChange={(e) => setEditFormData({ ...editFormData, newLeadsAdded: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Deals Converted
              </label>
              <input
                type="number"
                min="0"
                value={editFormData.dealsConverted}
                onChange={(e) => setEditFormData({ ...editFormData, dealsConverted: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">
              Summary & Remarks
            </label>
            <textarea
              rows={3}
              value={editFormData.remarks}
              onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setReportToEdit(null)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:bg-indigo-800 transition-all"
            >
              <Save className="h-4 w-4" />
              <span>{updating ? 'Updating...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!reportToDelete}
        onClose={() => setReportToDelete(null)}
        onConfirm={handleDeleteReport}
        title="Delete Daily Work Report"
        message={`Are you sure you want to delete the daily work report for "${reportToDelete?.employeeName}" on ${reportToDelete?.date ? new Date(reportToDelete.date).toLocaleDateString() : 'this date'}?`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Report'}
        type="danger"
      />
    </div>
  );
};
