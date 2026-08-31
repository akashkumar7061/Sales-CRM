import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  DownloadCloud,
  Database,
  FileSpreadsheet,
  Users,
  PhoneCall,
  Target,
  Clock,
  History,
  Shield,
  FileDown,
  FileText,
  CheckCircle2,
  Calendar,
  Building2,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DateRangePicker } from '../../components/common/DateRangePicker';
import {
  generateCustomersPdf,
  generateCallLogsPdf,
  generateTargetsPdf,
  generateDailyReportsPdf,
  generateActivityLogsPdf,
  generateEmployeesPdf,
  generateMasterCrmPdf,
} from '../../utils/pdfGenerator';

export const DataBackupCenterPage = () => {
  const { user, isAdmin } = useAuth();
  const [downloading, setDownloading] = useState({});

  // Filters for customer export
  const [companyFilter, setCompanyFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1-Click Master Database Excel Backup
  const handleDownloadMasterExcelBackup = async () => {
    setDownloading((prev) => ({ ...prev, master_excel: true }));
    try {
      const response = await api.get('/import-export/backup-all', {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CRM_COMPLETE_MASTER_BACKUP_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Complete CRM Master Excel Backup downloaded!');
    } catch (err) {
      toast.error('Failed to generate full master backup.');
      console.error(err);
    } finally {
      setDownloading((prev) => ({ ...prev, master_excel: false }));
    }
  };

  // 1-Click Master PDF Executive Report
  const handleDownloadMasterPdf = async () => {
    setDownloading((prev) => ({ ...prev, master_pdf: true }));
    try {
      toast.loading('Generating Executive Master PDF Report...', { id: 'master_pdf' });
      await generateMasterCrmPdf(api);
      toast.success('Executive Master PDF downloaded successfully!', { id: 'master_pdf' });
    } catch (err) {
      toast.error('Failed to generate Master PDF.', { id: 'master_pdf' });
    } finally {
      setDownloading((prev) => ({ ...prev, master_pdf: false }));
    }
  };

  // Module Specific Export (Excel, CSV, or PDF)
  const handleExportModule = async (moduleName, format = 'xlsx') => {
    const key = `${moduleName}_${format}`;
    setDownloading((prev) => ({ ...prev, [key]: true }));

    try {
      if (format === 'pdf') {
        toast.loading(`Generating ${moduleName.toUpperCase()} PDF...`, { id: key });

        switch (moduleName) {
          case 'customers': {
            const params = {
              limit: 200,
              companyName: companyFilter !== 'all' ? companyFilter : undefined,
              startDate: startDate || undefined,
              endDate: endDate || undefined,
            };
            const res = await api.get('/customers', { params });
            generateCustomersPdf(res.data?.customers || []);
            break;
          }
          case 'calls': {
            const res = await api.get('/calls/recent?limit=200');
            generateCallLogsPdf(res.data?.calls || []);
            break;
          }
          case 'targets': {
            const res = await api.get('/targets/all');
            generateTargetsPdf(res.data?.targets || [], res.data?.month);
            break;
          }
          case 'reports': {
            const endpoint = isAdmin ? '/reports/all?limit=200' : '/reports/my-reports?limit=200';
            const res = await api.get(endpoint);
            generateDailyReportsPdf(res.data?.reports || []);
            break;
          }
          case 'logs': {
            const res = await api.get('/audit-logs?limit=200');
            generateActivityLogsPdf(res.data?.logs || []);
            break;
          }
          case 'employees': {
            const res = await api.get('/employees/active-list');
            generateEmployeesPdf(res.data?.employees || []);
            break;
          }
          default:
            break;
        }

        toast.success(`${moduleName.toUpperCase()} PDF generated!`, { id: key });
      } else {
        // Excel or CSV
        let endpoint = `/import-export/export-module?module=${moduleName}&format=${format}`;

        if (moduleName === 'customers') {
          const params = new URLSearchParams({ format });
          if (companyFilter !== 'all') params.append('companyName', companyFilter);
          if (startDate) params.append('startDate', startDate);
          if (endDate) params.append('endDate', endDate);
          endpoint = `/import-export/export?${params.toString()}`;
        }

        const response = await api.get(endpoint, { responseType: 'blob' });
        const blob = new Blob([response.data], {
          type:
            format === 'csv'
              ? 'text/csv'
              : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${moduleName}_export_${Date.now()}.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success(`${moduleName.toUpperCase()} ${format.toUpperCase()} downloaded!`);
      }
    } catch (err) {
      toast.error(`Failed to export ${moduleName} data.`, { id: key });
      console.error(err);
    } finally {
      setDownloading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const modules = [
    {
      id: 'customers',
      title: 'Customers & Leads Master',
      desc: 'All customer contact info, requirements, brand (SofaShine/CleanCruisers), priority, statuses, follow-up dates & sales rep assignments.',
      icon: Users,
    },
    {
      id: 'calls',
      title: 'Call History & Phone Records',
      desc: 'Complete log of calls made by sales reps, outcomes (Connected, Busy, No Answer), detailed notes, next actions, and reschedule timestamps.',
      icon: PhoneCall,
    },
    {
      id: 'targets',
      title: 'Sales Targets & Quotas',
      desc: 'Monthly & daily quotas for leads, calls, and conversions closed for every employee with manager notes and achievement metrics.',
      icon: Target,
      adminOnly: true,
    },
    {
      id: 'reports',
      title: 'Daily Attendance & Work Reports',
      desc: 'Daily clock-in/out timestamps, attendance status (Present, Half Day, WFH), total calls made, leads added, and end-of-day remarks.',
      icon: Clock,
    },
    {
      id: 'logs',
      title: 'System Activity & Audit Logs',
      desc: 'Full security audit trail of customer additions, edits, deletions, target updates, attendance submissions, and login actions.',
      icon: History,
      adminOnly: true,
    },
    {
      id: 'employees',
      title: 'Employees & Users Directory',
      desc: 'Complete list of registered sales reps, email addresses, phone numbers, designations, roles, and account approval statuses.',
      icon: Shield,
      adminOnly: true,
    },
  ];

  const visibleModules = isAdmin ? modules : modules.filter((m) => !m.adminOnly);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-50 dark:from-indigo-950/80 via-white dark:via-slate-900 to-slate-50 dark:to-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <DownloadCloud className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Data Backup & Export Center
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Download CRM database backups in <strong>Excel (.xlsx)</strong>, <strong>CSV (.csv)</strong>, and <strong>PDF (.pdf)</strong> formats.
              </p>
            </div>
          </div>
        </div>

        {/* Master Backup Buttons (Admin) */}
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Master Excel */}
            <button
              type="button"
              onClick={handleDownloadMasterExcelBackup}
              disabled={downloading.master_excel}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/25 active:scale-95 transition-all"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>
                {downloading.master_excel ? 'Generating...' : '📦 Master Excel (.xlsx)'}
              </span>
            </button>

            {/* Master PDF */}
            <button
              type="button"
              onClick={handleDownloadMasterPdf}
              disabled={downloading.master_pdf}
              className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/25 active:scale-95 transition-all"
            >
              <FileText className="h-4 w-4" />
              <span>
                {downloading.master_pdf ? 'Generating...' : '📑 Master Report (.pdf)'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Master Backup Highlight Box */}
      {isAdmin && (
        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/20 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Full System Multi-Format Backup Options</span>
            </h3>
            <p className="text-xs text-indigo-700 dark:text-indigo-300">
              Download the entire CRM database across 6 datasets: <strong>Customers</strong>, <strong>Call History</strong>, <strong>Sales Targets</strong>, <strong>Daily Attendance</strong>, <strong>Audit Logs</strong>, and <strong>Employees</strong> in Excel or printable PDF format.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadMasterExcelBackup}
              disabled={downloading.master_excel}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-xs hover:bg-emerald-50 transition-all"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span>Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadMasterPdf}
              disabled={downloading.master_pdf}
              className="flex items-center gap-1.5 rounded-xl border border-rose-300 dark:border-rose-500/40 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 shadow-xs hover:bg-rose-50 transition-all"
            >
              <FileText className="h-3.5 w-3.5 text-rose-600" />
              <span>PDF (.pdf)</span>
            </button>
          </div>
        </div>
      )}

      {/* Optional Filters for Customer Leads */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-500" />
          <span>Filters for Leads Export</span>
        </h3>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="w-full md:w-72">
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Business / Brand Filter
            </label>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:outline-none font-semibold"
            >
              <option value="all">🏢 All Brands (SofaShine & CleanCruisers)</option>
              <option value="SofaShine">🛋️ SofaShine Only</option>
              <option value="CleanCruisers">🚗 CleanCruisers Only</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Registration Date Range (Optional)
            </label>
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
        </div>
      </div>

      {/* Modular Export Cards Grid with Excel, CSV, and PDF options */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Individual Module Downloads (Excel, CSV & PDF)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleModules.map((mod) => {
            const Icon = mod.icon;
            const isXlsxLoading = downloading[`${mod.id}_xlsx`];
            const isCsvLoading = downloading[`${mod.id}_csv`];
            const isPdfLoading = downloading[`${mod.id}_pdf`];

            return (
              <div
                key={mod.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between space-y-4 shadow-xs hover:border-indigo-500/40 transition-all"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {mod.title}
                      </h4>
                      {mod.adminOnly && (
                        <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">
                          Admin Level Access
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>

                {/* 3 Download Action Buttons: Excel, CSV, PDF */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {/* Excel */}
                  <button
                    type="button"
                    disabled={isXlsxLoading || isCsvLoading || isPdfLoading}
                    onClick={() => handleExportModule(mod.id, 'xlsx')}
                    title="Download Excel Workbook"
                    className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 transition-all"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{isXlsxLoading ? '...' : 'Excel'}</span>
                  </button>

                  {/* CSV */}
                  <button
                    type="button"
                    disabled={isXlsxLoading || isCsvLoading || isPdfLoading}
                    onClick={() => handleExportModule(mod.id, 'csv')}
                    title="Download CSV File"
                    className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-950/40 dark:hover:text-blue-300 transition-all"
                  >
                    <FileDown className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{isCsvLoading ? '...' : 'CSV'}</span>
                  </button>

                  {/* PDF */}
                  <button
                    type="button"
                    disabled={isXlsxLoading || isCsvLoading || isPdfLoading}
                    onClick={() => handleExportModule(mod.id, 'pdf')}
                    title="Download Printable PDF Document"
                    className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 transition-all"
                  >
                    <FileText className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                    <span>{isPdfLoading ? '...' : 'PDF'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
