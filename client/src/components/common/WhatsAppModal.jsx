import React, { useState } from 'react';
import { MessageSquare, X, Send, Copy, ExternalLink, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export const WhatsAppModal = ({ isOpen, onClose, customer }) => {
  if (!isOpen || !customer) return null;

  const cleanPhone = (customer.mobileNumber || '').replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const templates = [
    {
      id: 'intro',
      title: '👋 Introductory Greeting',
      text: `Hello ${customer.customerName}! Thank you for your interest in ${customer.companyName === 'CleanCruisers' ? 'CleanCruisers Car Detailing Services' : 'SofaShine Sofa & Upholstery Deep Cleaning'}. How can we assist you today?`,
    },
    {
      id: 'followup',
      title: '📅 Follow-up Reminder',
      text: `Hi ${customer.customerName}, following up regarding your enquiry for ${customer.productInterested || 'our premium services'}. We have executive slots available this week. Would you like to schedule an appointment?`,
    },
    {
      id: 'quotation',
      title: '📄 Quotation Sharing',
      text: `Dear ${customer.customerName}, please find the pricing quotation and package details for your requirement. Let us know if you have any questions or need customization.`,
    },
    {
      id: 'discount',
      title: '🎁 Special Discount Offer',
      text: `Special offer for ${customer.customerName}! Book your ${customer.companyName} service this week and get an exclusive 15% discount. Reply YES to claim!`,
    },
  ];

  const [message, setMessage] = useState(templates[0].text);
  const [copied, setCopied] = useState(false);

  const handleSelectTemplate = (tmpl) => {
    setMessage(tmpl.text);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${formattedPhone}?text=${encoded}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success('Message text copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-fade-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-emerald-500/10 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                WhatsApp Outreach: {customer.customerName}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                +{formattedPhone}
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

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Predefined Template Quick Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Select Message Template:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTemplate(t)}
                  className="text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>

          {/* Editable Message Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Message Content:
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>
            </div>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Type your WhatsApp message..."
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-950/40">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
          >
            <Send className="h-4 w-4" />
            <span>Open in WhatsApp</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-80" />
          </button>
        </div>
      </div>
    </div>
  );
};
