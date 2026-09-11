import React, { useState, useRef } from 'react';
import api from '../../api/axios';
import { PhoneCall, X, Calendar, Clock, CheckCircle2, FileText, ArrowRight, Mic, UploadCloud, Music, Trash2 } from 'lucide-react';
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
  
  // Audio Recording State
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('');
  const [recordingDuration, setRecordingDuration] = useState('');
  const fileInputRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Audio file size must be less than 50MB.');
        return;
      }
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioPreviewUrl(url);

      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          const totalSecs = Math.round(audio.duration);
          const mins = Math.floor(totalSecs / 60);
          const secs = totalSecs % 60;
          setRecordingDuration(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
        }
      };

      toast.success(`Audio attached: ${file.name}`);
    }
  };

  const handleRemoveAudio = () => {
    setAudioFile(null);
    setAudioPreviewUrl('');
    setRecordingDuration('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!remarks.trim()) {
      toast.error('Please enter call notes / remarks.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('callResult', callResult);
      formData.append('remarks', remarks.trim());
      formData.append('nextAction', nextAction.trim());
      formData.append('newStatus', newStatus);
      if (newFollowUpDate) formData.append('newFollowUpDate', newFollowUpDate);
      if (newFollowUpTime) formData.append('newFollowUpTime', newFollowUpTime);
      if (recordingDuration) formData.append('recordingDuration', recordingDuration);

      if (audioFile) {
        formData.append('audio', audioFile);
      }

      const res = await api.post(`/calls/${customer._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success(audioFile ? 'Call log & audio recording uploaded!' : 'Call interaction logged successfully!');
        if (onCallLogged) onCallLogged(res.data.customer);
        handleRemoveAudio();
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
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-blue-500/10 dark:bg-blue-950/20 shrink-0">
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
            onClick={() => {
              handleRemoveAudio();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body with Scroll */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
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

          {/* Audio Call Recording Upload Box */}
          <div className="rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 p-3.5 border border-indigo-200 dark:border-indigo-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <Mic className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Attach Call Audio Recording (Optional)</span>
              </label>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                MP3, WAV, M4A, OGG, AAC (Max 50MB)
              </span>
            </div>

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
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-500/40 bg-white/70 dark:bg-slate-900/60 p-3 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/40 transition-all cursor-pointer"
              >
                <UploadCloud className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Click to Browse & Upload Audio Recording</span>
              </button>
            ) : (
              <div className="space-y-2 rounded-xl bg-white dark:bg-slate-900 p-3 border border-indigo-200 dark:border-indigo-500/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                    <Music className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span className="truncate">{audioFile.name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveAudio}
                    className="text-rose-500 hover:text-rose-600 p-1 transition-colors"
                    title="Remove audio"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {audioPreviewUrl && (
                  <audio controls src={audioPreviewUrl} className="w-full h-8 mt-1" />
                )}
              </div>
            )}
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
                  Next Follow-up Date (Optional)
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
              onClick={() => {
                handleRemoveAudio();
                onClose();
              }}
              className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:bg-blue-800"
            >
              <PhoneCall className="h-4 w-4" />
              <span>{submitting ? 'Uploading...' : audioFile ? 'Save Call & Upload Recording' : 'Save Call Log'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
