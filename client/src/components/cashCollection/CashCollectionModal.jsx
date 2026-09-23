import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  IndianRupee,
  User,
  Calendar,
  Receipt,
  FileText,
  CheckCircle2,
  Building2,
  TrendingUp,
  TrendingDown,
  Tag,
  MinusCircle,
  PlusCircle,
} from 'lucide-react';

const EXPENSE_CATEGORIES = [
  { id: 'Fuel & Travel', label: '⛽ Fuel & Travel' },
  { id: 'Chemicals & Materials', label: '🧪 Chemicals & Materials' },
  { id: 'Food & Refreshments', label: '🍔 Food & Refreshments' },
  { id: 'Worker Advance / Salary', label: '💼 Worker Advance / Salary' },
  { id: 'Equipment & Vehicle Repair', label: '🔧 Equipment / Vehicle Repair' },
  { id: 'Customer Refund', label: '↩️ Customer Refund' },
  { id: 'Office & Miscellaneous', label: '📦 Office & Miscellaneous' },
];

export const CashCollectionModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialType = 'Collection',
  editData = null,
  employees = [],
}) => {
  const isEditing = Boolean(editData && editData._id);

  const [formData, setFormData] = useState({
    type: initialType || 'Collection',
    category: initialType === 'Expense' ? 'Fuel & Travel' : 'General',
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
    if (isEditing) {
      setFormData({
        type: editData.type || 'Collection',
        category: editData.category || (editData.type === 'Expense' ? 'Fuel & Travel' : 'General'),
        employeeId: editData.employeeId?._id || editData.employeeId || '',
        employeeName: editData.employeeName || editData.employeeId?.name || '',
        date: editData.date
          ? new Date(editData.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        amount: editData.amount || '',
        paymentMode: editData.paymentMode || 'Cash',
        companyName: editData.companyName || 'SofaShine',
        customerReference: editData.customerReference || '',
        receiptNo: editData.receiptNo || '',
        status: editData.status || 'Received',
        notes: editData.notes || '',
      });
    } else {
      const defaultType = initialType === 'Expense' ? 'Expense' : 'Collection';
      setFormData({
        type: defaultType,
        category: defaultType === 'Expense' ? 'Fuel & Travel' : 'General',
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
    }
  }, [editData, initialType, isOpen, isEditing]);

  const isExpense = formData.type === 'Expense';

  const handleNameChange = (nameVal) => {
    const matched = employees.find(
      (e) => e.name.toLowerCase().trim() === nameVal.toLowerCase().trim()
    );
    setFormData((prev) => ({
      ...prev,
      employeeName: nameVal,
      employeeId: matched ? matched._id : '',
    }));
  };

  const handleTypeToggle = (selectedType) => {
    setFormData((prev) => ({
      ...prev,
      type: selectedType,
      category:
        selectedType === 'Expense'
          ? prev.category === 'General'
            ? 'Fuel & Travel'
            : prev.category
          : 'General',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.employeeName || !formData.employeeName.trim()) {
      toast.error(
        isExpense ? 'Please enter Worker / Payee name.' : 'Please enter Worker / Sales Employee name.'
      );
      return;
    }

    const numAmount = Number(formData.amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        amount: numAmount,
      };

      if (isEditing) {
        const res = await api.put(`/cash-collections/${editData._id}`, payload);
        if (res.data.success) {
          toast.success(res.data.message || 'Entry updated successfully!');
          onSuccess();
          onClose();
        }
      } else {
        const res = await api.post('/cash-collections', payload);
        if (res.data.success) {
          toast.success(
            res.data.message ||
              (isExpense ? 'Cash expense recorded & deducted!' : 'Cash collection recorded!')
          );
          onSuccess();
          onClose();
        }
      }
    } catch (err) {
      console.error('Save Cash Entry Error:', err);
      toast.error(err.response?.data?.message || 'Failed to save cash entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? isExpense
            ? '✏️ Edit Cash Expense Entry'
            : '✏️ Edit Cash Collection Entry'
          : isExpense
          ? '🔻 Record Cash Out / Expense (खर्च)'
          : '💵 Record Cash In / Collection (जमा)'
      }
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Transaction Type Selector (Tabs) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Transaction Type (लेन-देन का प्रकार)
          </label>
          <div className="grid grid-cols-2 gap-3 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            {/* Cash In Button */}
            <button
              type="button"
              onClick={() => handleTypeToggle('Collection')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                !isExpense
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PlusCircle className="h-4 w-4" />
              <span>💵 Cash In (Collection / जमा)</span>
            </button>

            {/* Cash Out / Expense Button */}
            <button
              type="button"
              onClick={() => handleTypeToggle('Expense')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                isExpense
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MinusCircle className="h-4 w-4" />
              <span>🔻 Cash Out (Used / खर्च - Minus)</span>
            </button>
          </div>

          {/* Context Banner */}
          <div
            className={`mt-2.5 p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
              isExpense
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {isExpense ? (
              <>
                <TrendingDown className="h-4 w-4 shrink-0 text-rose-500" />
                <span>
                  <strong>Cash Out / Expense:</strong> Yeh amount Total Cash Balance me se{' '}
                  <strong>minus (ghat)</strong> ho jayega.
                </span>
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>
                  <strong>Cash In / Collection:</strong> Yeh amount Worker se mila cash Total Collection me{' '}
                  <strong>add (jud)</strong> ho jayega.
                </span>
              </>
            )}
          </div>
        </div>

        {/* Worker & Date Section */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Worker / Sales Employee Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className={`h-3.5 w-3.5 ${isExpense ? 'text-rose-500' : 'text-indigo-500'}`} />
              {isExpense ? 'Worker / Payee / Spent By' : 'Worker / Sales Employee Name'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                list="workers-list"
                placeholder={
                  isExpense
                    ? 'Worker/Person who spent (e.g. Ramesh, Driver...)'
                    : 'Type worker name (e.g. Ramesh, Suraj...)'
                }
                value={formData.employeeName}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                autoFocus
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <datalist id="workers-list">
                {employees.map((emp) => (
                  <option key={emp._id} value={emp.name} />
                ))}
              </datalist>
            </div>
            {employees.length > 0 && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-slate-400">Quick pick:</span>
                {employees.slice(0, 5).map((emp) => (
                  <button
                    key={emp._id}
                    type="button"
                    onClick={() => handleNameChange(emp.name)}
                    className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 transition-colors"
                  >
                    {emp.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              {isExpense ? 'Expense / Spent Date' : 'Collection Date'}{' '}
              <span className="text-rose-500">*</span>
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

        {/* If Expense: Show Expense Category Selection */}
        {isExpense && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-rose-500" />
              Expense Purpose / Category (खर्च की वजह) <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Amount & Company Brand */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Amount */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <IndianRupee
                className={`h-3.5 w-3.5 ${isExpense ? 'text-rose-500' : 'text-emerald-500'}`}
              />
              {isExpense ? 'Cash Used / Spent Amount (₹)' : 'Amount Collected (₹)'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span
                className={`absolute inset-y-0 left-0 flex items-center pl-3.5 font-bold text-base ${
                  isExpense ? 'text-rose-500' : 'text-emerald-500'
                }`}
              >
                {isExpense ? '- ₹' : '+ ₹'}
              </span>
              <input
                type="number"
                min="1"
                step="any"
                placeholder="e.g. 500"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className={`w-full rounded-xl border pl-10 pr-3.5 py-2.5 text-base font-bold bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 ${
                  isExpense
                    ? 'border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20'
                }`}
              />
            </div>
            {formData.amount && Number(formData.amount) > 0 && (
              <p
                className={`mt-1 text-xs font-bold ${
                  isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {isExpense ? 'Deducting:' : 'Adding:'} {isExpense ? '- ₹' : '+ ₹'}
                {Number(formData.amount).toLocaleString('en-IN')}
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

          {/* Status */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Verification Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Received">✅ Received / Completed</option>
              <option value="Verified">🔒 Verified & Tallied</option>
              <option value="Pending">⏳ Pending Verification</option>
            </select>
          </div>
        </div>

        {/* Receipt No & Customer / Reference */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5 text-slate-400" />
              {isExpense ? 'Bill / Voucher / Receipt #' : 'Receipt / Voucher #'}{' '}
              <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder={isExpense ? 'e.g. PETROL-1029' : 'e.g. REC-84920'}
              value={formData.receiptNo}
              onChange={(e) => setFormData({ ...formData, receiptNo: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              {isExpense ? 'Vendor / Item Details' : 'Customer / Order Ref'}{' '}
              <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder={
                isExpense
                  ? 'e.g. HP Petrol Pump, Shampoo 5L'
                  : 'e.g. Rahul Sharma - Sofa Cleaning'
              }
              value={formData.customerReference}
              onChange={(e) => setFormData({ ...formData, customerReference: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Remarks / Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            {isExpense ? 'Expense Details / Reason' : 'Remarks / Collection Notes'}{' '}
            <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
          </label>
          <textarea
            rows="2"
            placeholder={
              isExpense
                ? 'Describe what the cash was spent on (e.g. purchased cleaning sponge and auto fare for 2 workers)...'
                : 'Add any specific notes regarding this cash collection...'
            }
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
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-50 ${
              isExpense
                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-500/25'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25'
            }`}
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : isEditing ? (
              'Save Changes'
            ) : isExpense ? (
              '🔻 Record Cash Out (Deduct)'
            ) : (
              '💵 Record Cash In (Add)'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
