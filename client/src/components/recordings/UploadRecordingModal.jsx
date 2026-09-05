import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import api from '../../api/axios';
import { Mic, UploadCloud, Music, Trash2, Search, User, Phone, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const UploadRecordingModal = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState('direct'); // 'direct' (enter details) or 'select' (pick from list)
  const [directName, setDirectName] = useState('');
  const [directPhone, setDirectPhone] = useState('');
  const [directCompany, setDirectCompany] = useState('SofaShine');
  const [directProduct, setDirectProduct] = useState('');

  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [callResult, setCallResult] = useState('Connected');
  const [remarks, setRemarks] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      api.get('/customers', { params: { limit: 100 } })
        .then((res) => {
          if (res.data.success) {
            setCustomers(res.data.customers || []);
          }
        })
        .catch((err) => console.error('Failed to load customers for recording upload:', err));
    }
  }, [isOpen]);

  const filteredCustomers = customers.filter(
    (c) =>
      c.customerName.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.mobileNumber.includes(customerSearch) ||
      (c.companyName && c.companyName.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Audio file size must be less than 50MB.');
        return;
      }
      setAudioFile(file);
      setAudioPreviewUrl(URL.createObjectURL(file));
      toast.success(`Audio attached: ${file.name}`);
    }
  };

  const handleRemoveAudio = () => {
    setAudioFile(null);
    setAudioPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetForm = () => {
    setDirectName('');
    setDirectPhone('');
    setDirectCompany('SofaShine');
    setDirectProduct('');
    setSelectedCustomer(null);
    setCustomerSearch('');
    setRemarks('');
    setCallResult('Connected');
    setMode('direct');
    handleRemoveAudio();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'direct') {
      if (!directName.trim()) {
        toast.error('Please enter Customer Name.');
        return;
      }
      if (!directPhone.trim() || directPhone.trim().length < 10) {
        toast.error('Please enter a valid 10-digit customer mobile number.');
        return;
      }
    } else {
      if (!selectedCustomer) {
        toast.error('Please select an existing customer.');
        return;
      }
    }

    if (!audioFile) {
      toast.error('Please attach an audio recording file (.mp3, .wav, .m4a, etc.).');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (mode === 'direct') {
        formData.append('customerName', directName.trim());
        formData.append('mobileNumber', directPhone.trim());
        formData.append('companyName', directCompany);
        if (directProduct.trim()) formData.append('productInterested', directProduct.trim());
      } else {
        formData.append('customerId', selectedCustomer._id);
      }

      formData.append('callResult', callResult);
      formData.append('remarks', remarks.trim() || `Customer call recording (${callResult})`);
      formData.append('audio', audioFile);

      const res = await api.post('/calls/upload-recording', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success('Call recording uploaded successfully!');
        if (onSuccess) onSuccess(res.data);
        handleClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload call recording.');
    } finally {
      setLoading(false);
    }
  };

  const callResults = ['Connected', 'Interested', 'Call Back Later', 'Busy', 'Voicemail'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Customer Call Recording"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toggle Mode: Direct Details vs Select Existing */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setMode('direct')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'direct'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ✍️ Enter Customer Info
          </button>
          <button
            type="button"
            onClick={() => setMode('select')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'select'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🔍 Choose Existing Customer
          </button>
        </div>

        {/* Option 1: Direct Customer Details (No search needed) */}
        {mode === 'direct' ? (
          <div className="space-y-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 p-3.5 border border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Malhotra"
                  value={directName}
                  onChange={(e) => setDirectName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Mobile <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={directPhone}
                  onChange={(e) => setDirectPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Brand
                </label>
                <select
                  value={directCompany}
                  onChange={(e) => setDirectCompany(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white font-semibold focus:border-indigo-500 focus:outline-none"
                >
                  <option value="SofaShine">🛋️ SofaShine</option>
                  <option value="CleanCruisers">🚗 CleanCruisers</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product / Service (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sofa Cleaning"
                  value={directProduct}
                  onChange={(e) => setDirectProduct(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Option 2: Select Existing Customer */
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Customer <span className="text-rose-500">*</span>
            </label>
            {selectedCustomer ? (
              <div className="flex items-center justify-between rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/40 p-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold shrink-0">
                    {selectedCustomer.customerName.charAt(0)}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {selectedCustomer.customerName}
                    </p>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                      {selectedCustomer.mobileNumber} • {selectedCustomer.companyName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="text-xs text-rose-500 hover:underline font-semibold shrink-0 ml-2"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search customer by name or phone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCustomers.length === 0 ? (
                    <p className="p-3 text-center text-xs text-slate-400">No matching customer found.</p>
                  ) : (
                    filteredCustomers.slice(0, 10).map((c) => (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerSearch('');
                        }}
                        className="w-full flex items-center justify-between p-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                      >
                        <div className="truncate">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {c.customerName}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono ml-2">
                            {c.mobileNumber}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                          {c.companyName}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Call Result */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Call Outcome
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {callResults.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setCallResult(r)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                  callResult === r
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Audio Recording File Upload */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Audio File <span className="text-rose-500">* (.mp3, .wav, .m4a, .aac, .ogg)</span>
          </label>
          <input
            type="file"
            ref={fileInputRef}
            accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.webm,.amr,.3gp"
            onChange={handleAudioChange}
            className="hidden"
          />

          {!audioFile ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-500/40 bg-indigo-50/30 dark:bg-indigo-950/20 p-4 text-xs text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50/70 transition-all cursor-pointer"
            >
              <UploadCloud className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span className="font-bold">Select Audio File to Upload</span>
              <span className="text-[10px] text-slate-400">Max file size 50MB</span>
            </button>
          ) : (
            <div className="space-y-2 rounded-xl bg-slate-50 dark:bg-slate-950 p-3 border border-indigo-200 dark:border-indigo-500/30">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                  <Music className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span className="truncate">{audioFile.name}</span>
                </span>
                <button
                  type="button"
                  onClick={handleRemoveAudio}
                  className="text-rose-500 hover:text-rose-600 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {audioPreviewUrl && (
                <audio controls src={audioPreviewUrl} className="w-full h-8" />
              )}
            </div>
          )}
        </div>

        {/* Discussion Remarks */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Discussion Summary / Notes
          </label>
          <textarea
            rows={2}
            placeholder="Key points discussed during the phone call..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:bg-indigo-800 transition-all"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Mic className="h-4 w-4" />
                <span>Upload Recording</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
