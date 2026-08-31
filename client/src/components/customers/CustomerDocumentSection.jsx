import React, { useState } from 'react';
import api from '../../api/axios';
import {
  FileText,
  UploadCloud,
  Trash2,
  Download,
  FileCheck,
  Eye,
  Plus,
  Paperclip,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const CustomerDocumentSection = ({ customer, onCustomerUpdated }) => {
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('Quotation');
  const [selectedFile, setSelectedFile] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const docTypes = ['Quotation', 'Invoice', 'Agreement', 'Payment Proof', 'ID Proof', 'Other'];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('docType', docType);

    setUploading(true);
    try {
      const res = await api.post(`/customers/${customer._id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success('Document uploaded successfully!');
        setSelectedFile(null);
        if (onCustomerUpdated) onCustomerUpdated(res.data.customer);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    setDeletingId(docId);
    try {
      const res = await api.delete(`/customers/${customer._id}/documents/${docId}`);
      if (res.data.success) {
        toast.success('Document deleted.');
        if (onCustomerUpdated) onCustomerUpdated(res.data.customer);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete document.');
    } finally {
      setDeletingId(null);
    }
  };

  const documents = customer?.documents || [];

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <form
        onSubmit={handleUpload}
        className="rounded-2xl border border-dashed border-indigo-300 dark:border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-950/20 p-5 space-y-4"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-300">
          <UploadCloud className="h-4 w-4" />
          <span>Upload Customer Document / Proof</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Document Category
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              {docTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Choose File (PDF, DOCX, JPG, PNG - Max 25MB)
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading || !selectedFile}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <UploadCloud className="h-4 w-4" />
            <span>{uploading ? 'Uploading...' : 'Upload Document'}</span>
          </button>
        </div>
      </form>

      {/* Document List */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Paperclip className="h-3.5 w-3.5 text-indigo-500" />
          <span>Attached Documents ({documents.length})</span>
        </h4>

        {documents.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-6 text-center">
            <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No documents uploaded yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Upload quotations, invoices, or agreements above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                        {doc.docType}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {(doc.fileSize / 1024).toFixed(0)} KB
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-1">
                      {doc.originalName}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Uploaded by {doc.uploaderName || 'Staff'} • {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`http://localhost:5000${doc.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Download / View"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(doc._id)}
                    disabled={deletingId === doc._id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
