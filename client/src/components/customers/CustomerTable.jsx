import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { StatusBadge, CompanyBadge, PriorityBadge } from '../common/Badge';
import { CustomerFormModal } from './CustomerFormModal';
import { CustomerDetailModal } from './CustomerDetailModal';
import { CallLogModal } from './CallLogModal';
import { WhatsAppModal } from '../common/WhatsAppModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { DateRangePicker } from '../common/DateRangePicker';
import {
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit2,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Phone,
  PhoneCall,
  MessageSquare,
  Calendar,
  User,
  X,
  FileSpreadsheet,
  FileText,
  FileDown,
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const CustomerTable = ({
  title = 'Customer Records',
  subtitle = 'Manage customer inquiries, follow-ups, and sales outreach',
  showAddButton = true,
  onOpenImportModal,
}) => {
  const { user, isAdmin } = useAuth();
  const cacheKey = `cached_cust_${isAdmin ? 'admin' : 'emp'}`;

  const [customers, setCustomers] = useState(() => {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return !sessionStorage.getItem(cacheKey);
    } catch (e) {
      return true;
    }
  });
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [tabCounts, setTabCounts] = useState({ dueToday: 0, overdue: 0 });

  // Follow-up tab filter: 'all' | 'due_today' | 'overdue' | 'upcoming'
  const [followUpTab, setFollowUpTab] = useState('all');

  // Filters and search state
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Employee dropdown for admin
  const [employeeList, setEmployeeList] = useState([]);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Quick Action Modal states
  const [customerForCall, setCustomerForCall] = useState(null);
  const [customerForWhatsApp, setCustomerForWhatsApp] = useState(null);

  // Load employee list if Admin
  useEffect(() => {
    if (isAdmin) {
      api.get('/employees/active-list')
        .then((res) => {
          if (res.data.success) {
            setEmployeeList(res.data.employees);
          }
        })
        .catch((err) => console.error('Failed to load employees for filter:', err));
    }
  }, [isAdmin]);

  // Fetch Customers API
  const fetchCustomers = useCallback(async () => {
    // Only set loading full spinner if we don't have customers yet
    if (customers.length === 0) {
      setLoading(true);
    }
    try {
      const params = {
        page,
        limit,
        search,
        companyName: companyFilter,
        status: statusFilter,
        priority: priorityFilter,
        leadSource: sourceFilter,
        followUpFilter: followUpTab !== 'all' ? followUpTab : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
      };

      if (isAdmin && employeeFilter !== 'all') {
        params.employeeId = employeeFilter;
      }

      const res = await api.get('/customers', { params });
      if (res.data.success) {
        setCustomers(res.data.customers);
        setTotalCount(res.data.total);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.tabCounts) {
          setTabCounts(res.data.tabCounts);
        }
        if (page === 1 && !search && companyFilter === 'all' && statusFilter === 'all' && followUpTab === 'all') {
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(res.data.customers));
          } catch (e) {}
        }
      }
    } catch (error) {
      toast.error('Failed to load customer records.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    search,
    companyFilter,
    statusFilter,
    priorityFilter,
    sourceFilter,
    employeeFilter,
    followUpTab,
    startDate,
    endDate,
    sortBy,
    sortOrder,
    isAdmin,
  ]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Handle Sort Toggle
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setCompanyFilter('all');
    setStatusFilter('all');
    setPriorityFilter('all');
    setSourceFilter('all');
    setEmployeeFilter('all');
    setFollowUpTab('all');
    setStartDate('');
    setEndDate('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  // Export Data
  const handleExport = async (format = 'xlsx') => {
    setExporting(true);
    try {
      if (format === 'pdf') {
        const params = {
          limit: 200,
          companyName: companyFilter !== 'all' ? companyFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
          leadSource: sourceFilter !== 'all' ? sourceFilter : undefined,
          search: search || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        };
        if (isAdmin && employeeFilter !== 'all') {
          params.employeeId = employeeFilter;
        }

        const res = await api.get('/customers', { params });
        const { generateCustomersPdf } = await import('../../utils/pdfGenerator');
        generateCustomersPdf(res.data?.customers || []);
        toast.success('Customer leads exported to PDF successfully!');
        return;
      }

      const params = new URLSearchParams({
        format,
        companyName: companyFilter,
        status: statusFilter,
        priority: priorityFilter,
        leadSource: sourceFilter,
        search,
      });

      if (isAdmin && employeeFilter !== 'all') {
        params.append('employeeId', employeeFilter);
      }
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/import-export/export?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type:
          format === 'csv'
            ? 'text/csv'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customers_export_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Customers exported to ${format.toUpperCase()} successfully!`);
    } catch (error) {
      toast.error('Failed to export customer data.');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  // Delete Customer
  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/customers/${customerToDelete._id}`);
      toast.success(res.data.message || 'Customer deleted successfully.');
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete customer.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-white dark:bg-slate-900/80 p-5 border border-slate-200 dark:border-slate-800 backdrop-blur-xs shadow-xs transition-colors">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            {title}
            <span className="rounded-full bg-indigo-50 dark:bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
              {totalCount} records
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh Button */}
          <button
            onClick={fetchCustomers}
            disabled={loading}
            title="Refresh Data"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button
              disabled={exporting}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors shadow-xs"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export</span>
            </button>
            <div className="absolute right-0 mt-1 hidden group-hover:block w-36 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1 shadow-2xl z-20 animate-fade-in">
              <button
                onClick={() => handleExport('xlsx')}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Excel (.xlsx)
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              >
                <FileDown className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                CSV (.csv)
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              >
                <FileText className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                PDF (.pdf)
              </button>
            </div>
          </div>

          {/* Admin Import Button */}
          {isAdmin && onOpenImportModal && (
            <button
              onClick={onOpenImportModal}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Import Excel</span>
            </button>
          )}

          {/* Add New Customer CTA */}
          {showAddButton && (
            <button
              onClick={() => {
                setCustomerToEdit(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Customer</span>
            </button>
          )}
        </div>
      </div>

      {/* Follow-up Quick Action Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setFollowUpTab('all');
            setPage(1);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            followUpTab === 'all'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span>All Leads</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setFollowUpTab('due_today');
            setPage(1);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            followUpTab === 'due_today'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>⏰ Due Today</span>
          {tabCounts.dueToday > 0 && (
            <span className="rounded-full bg-amber-100 dark:bg-amber-950/80 px-2 py-0.2 text-[10px] font-extrabold text-amber-800 dark:text-amber-300">
              {tabCounts.dueToday}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setFollowUpTab('overdue');
            setPage(1);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            followUpTab === 'overdue'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
          <span>⚠️ Overdue Follow-ups</span>
          {tabCounts.overdue > 0 && (
            <span className="rounded-full bg-rose-100 dark:bg-rose-950/80 px-2 py-0.2 text-[10px] font-extrabold text-rose-800 dark:text-rose-300">
              {tabCounts.overdue}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setFollowUpTab('upcoming');
            setPage(1);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            followUpTab === 'upcoming'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>📅 Upcoming</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5 rounded-2xl bg-white dark:bg-slate-900/60 p-4 border border-slate-200 dark:border-slate-800/80 shadow-xs transition-colors">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, mobile, city, product..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Company / Brand Filter */}
        <div>
          <select
            value={companyFilter}
            onChange={(e) => {
              setCompanyFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">🏢 All Brands</option>
            <option value="SofaShine">🛋️ SofaShine</option>
            <option value="CleanCruisers">🚗 CleanCruisers</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">🎯 All Priorities</option>
            <option value="Hot">🔥 Hot</option>
            <option value="Warm">⚡ Warm</option>
            <option value="Cold">❄️ Cold</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">📊 All Statuses</option>
            <option value="New Lead">New Lead</option>
            <option value="Contacted">Contacted</option>
            <option value="Interested">Interested</option>
            <option value="Not Interested">Not Interested</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
          </select>
        </div>

        {/* Lead Source Filter */}
        <div>
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">🌐 All Sources</option>
            <option value="Website">Website</option>
            <option value="Cold Call">Cold Call</option>
            <option value="Referral">Referral</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Google Ads">Google Ads</option>
            <option value="Walk-in">Walk-in</option>
            <option value="Email Campaign">Email Campaign</option>
            <option value="Exhibition">Exhibition</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Admin Employee Filter */}
        {isAdmin && (
          <div>
            <select
              value={employeeFilter}
              onChange={(e) => {
                setEmployeeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/40 px-3 py-2 text-xs text-indigo-700 dark:text-indigo-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">👤 All Employees</option>
              {employeeList.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reset Filter Button */}
        <div>
          <button
            onClick={handleResetFilters}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Date Range Filter Bar with Quick Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white dark:bg-slate-900/60 px-4 py-2.5 border border-slate-200 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Filter by Registration Date Range:
          </span>
        </div>

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onDateChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
            setPage(1);
          }}
          showPresets={true}
        />
      </div>

      {/* Main Customers Table Container */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th
                  onClick={() => handleSort('date')}
                  className="cursor-pointer px-4 py-3 hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('customerName')}
                  className="cursor-pointer px-4 py-3 hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Customer & Brand</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Contact & Quick Connect</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Product / Service</th>
                <th
                  onClick={() => handleSort('followUpDate')}
                  className="cursor-pointer px-4 py-3 hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Follow-up</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3">Status</th>
                {isAdmin && <th className="px-4 py-3">Assigned Rep</th>}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 10 : 9} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      <p className="text-xs text-slate-400">Loading customer records...</p>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 10 : 9} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <User className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No customer records found</p>
                      <p className="text-xs text-slate-400">
                        Try adjusting your search criteria or add a new customer lead.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Date */}
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {formatDate(c.date)}
                    </td>

                    {/* Customer Name & Brand */}
                    <td className="px-4 py-3">
                      <div>
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(c)}
                          className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline text-left block"
                        >
                          {c.customerName}
                        </button>
                        <div className="mt-1">
                          <CompanyBadge company={c.companyName} />
                        </div>
                      </div>
                    </td>

                    {/* Priority Badge */}
                    <td className="px-4 py-3">
                      <PriorityBadge priority={c.priority} />
                    </td>

                    {/* Contact + Direct Call & WhatsApp Buttons */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="font-mono font-semibold text-slate-900 dark:text-slate-200">
                          {c.mobileNumber}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {/* Direct Call */}
                          <a
                            href={`tel:${c.mobileNumber}`}
                            title="Direct Phone Call"
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-2 py-0.5 text-[11px] font-bold border border-blue-200 dark:border-blue-500/20"
                          >
                            <Phone className="h-3 w-3" />
                            <span>Call</span>
                          </a>

                          {/* Direct WhatsApp */}
                          <button
                            type="button"
                            onClick={() => setCustomerForWhatsApp(c)}
                            title="Send WhatsApp Message"
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-2 py-0.5 text-[11px] font-bold border border-emerald-200 dark:border-emerald-500/20"
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      <div className="font-medium">{c.location}</div>
                      <div className="text-[11px] text-slate-400">
                        {c.city}, {c.state}
                      </div>
                    </td>

                    {/* Product */}
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-[180px] truncate">
                      <span className="font-medium text-slate-900 dark:text-white block truncate">
                        {c.productInterested}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{c.leadSource}</span>
                    </td>

                    {/* Follow-up Date & Time */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-bold text-amber-600 dark:text-amber-400">
                        {formatDate(c.followUpDate)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {c.followUpTime || '11:00 AM'}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      <StatusBadge status={c.followUpStatus} />
                    </td>

                    {/* Assigned Sales Employee (Admin only) */}
                    {isAdmin && (
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <span className="font-medium text-indigo-600 dark:text-indigo-400">
                          {c.salesEmployeeName}
                        </span>
                      </td>
                    )}

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Log Call */}
                        <button
                          type="button"
                          onClick={() => setCustomerForCall(c)}
                          title="Log Call Outcome"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 transition-colors"
                        >
                          <PhoneCall className="h-4 w-4" />
                        </button>

                        {/* View Profile */}
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(c)}
                          title="View Full Profile & Timeline"
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit Customer */}
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerToEdit(c);
                            setIsFormOpen(true);
                          }}
                          title="Edit Customer"
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        {/* Delete Customer */}
                        <button
                          type="button"
                          onClick={() => setCustomerToDelete(c)}
                          title="Delete Customer"
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount} leads
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1 || loading}
              className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-1.5 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <span className="font-semibold text-slate-900 dark:text-white">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages || loading}
              className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-1.5 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Customer Add / Edit Modal */}
      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        customerToEdit={customerToEdit}
        onSuccess={fetchCustomers}
      />

      {/* Customer Detail Profile Modal */}
      <CustomerDetailModal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
        onEdit={(cust) => {
          setSelectedCustomer(null);
          setCustomerToEdit(cust);
          setIsFormOpen(true);
        }}
        onCustomerUpdated={fetchCustomers}
      />

      {/* Quick Action: Log Call Modal */}
      <CallLogModal
        isOpen={!!customerForCall}
        onClose={() => setCustomerForCall(null)}
        customer={customerForCall}
        onCallLogged={fetchCustomers}
      />

      {/* Quick Action: WhatsApp Outreach Modal */}
      <WhatsAppModal
        isOpen={!!customerForWhatsApp}
        onClose={() => setCustomerForWhatsApp(null)}
        customer={customerForWhatsApp}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer Lead"
        message={`Are you sure you want to permanently delete "${customerToDelete?.customerName}" (${customerToDelete?.mobileNumber})? This action cannot be undone.`}
        confirmText="Delete Lead"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
};
