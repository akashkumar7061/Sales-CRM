import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { StatusBadge, CompanyBadge, PriorityBadge } from '../common/Badge';
import { CustomerTimelineTab } from './CustomerTimelineTab';
import { CustomerDocumentSection } from './CustomerDocumentSection';
import { CallLogModal } from './CallLogModal';
import { WhatsAppModal } from '../common/WhatsAppModal';
import { AudioPlayer } from '../common/AudioPlayer';
import api from '../../api/axios';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  FileText,
  Clock,
  Building,
  Tag,
  Edit2,
  PhoneCall,
  MessageSquare,
  Paperclip,
  History,
  Layers,
  Flame,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const CustomerDetailModal = ({ isOpen, onClose, customer: initialCustomer, onEdit, onCustomerUpdated }) => {
  const [customer, setCustomer] = useState(initialCustomer);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'calls' | 'timeline' | 'documents'
  const [calls, setCalls] = useState([]);
  const [loadingCalls, setLoadingCalls] = useState(false);

  // Modals for quick actions
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  useEffect(() => {
    setCustomer(initialCustomer);
  }, [initialCustomer]);

  const fetchCalls = async () => {
    if (!customer?._id) return;
    setLoadingCalls(true);
    try {
      const res = await api.get(`/calls/${customer._id}`);
      if (res.data.success) {
        setCalls(res.data.calls || []);
      }
    } catch (err) {
      console.error('Failed to fetch call history:', err);
    } finally {
      setLoadingCalls(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'calls' && customer?._id) {
      fetchCalls();
    }
  }, [activeTab, customer?._id]);

  if (!customer) return null;

  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleCallLogged = (updatedCust) => {
    setCustomer(updatedCust);
    if (onCustomerUpdated) onCustomerUpdated(updatedCust);
    fetchCalls();
  };

  const handleDocumentUpdated = (updatedCust) => {
    setCustomer(updatedCust);
    if (onCustomerUpdated) onCustomerUpdated(updatedCust);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Customer Profile" maxWidth="max-w-4xl">
        <div className="space-y-5">
          {/* Header Info Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-slate-50 dark:bg-slate-950 p-5 border border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {customer.customerName}
                </h2>
                <CompanyBadge company={customer.companyName} />
                <PriorityBadge priority={customer.priority} />
                <StatusBadge status={customer.followUpStatus} />
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{customer.productInterested}</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <MapPin className="h-3 w-3 text-amber-500" />
                <span>{customer.location}, {customer.city}</span>
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`tel:${customer.mobileNumber}`}
                className="flex items-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/30 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all shadow-xs"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Call</span>
              </a>

              <button
                type="button"
                onClick={() => setIsWhatsAppOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all shadow-xs"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCallModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Log Call</span>
              </button>

              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(customer);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'overview'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('calls')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'calls'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PhoneCall className="h-4 w-4" />
              <span>Call History</span>
              {calls.length > 0 && (
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.2 text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                  {calls.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'timeline'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="h-4 w-4" />
              <span>Timeline ({customer.timeline?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'documents'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Paperclip className="h-4 w-4" />
              <span>Documents ({customer.documents?.length || 0})</span>
            </button>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contact Information */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Contact Information</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Mobile Number:</span>
                    <a
                      href={`tel:${customer.mobileNumber}`}
                      className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      {customer.mobileNumber}
                    </a>
                  </div>

                  {customer.altMobileNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">Alternate Mobile:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {customer.altMobileNumber}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Email Address:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {customer.email || 'Not provided'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Lead Source:</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {customer.leadSource}
                    </span>
                  </div>
                </div>
              </div>

              {/* Follow-up & Management */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span>Follow-up & Schedule</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Follow-up Date:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {formatDate(customer.followUpDate)} ({customer.followUpTime || '11:00 AM'})
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Lead Priority:</span>
                    <PriorityBadge priority={customer.priority} />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Assigned Sales Executive:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {customer.salesEmployeeName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Record Created Date:</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {formatDate(customer.date)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location & Address */}
              <div className="md:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-rose-500" />
                  <span>Address & Service Location</span>
                </h4>
                <p className="text-xs text-slate-800 dark:text-slate-200">
                  <span className="font-semibold">{customer.location}, {customer.city}, {customer.state}</span>
                  {customer.fullAddress ? ` — ${customer.fullAddress}` : ''}
                </p>
              </div>

              {/* Requirement & Remarks */}
              <div className="md:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-blue-500" />
                  <span>Customer Requirements & Interaction Remarks</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Requirements:</span>
                    <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed min-h-[50px]">
                      {customer.customerRequirement || 'No custom requirement specified.'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Remarks / Internal Notes:</span>
                    <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed min-h-[50px]">
                      {customer.remarks || 'No remarks recorded.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Call History */}
          {activeTab === 'calls' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Logged Call Interactions ({calls.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setIsCallModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Log New Call</span>
                </button>
              </div>

              {loadingCalls ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                </div>
              ) : calls.length === 0 ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-8 text-center">
                  <PhoneCall className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No calls recorded yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click "Log New Call" to record a call outcome.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {calls.map((call) => (
                    <div
                      key={call._id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2 shadow-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              call.callResult === 'Connected'
                                ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            📞 {call.callResult}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            by {call.salesEmployeeName}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {formatDate(call.callDate)} at {call.callTime}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                        {call.remarks}
                      </p>

                      {call.recordingUrl && (
                        <div className="pt-1">
                          <AudioPlayer
                            src={call.recordingUrl}
                            fileName={call.recordingFileName || 'Call_Recording.mp3'}
                            durationHint={call.recordingDuration}
                          />
                        </div>
                      )}

                      {call.nextAction && (
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                          <strong>Next Action:</strong> {call.nextAction}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Timeline */}
          {activeTab === 'timeline' && <CustomerTimelineTab customer={customer} />}

          {/* Tab 4: Documents */}
          {activeTab === 'documents' && (
            <CustomerDocumentSection customer={customer} onCustomerUpdated={handleDocumentUpdated} />
          )}

          {/* Close Footer */}
          <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-100 dark:bg-slate-800 px-5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Close Window
            </button>
          </div>
        </div>
      </Modal>

      {/* Embedded WhatsApp Dialog */}
      <WhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        customer={customer}
      />

      {/* Embedded Call Log Dialog */}
      <CallLogModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        customer={customer}
        onCallLogged={handleCallLogged}
      />
    </>
  );
};
