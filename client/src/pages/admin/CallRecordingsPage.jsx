import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { AudioPlayer } from '../../components/common/AudioPlayer';
import { DateRangePicker } from '../../components/common/DateRangePicker';
import { UploadRecordingModal } from '../../components/recordings/UploadRecordingModal';
import { CustomerDetailModal } from '../../components/customers/CustomerDetailModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { CompanyBadge, StatusBadge } from '../../components/common/Badge';
import {
  Mic,
  Search,
  Users,
  Calendar,
  Clock,
  PhoneCall,
  User,
  Trash2,
  ExternalLink,
  Plus,
  RefreshCw,
  FileAudio,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const CallRecordingsPage = () => {
  const [recordings, setRecordings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRecordings: 0, todayRecordings: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedResult, setSelectedResult] = useState('all');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '', preset: 'all_time' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [recordingToDelete, setRecordingToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load employee list for filter
  useEffect(() => {
    api.get('/employees/active-list')
      .then((res) => {
        if (res.data.success) {
          setEmployees(res.data.employees || []);
        }
      })
      .catch((err) => console.error('Failed to load employee list:', err));
  }, []);

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/calls/recordings', {
        params: {
          search,
          employeeId: selectedEmployee !== 'all' ? selectedEmployee : undefined,
          callResult: selectedResult !== 'all' ? selectedResult : undefined,
          startDate: dateRange.startDate || undefined,
          endDate: dateRange.endDate || undefined,
          page,
          limit: 15,
        },
      });

      if (res.data.success) {
        setRecordings(res.data.recordings || []);
        setTotalPages(res.data.pages || 1);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (error) {
      toast.error('Failed to load call recordings.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, [selectedEmployee, selectedResult, dateRange, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRecordings();
  };

  const handleDelete = async () => {
    if (!recordingToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/calls/recordings/${recordingToDelete._id}`);
      if (res.data.success) {
        toast.success('Call recording deleted.');
        setRecordingToDelete(null);
        fetchRecordings();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete recording.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenCustomer = (rec) => {
    if (rec.customerId && typeof rec.customerId === 'object') {
      setSelectedCustomer(rec.customerId);
    } else {
      // Fetch customer
      api.get(`/customers/${rec.customerId}`)
        .then((res) => {
          if (res.data.success) setSelectedCustomer(res.data.customer);
        })
        .catch(() => toast.error('Could not load customer details.'));
    }
  };

  const callResults = ['Connected', 'Interested', 'Call Back Later', 'Busy', 'Voicemail'];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-50 dark:from-indigo-950/80 via-white dark:via-slate-900 to-slate-50 dark:to-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <Mic className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Call Recordings & Audio Quality Hub
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Listen to customer phone conversations uploaded by sales employees, monitor interaction quality, and track deal discussions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchRecordings()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
            title="Refresh List"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Recording</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase">
            <FileAudio className="h-4 w-4" />
            <span>Total Recordings</span>
          </div>
          <p className="mt-2 text-2xl font-black text-indigo-900 dark:text-indigo-100">
            {stats.totalRecordings}
          </p>
          <p className="mt-0.5 text-[11px] text-indigo-600 dark:text-indigo-400">Verified call interactions</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">
            <Clock className="h-4 w-4" />
            <span>Uploaded Today</span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-900 dark:text-emerald-100">
            {stats.todayRecordings}
          </p>
          <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">Fresh calls logged today</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
            <Users className="h-4 w-4 text-indigo-500" />
            <span>Active Team Members</span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {employees.length}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">Sales representatives</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
            <span>Admin Review</span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            100%
          </p>
          <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">Audio playback enabled</p>
        </div>
      </div>

      {/* Date Range Picker Bar */}
      <DateRangePicker
        value={dateRange}
        onChange={(newRange) => {
          setDateRange(newRange);
          setPage(1);
        }}
        label="Filter Calls by Date"
      />

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 rounded-2xl bg-white dark:bg-slate-900/80 p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full md:w-auto relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone number, agent, or discussion keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Employee Dropdown */}
          <select
            value={selectedEmployee}
            onChange={(e) => {
              setSelectedEmployee(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">👥 All Employees ({employees.length})</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name} ({emp.phone})
              </option>
            ))}
          </select>

          {/* Call Result Filter */}
          <select
            value={selectedResult}
            onChange={(e) => {
              setSelectedResult(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">📞 All Call Outcomes</option>
            {callResults.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Recordings List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : recordings.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Mic className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Call Recordings Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Sales employees can upload audio call recordings during call logging or via the "Upload Recording" button.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recordings.map((rec) => (
              <div
                key={rec._id}
                className="p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Customer & Call Details */}
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenCustomer(rec)}
                      className="text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                    >
                      <span>{rec.customerName}</span>
                      <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                    </button>

                    {rec.customerId?.companyName && (
                      <CompanyBadge company={rec.customerId.companyName} />
                    )}

                    <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300">
                      📱 {rec.mobileNumber}
                    </span>

                    <span className="rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                      {rec.callResult}
                    </span>
                  </div>

                  {/* Notes snippet */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    <strong className="text-slate-700 dark:text-slate-200 font-semibold">Discussion:</strong>{' '}
                    {rec.remarks}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-indigo-500" />
                      Recorded by: <strong className="text-slate-700 dark:text-slate-300">{rec.salesEmployeeName}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(rec.callDate || rec.createdAt).toLocaleDateString()} at {rec.callTime || '11:00 AM'}
                    </span>
                  </div>
                </div>

                {/* Built-in Audio Player Component */}
                <div className="w-full lg:w-96 shrink-0 flex items-center gap-2">
                  <div className="flex-1">
                    <AudioPlayer
                      src={rec.recordingUrl}
                      fileName={rec.recordingFileName || 'Customer_Call_Recording.mp3'}
                    />
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => setRecordingToDelete(rec)}
                    className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors shrink-0"
                    title="Delete recording"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-6 py-3 bg-slate-50 dark:bg-slate-900/40">
            <p className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Recording Modal */}
      <UploadRecordingModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => fetchRecordings()}
      />

      {/* Customer Detail Profile Modal */}
      <CustomerDetailModal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
        onCustomerUpdated={fetchRecordings}
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!recordingToDelete}
        onClose={() => setRecordingToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Call Recording"
        message={`Are you sure you want to permanently delete this call recording with customer "${recordingToDelete?.customerName}"? The audio file will be erased.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Recording'}
        type="danger"
      />
    </div>
  );
};
