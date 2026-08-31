import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { UploadCloud, FileSpreadsheet, Download, AlertCircle, CheckCircle2, X } from 'lucide-react';

export const ImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResultSummary(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/import-export/template', { responseType: 'blob' });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'customer_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded!');
    } catch (error) {
      toast.error('Failed to download template.');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select an Excel or CSV file to import.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/import-export/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setResultSummary(res.data.summary);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Import failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResultSummary(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Customers from Excel / CSV" maxWidth="max-w-2xl">
      <div className="space-y-5">
        {/* Step 1 info banner */}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 text-xs">
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Need the correct Excel format?</p>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
              Download our ready-to-use template with predefined column headers.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download Template
          </button>
        </div>

        {/* Upload Dropzone */}
        <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/60 p-8 text-center hover:border-indigo-500 transition-colors">
          <input
            type="file"
            id="file-upload"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
            <div className="p-4 rounded-full bg-indigo-50 dark:bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 mb-3 border border-indigo-200 dark:border-indigo-500/30">
              <UploadCloud className="h-8 w-8" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {file ? file.name : 'Click to upload or drag & drop Excel / CSV file'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports .xlsx, .xls, and .csv files up to 10MB
            </p>
            {file && (
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {(file.size / 1024).toFixed(1)} KB selected
              </span>
            )}
          </label>
        </div>

        {/* Result summary if imported */}
        {resultSummary && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-xs space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200 dark:border-slate-800">
              Import Processing Report
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block text-[10px]">Total Parsed</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{resultSummary.totalRows}</span>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                <span className="text-emerald-700 dark:text-emerald-400 block text-[10px]">Imported</span>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  {resultSummary.importedCount}
                </span>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-500/30">
                <span className="text-amber-700 dark:text-amber-400 block text-[10px]">Skipped Duplicates</span>
                <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                  {resultSummary.duplicatesCount}
                </span>
              </div>
            </div>

            {resultSummary.skippedDuplicates?.length > 0 && (
              <div className="mt-2 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 max-h-24 overflow-y-auto">
                <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1">Skipped Duplicates:</p>
                <ul className="space-y-0.5 text-[11px]">
                  {resultSummary.skippedDuplicates.map((item, idx) => (
                    <li key={idx}>
                      Row {item.row}: {item.customerName} ({item.mobileNumber})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {resultSummary ? 'Done' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:bg-indigo-800 transition-all"
          >
            {uploading ? 'Processing File...' : 'Start Import'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
