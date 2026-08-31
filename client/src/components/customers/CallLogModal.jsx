import React, { useState } from 'react';
import api from '../../api/axios';
import { PhoneCall, X, Calendar, Clock, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const CallLogModal = ({ isOpen, onClose, customer, onCallLogged }) => {
  if (!isOpen || !customer) return null;

  const [callResult, setCallResult] = useState('Connected');
  const [remarks, setRemarks] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [newStatus, setNewStatus] = useState(customer.followUpStatus || 'Contacted');
  const [newFollowUpDate, setNewFollowUpDate] = useState(
    customer.followUpDate ? new Date(customer.followUpDate).toISOString().split('T')[0] : ''
  );
  const [newFollowUpTime, setNewFollowUpTime] = useState(customer.followUpTime || '11:00 AM');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!remarks.trim()) {
      toast.error('Please enter call notes / remarks.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/calls/${customer._id}`, {
        callResult,
        remarks: remarks.trim(),
        nextAction: nextAction.trim(),
        newStatus,
        newFollowUpDate: newFollowUpDate || undefined,
        newFollowUpTime,
      });

      if (res.data.success) {
        toast.success('Call interaction logged successfully!');
        if (onCallLogged) onCallLogged(res.data.customer);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record call log.');
    } finally {
      setSubmitting(false);
    }
  };

  const callResults = [
    'Connected',
    'Busy',
    'No Answer',
    'Wrong Number',
    'Voicemail',
    'Call Back Later',
  ];

  const statusOptions = [
    'New Lead',
    'Contacted',
    'Interested',
    'Not Interested',
    'Follow-up',
    'Converted',
    'Lost',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-blue-500/10 dark:bg-blue-950/20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Log Call: {customer.customerName}
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-mono font-medium">
                {customer.mobileNumber} ({customer.companyName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Call Result Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Call Result / Outcome *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {callResults.map((res) => (
                <button
                  key={res}
                  type="button"
                  onClick={() => setCallResult(res)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                    callResult === res
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>

          {/* Call Notes / Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Call Discussion Notes *
            </label>
            <textarea
              rows={3}
              required
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="What did the customer say? Discussed pricing, requirements, or objections..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Next Action */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Next Action Plan (Optional)
            </label>
            <input
              type="text"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="e.g. Send revised PDF quote, visit on Saturday..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Update Status & Next Follow-up */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 p-4 border border-slate-200 dark:border-slate-800/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
              Update Lead Status & Follow-up Schedule
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Lead Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Next Follow-up Date
                </label>
                <input
                  type="date"
                  value={newFollowUpDate}
                  onChange={(e) => setNewFollowUpDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Follow-up Time
                </label>
                <input
                  type="text"
                  value={newFollowUpTime}
                  onChange={(e) => setNewFollowUpTime(e.target.value)}
                  placeholder="11:30 AM"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
            >
              <PhoneCall className="h-4 w-4" />
              <span>{submitting ? 'Saving...' : 'Save Call Log'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
