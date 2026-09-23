import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { CashCollectionModal } from '../../components/cashCollection/CashCollectionModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import {
  IndianRupee,
  Wallet,
  Calendar,
  Search,
  Filter,
  Download,
  Plus,
  Minus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  ShieldCheck,
  Building2,
  User,
  ArrowUpDown,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  FileText,
  Tag,
  PlusCircle,
  MinusCircle,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const CashCollectionPage = () => {
  const [collections, setCollections] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({
    totalCollected: 0,
    totalExpense: 0,
    netBalance: 0,
    totalFilteredAmount: 0,
    todayCollected: 0,
    todayExpense: 0,
    todayNet: 0,
    todayCount: 0,
    thisMonthCollected: 0,
    thisMonthExpense: 0,
    thisMonthNet: 0,
    workerBreakdown: [],
    distinctWorkers: [],
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'Collection' | 'Expense'
  const [workerFilter, setWorkerFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [paymentModeFilter, setPaymentModeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangePreset, setDateRangePreset] = useState('all'); // all, today, yesterday, this_week, this_month, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState('Collection');
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Employees for suggestions
  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      if (res.data.success) {
        setEmployees(res.data.employees || []);
      }
    } catch (err) {
      console.warn('Failed to load employees list:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Compute date ranges based on preset
  const handlePresetChange = (preset) => {
    setDateRangePreset(preset);
    const today = new Date();
    const formatDate = (d) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const t = formatDate(today);
      setStartDate(t);
      setEndDate(t);
    } else if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = formatDate(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'this_week') {
      const d = new Date(today);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(d.setDate(diff));
      setStartDate(formatDate(monday));
      setEndDate(formatDate(today));
    } else if (preset === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(today));
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
    setPage(1);
  };

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 25,
        type: typeFilter,
        workerName: workerFilter,
        companyName: companyFilter,
        paymentMode: paymentModeFilter,
        status: statusFilter,
        search: search.trim(),
      };

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/cash-collections', { params });
      if (res.data.success) {
        setCollections(res.data.collections || []);
        setStats(res.data.stats || {});
        setTotalPages(res.data.pages || 1);
        setTotalCount(res.data.total || 0);
      }
    } catch (error) {
      console.error('Fetch Collections Error:', error);
      toast.error('Failed to load cash transactions.');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, workerFilter, companyFilter, paymentModeFilter, statusFilter, search, startDate, endDate]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setWorkerFilter('all');
    setCompanyFilter('all');
    setPaymentModeFilter('all');
    setStatusFilter('all');
    setDateRangePreset('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      setIsDeleting(true);
      const res = await api.delete(`/cash-collections/${deletingItem._id}`);
      if (res.data.success) {
        toast.success(res.data.message || 'Entry deleted successfully.');
        setDeletingItem(null);
        fetchCollections();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete entry.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to CSV
  const handleExportCSV = async () => {
    try {
      toast.loading('Preparing CSV export...', { id: 'csv-export' });
      const params = {
        type: typeFilter !== 'all' ? typeFilter : undefined,
        employeeName: workerFilter !== 'all' ? workerFilter : undefined,
        companyName: companyFilter,
        paymentMode: paymentModeFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const res = await api.get('/cash-collections/export/data', { params });
      if (res.data.success && res.data.collections) {
        const rows = res.data.collections;
        if (rows.length === 0) {
          toast.error('No cash records to export.', { id: 'csv-export' });
          return;
        }

        const headers = [
          'Date',
          'Transaction Type',
          'Category / Purpose',
          'Worker / Payee Name',
          'Amount (INR)',
          'Net Cash Effect',
          'Payment Mode',
          'Company',
          'Receipt / Voucher No',
          'Reference / Customer',
          'Status',
          'Notes',
          'Recorded By',
        ];

        const csvRows = [headers.join(',')];

        rows.forEach((r) => {
          const isExp = r.type === 'Expense';
          const dateStr = r.date ? new Date(r.date).toLocaleDateString('en-IN') : '';
          const row = [
            `"${dateStr}"`,
            `"${isExp ? 'Cash Out (Expense/खर्च)' : 'Cash In (Collection/जमा)'}"`,
            `"${(r.category || (isExp ? 'General Expense' : 'Collection')).replace(/"/g, '""')}"`,
            `"${(r.employeeName || '').replace(/"/g, '""')}"`,
            r.amount || 0,
            `"${isExp ? `-${r.amount}` : `+${r.amount}`}"`,
            `"${r.paymentMode || 'Cash'}"`,
            `"${r.companyName || 'SofaShine'}"`,
            `"${(r.receiptNo || '').replace(/"/g, '""')}"`,
            `"${(r.customerReference || '').replace(/"/g, '""')}"`,
            `"${r.status || 'Received'}"`,
            `"${(r.notes || '').replace(/"/g, '""')}"`,
            `"${(r.collectedByAdminName || 'Admin').replace(/"/g, '""')}"`,
          ];
          csvRows.push(row.join(','));
        });

        const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
        const link = document.createElement('a');
        link.setAttribute('href', csvContent);
        link.setAttribute('download', `Cash_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Exported ${rows.length} records successfully!`, { id: 'csv-export' });
      }
    } catch (err) {
      console.error('Export Error:', err);
      toast.error('Failed to export CSV.', { id: 'csv-export' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <ShieldCheck className="h-3 w-3" />
            Verified
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="h-3 w-3" />
            Received
          </span>
        );
    }
  };

  const getPaymentModeBadge = (mode) => {
    switch (mode) {
      case 'UPI':
        return (
          <span className="font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800/40 text-xs">
            📱 UPI
          </span>
        );
      case 'Bank Deposit':
        return (
          <span className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800/40 text-xs">
            🏦 Bank
          </span>
        );
      case 'Cheque':
        return (
          <span className="font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/40 text-xs">
            📜 Cheque
          </span>
        );
      default:
        return (
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40 text-xs">
            💵 Cash
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-md shadow-emerald-500/20 text-white">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Daily Cash & Expenses Ledger
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Admin Panel • Track Worker Cash Collections, Cash Spent/Expenses, and Net Cash in Hand
              </p>
            </div>
          </div>
        </div>

        {/* Top Primary Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchCollections}
            title="Refresh Data"
            className="flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Record Cash In (Green Button) */}
          <button
            onClick={() => {
              setEditingItem(null);
              setModalInitialType('Collection');
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-500/25 transition-all active:scale-[0.98]"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Record Cash In (जमा)</span>
          </button>

          {/* Record Cash Out / Expense (Red Button) */}
          <button
            onClick={() => {
              setEditingItem(null);
              setModalInitialType('Expense');
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-rose-500/25 transition-all active:scale-[0.98]"
          >
            <MinusCircle className="h-4 w-4" />
            <span>- Record Cash Out (खर्च - Minus)</span>
          </button>
        </div>
      </div>

      {/* 3 Prominent Section Navigation Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
        {/* Tab 1: All / Net Balance */}
        <button
          type="button"
          onClick={() => {
            setTypeFilter('all');
            setPage(1);
          }}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all ${
            typeFilter === 'all'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="h-4 w-4 text-indigo-500" />
          <span>📊 Full Ledger (Net Hisab)</span>
          <span className="ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            ₹{(stats.netBalance || 0).toLocaleString('en-IN')}
          </span>
        </button>

        {/* Tab 2: Cash In / Collections */}
        <button
          type="button"
          onClick={() => {
            setTypeFilter('Collection');
            setPage(1);
          }}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all ${
            typeFilter === 'Collection'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>💵 Cash In (Collections / जमा)</span>
          <span className={`ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
            typeFilter === 'Collection' ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
          }`}>
            +₹{(stats.totalCollected || 0).toLocaleString('en-IN')}
          </span>
        </button>

        {/* Tab 3: Cash Out / Expenses */}
        <button
          type="button"
          onClick={() => {
            setTypeFilter('Expense');
            setPage(1);
          }}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all ${
            typeFilter === 'Expense'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingDown className="h-4 w-4" />
          <span>🔻 Cash Out (Expenses / खर्च - Minus)</span>
          <span className={`ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
            typeFilter === 'Expense' ? 'bg-white/20 text-white' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
          }`}>
            -₹{(stats.totalExpense || 0).toLocaleString('en-IN')}
          </span>
        </button>
      </div>

      {/* 4 Summary Stats Cards with Net Cash Calculation */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Net Cash in Hand (Balance) */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/30 dark:from-emerald-950/30 dark:via-slate-900 dark:to-teal-950/20 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Net Cash in Hand (Balance)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className={`text-2xl font-black tracking-tight ${
              (stats.netBalance || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              ₹{(stats.netBalance || 0).toLocaleString('en-IN')}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <span className="text-emerald-600 dark:text-emerald-400">In: +₹{(stats.totalCollected || 0).toLocaleString('en-IN')}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-rose-600 dark:text-rose-400">Out: -₹{(stats.totalExpense || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Today's Net Balance */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-200/80 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/30 dark:from-indigo-950/30 dark:via-slate-900 dark:to-blue-950/20 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Today's Net Balance
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ₹{(stats.todayNet || 0).toLocaleString('en-IN')}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <span className="text-emerald-600 dark:text-emerald-400">In: +₹{(stats.todayCollected || 0).toLocaleString('en-IN')}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-rose-600 dark:text-rose-400">Out: -₹{(stats.todayExpense || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* This Month's Net Balance */}
        <div className="relative overflow-hidden rounded-2xl border border-purple-200/80 dark:border-purple-500/20 bg-gradient-to-br from-purple-50/80 via-white to-fuchsia-50/30 dark:from-purple-950/30 dark:via-slate-900 dark:to-fuchsia-950/20 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              Month Net ({new Date().toLocaleString('default', { month: 'short' })})
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ₹{(stats.thisMonthNet || 0).toLocaleString('en-IN')}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <span className="text-emerald-600 dark:text-emerald-400">In: +₹{(stats.thisMonthCollected || 0).toLocaleString('en-IN')}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-rose-600 dark:text-rose-400">Out: -₹{(stats.thisMonthExpense || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Total Cash Spent / Expenses */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-200/80 dark:border-rose-500/20 bg-gradient-to-br from-rose-50/80 via-white to-red-50/30 dark:from-rose-950/30 dark:via-slate-900 dark:to-red-950/20 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Total Cash Spent (खर्च)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              - ₹{(stats.totalExpense || 0).toLocaleString('en-IN')}
            </p>
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-semibold">
              Fuel, materials, salaries & cash expenses
            </p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar Container */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3.5">
        {/* Row 1: Search, Worker Filter, Company, Payment Mode */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {/* Live Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search worker, ref, category..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 pl-9 pr-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Worker Filter */}
          <div>
            <select
              value={workerFilter}
              onChange={(e) => {
                setWorkerFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">👥 All Workers / Payees</option>
              {Array.from(
                new Set([
                  ...(stats.distinctWorkers || []),
                  ...employees.map((e) => e.name),
                ])
              )
                .filter(Boolean)
                .sort()
                .map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
            </select>
          </div>

          {/* Company Brand Filter */}
          <div>
            <select
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">🏢 All Brands (SofaShine & CleanCruisers)</option>
              <option value="SofaShine">SofaShine</option>
              <option value="CleanCruisers">CleanCruisers</option>
            </select>
          </div>

          {/* Payment Mode Filter */}
          <div>
            <select
              value={paymentModeFilter}
              onChange={(e) => {
                setPaymentModeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">💳 All Payment Modes</option>
              <option value="Cash">💵 Cash</option>
              <option value="UPI">📱 UPI</option>
              <option value="Bank Deposit">🏦 Bank Deposit</option>
              <option value="Cheque">📜 Cheque</option>
            </select>
          </div>
        </div>

        {/* Row 2: Date Presets & Custom Range */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1">
              Date:
            </span>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'custom', label: 'Custom' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetChange(p.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  dateRangePreset === p.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {(dateRangePreset === 'custom' || startDate || endDate) && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateRangePreset('custom');
                  setPage(1);
                }}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-900 dark:text-white"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateRangePreset('custom');
                  setPage(1);
                }}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Reset Filters */}
          {(search || typeFilter !== 'all' || workerFilter !== 'all' || companyFilter !== 'all' || paymentModeFilter !== 'all' || dateRangePreset !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Collections & Expenses Data Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
              <Wallet className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Cash Records Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              No cash collection or expense records match your filters.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => {
                  setEditingItem(null);
                  setModalInitialType('Collection');
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Record Cash In (जमा)</span>
              </button>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setModalInitialType('Expense');
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-sm"
              >
                <Minus className="h-4 w-4" />
                <span>Record Cash Out (खर्च)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Worker / Payee</th>
                  <th className="py-3.5 px-4">Brand</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4">Payment Mode</th>
                  <th className="py-3.5 px-4">Receipt / Ref</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Notes / Purpose</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {collections.map((item) => {
                  const isExp = item.type === 'Expense';
                  const collectionDate = item.date ? new Date(item.date) : new Date();

                  return (
                    <tr
                      key={item._id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors ${
                        isExp ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {collectionDate.toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {collectionDate.toLocaleDateString('en-IN', { weekday: 'short' })}
                        </div>
                      </td>

                      {/* Transaction Type & Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isExp ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                              <ArrowUpRight className="h-3 w-3 text-rose-500 stroke-[2.5]" />
                              Cash Out (खर्च)
                            </span>
                            {item.category && (
                              <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 pl-0.5">
                                {item.category}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                              <ArrowDownLeft className="h-3 w-3 text-emerald-500 stroke-[2.5]" />
                              Cash In (जमा)
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Worker / Payee */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-bold text-white text-xs shadow-xs"
                            style={{
                              backgroundColor: isExp ? '#e11d48' : item.employeeId?.avatarColor || '#4f46e5',
                            }}
                          >
                            {(item.employeeName || 'W').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white leading-tight">
                              {item.employeeName}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {item.employeeId?.phone || item.employeeId?.email || (isExp ? 'Cash Payee' : 'Worker')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                            item.companyName === 'CleanCruisers'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                          }`}
                        >
                          {item.companyName || 'SofaShine'}
                        </span>
                      </td>

                      {/* Amount (+ or -) */}
                      <td className="py-3 px-4 whitespace-nowrap text-right font-black text-sm">
                        <span className={isExp ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                          {isExp ? '- ₹' : '+ ₹'}{(item.amount || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Payment Mode */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getPaymentModeBadge(item.paymentMode)}
                      </td>

                      {/* Receipt & Reference */}
                      <td className="py-3 px-4">
                        {item.receiptNo ? (
                          <div className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            #{item.receiptNo}
                          </div>
                        ) : null}
                        {item.customerReference ? (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                            {item.customerReference}
                          </div>
                        ) : !item.receiptNo ? (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        ) : null}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-4 max-w-[180px] truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {item.notes || '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setIsAddModalOpen(true);
                            }}
                            title="Edit Entry"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingItem(item)}
                            title="Delete Entry"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/50">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Page <span className="font-bold text-slate-900 dark:text-white">{page}</span> of{' '}
              <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span> ({totalCount} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <CashCollectionModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingItem(null);
          }}
          onSuccess={fetchCollections}
          initialType={modalInitialType}
          editData={editingItem}
          employees={employees}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <ConfirmModal
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleDeleteConfirm}
          title={deletingItem.type === 'Expense' ? 'Delete Cash Expense Entry?' : 'Delete Cash Collection Entry?'}
          message={`Are you sure you want to delete the ${
            deletingItem.type === 'Expense' ? 'expense' : 'collection'
          } of ₹${(deletingItem.amount || 0).toLocaleString('en-IN')} for ${
            deletingItem.employeeName
          } on ${new Date(deletingItem.date).toLocaleDateString()}? This action cannot be undone.`}
          confirmText="Yes, Delete Entry"
          isDanger
          loading={isDeleting}
        />
      )}
    </div>
  );
};
