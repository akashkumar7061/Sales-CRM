import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { IndianRupee, User, Calendar, Receipt, FileText, CheckCircle2, ShieldAlert, Sparkles, Building2 } from 'lucide-react';

export const CashCollectionModal = ({ isOpen, onClose, onSuccess, editData = null, employees = [] }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    paymentMode: 'Cash',
    companyName: 'SofaShine',
    customerReference: '',
    receiptNo: '',
    status: 'Received',
    notes: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        employeeId: editData.employeeId?._id || editData.employeeId || '',
        employeeName: editData.employeeName || editData.employeeId?.name || '',
        date: editData.date ? new Date(editData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        amount: editData.amount || '',
        paymentMode: editData.paymentMode || 'Cash',
        companyName: editData.companyName || 'SofaShine',
        customerReference: editData.customerReference || '',
        receiptNo: editData.receiptNo || '',
        status: editData.status || 'Received',
        notes: editData.notes || '',
      });
    } else {
      setFormData({
        employeeId: employees.length > 0 ? employees[0]._id : '',
        employeeName: employees.length > 0 ? employees[0].name : '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        paymentMode: 'Cash',
        companyName: 'SofaShine',
        customerReference: '',
        receiptNo: '',
        status: 'Received',
        notes: '',
      });
    }
  }, [editData, isOpen, employees]);

  const handleEmployeeChange = (e) => {
    const selectedId = e.target.value;
    const emp = employees.find((u) => u._id === selectedId);
    setFormData((prev) => ({
      ...prev,
      employeeId: selectedId,
      employeeName: emp ? emp.name : '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.employeeId) {
      toast.error('Please select a worker / sales employee.');
      return;
    }

    const numAmount = Number(formData.amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid collection amount.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        amount: numAmount,
      };

      if (editData) {
        const res = await api.put(`/cash-collections/${editData._id}`, payload);
        if (res.data.success) {
          toast.success(res.data.message || 'Collection entry updated successfully!');
          onSuccess();
          onClose();
        }
      } else {
        const res = await api.post('/cash-collections', payload);
        if (res.data.success) {
          toast.success(res.data.message || 'Cash collection recorded successfully!');
          onSuccess();
          onClose();
        }
      }
    } catch (err) {
      console.error('Save Collection Error:', err);
      toast.error(err.response?.data?.message || 'Failed to save cash collection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? '✏️ Edit Cash Collection Entry' : '💵 Record Daily Cash Collection'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Worker & Date Section */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Worker / Sales Employee Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-indigo-500" />
              Worker / Sales Employee <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.employeeId}
              onChange={handleEmployeeChange}
              required
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="" disabled>-- Select Worker / Employee --</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.role === 'admin' ? 'Admin' : 'Worker/Sales'})
                </option>
              ))}
            </select>
          </div>

          {/* Collection Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              Collection Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Amount & Company Brand */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Amount Collected */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5 text-emerald-500" />
              Amount Collected (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 font-bold text-base">
                ₹
              </span>
              <input
                type="number"
                min="1"
                step="any"
                placeholder="e.g. 2500"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-8 pr-3.5 py-2.5 text-base font-bold text-emerald-600 dark:text-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            {formData.amount && Number(formData.amount) > 0 && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                Amount: ₹{Number(formData.amount).toLocaleString('en-IN')}
              </p>
            )}
          </div>

          {/* Company / Brand */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-indigo-500" />
              Company / Brand <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['SofaShine', 'CleanCruisers'].map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setFormData({ ...formData, companyName: brand })}
                  className={`rounded-xl py-2.5 px-3 text-xs font-bold border transition-all text-center ${
                    formData.companyName === brand
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Mode & Status */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Payment Mode
            </label>
            <select
              value={formData.paymentMode}
              onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Cash">💵 Cash</option>
              <option value="UPI">📱 UPI (GPay / PhonePe / Paytm)</option>
              <option value="Bank Deposit">🏦 Bank Deposit / NetBanking</option>
              <option value="Cheque">📜 Cheque</option>
              <option value="Other">💳 Other</option>
            </select>
          </div>

          {/* Collection Status */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Verification Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Received">✅ Received</option>
              <option value="Verified">🔒 Verified & Tallied</option>
              <option value="Pending">⏳ Pending Verification</option>
            </select>
          </div>
        </div>

        {/* Receipt No & Customer Reference */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5 text-slate-400" />
              Receipt / Voucher # <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. REC-84920"
              value={formData.receiptNo}
              onChange={(e) => setFormData({ ...formData, receiptNo: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              Customer / Order Ref <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma - Sofa Cleaning"
              value={formData.customerReference}
              onChange={(e) => setFormData({ ...formData, customerReference: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Remarks / Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Remarks / Collection Notes <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
          </label>
          <textarea
            rows="2"
            placeholder="Add any specific notes regarding this cash collection (e.g. given in envelope at 7 PM)..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : editData ? (
              'Save Changes'
            ) : (
              'Record Collection'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
