import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Lock,
  AlertCircle,
  CheckCircle2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Tag,
  Briefcase,
  Flame,
  Clock,
  ExternalLink,
} from 'lucide-react';

const LEAD_SOURCES = [
  'Website',
  'Cold Call',
  'Referral',
  'LinkedIn',
  'Google Ads',
  'Walk-in',
  'Email Campaign',
  'Exhibition',
  'Other',
];

const FOLLOWUP_STATUSES = [
  'New Lead',
  'Contacted',
  'Interested',
  'Not Interested',
  'Follow-up',
  'Converted',
  'Lost',
];

const PRIORITIES = [
  { id: 'Hot', label: '🔥 Hot Priority', desc: 'High intent / Immediate deal' },
  { id: 'Warm', label: '⚡ Warm Priority', desc: 'Active discussion / Follow-up' },
  { id: 'Cold', label: '❄️ Cold Priority', desc: 'Low urgency / Long term' },
];

export const CustomerFormModal = ({ isOpen, onClose, customerToEdit, onSuccess }) => {
  const { user, isAdmin } = useAuth();
  const isEditing = !!customerToEdit;

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    companyName: 'SofaShine',
    priority: 'Warm',
    mobileNumber: '',
    altMobileNumber: '',
    email: '',
    location: '',
    fullAddress: '',
    city: '',
    state: '',
    productInterested: '',
    leadSource: 'Website',
    customerRequirement: '',
    followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    followUpTime: '11:00 AM',
    followUpStatus: 'New Lead',
    remarks: '',
    assignedEmployeeId: '',
  });

  const [employees, setEmployees] = useState([]);
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [checkingMobile, setCheckingMobile] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch employee list for admin dropdown
  useEffect(() => {
    if (isAdmin && isOpen) {
      api.get('/employees/active-list')
        .then((res) => {
          if (res.data.success) {
            setEmployees(res.data.employees);
          }
        })
        .catch((err) => console.error('Failed to load employees:', err));
    }
  }, [isAdmin, isOpen]);

  // Populate form if editing
  useEffect(() => {
    if (customerToEdit) {
      setFormData({
        date: customerToEdit.date ? new Date(customerToEdit.date).toISOString().split('T')[0] : '',
        customerName: customerToEdit.customerName || '',
        companyName: customerToEdit.companyName || 'SofaShine',
        priority: customerToEdit.priority || 'Warm',
        mobileNumber: customerToEdit.mobileNumber || '',
        altMobileNumber: customerToEdit.altMobileNumber || '',
        email: customerToEdit.email || '',
        location: customerToEdit.location || '',
        fullAddress: customerToEdit.fullAddress || '',
        city: customerToEdit.city || '',
        state: customerToEdit.state || '',
        productInterested: customerToEdit.productInterested || '',
        leadSource: customerToEdit.leadSource || 'Website',
        customerRequirement: customerToEdit.customerRequirement || '',
        followUpDate: customerToEdit.followUpDate ? new Date(customerToEdit.followUpDate).toISOString().split('T')[0] : '',
        followUpTime: customerToEdit.followUpTime || '11:00 AM',
        followUpStatus: customerToEdit.followUpStatus || 'New Lead',
        remarks: customerToEdit.remarks || '',
        assignedEmployeeId: customerToEdit.createdByEmployeeId?._id || customerToEdit.createdByEmployeeId || '',
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        customerName: '',
        companyName: 'SofaShine',
        priority: 'Warm',
        mobileNumber: '',
        altMobileNumber: '',
        email: '',
        location: '',
        fullAddress: '',
        city: '',
        state: '',
        productInterested: '',
        leadSource: 'Website',
        customerRequirement: '',
        followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        followUpTime: '11:00 AM',
        followUpStatus: 'New Lead',
        remarks: '',
        assignedEmployeeId: user?.id || '',
      });
    }
    setDuplicateInfo(null);
    setErrors({});
  }, [customerToEdit, isOpen, user]);

  // Check duplicate mobile number
  const handleMobileBlur = async () => {
    const mobile = formData.mobileNumber.trim();
    if (!mobile || mobile.length < 10) return;

    setCheckingMobile(true);
    try {
      const res = await api.post('/customers/check-duplicate', {
        mobileNumber: mobile,
        excludeId: customerToEdit?._id,
      });

      if (res.data.isDuplicate) {
        setDuplicateInfo(res.data.customer);
      } else {
        setDuplicateInfo(null);
      }
    } catch (err) {
      console.error('Duplicate check failed:', err);
    } finally {
      setCheckingMobile(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.customerName.trim()) errs.customerName = 'Customer Name is required';
    if (!formData.mobileNumber.trim()) {
      errs.mobileNumber = 'Mobile Number is required';
    } else if (!/^\+?[0-9\s-]{10,15}$/.test(formData.mobileNumber.trim())) {
      errs.mobileNumber = 'Please enter a valid 10-15 digit mobile number';
    }
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.productInterested.trim()) errs.productInterested = 'Product / Service is required';
    if (!formData.followUpDate) errs.followUpDate = 'Follow-up Date is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please resolve validation errors before saving.');
      return;
    }

    if (duplicateInfo && !isEditing) {
      toast.error('Cannot save: Duplicate lead already exists in CRM.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        const res = await api.put(`/customers/${customerToEdit._id}`, formData);
        toast.success(res.data.message || 'Customer updated successfully!');
      } else {
        const res = await api.post('/customers', formData);
        toast.success(res.data.message || 'Customer saved successfully!');
      }
      onSuccess();
      onClose();
    } catch (error) {
      if (error.response?.data?.existingCustomer) {
        setDuplicateInfo(error.response.data.existingCustomer);
      }
      toast.error(error.response?.data?.message || 'Failed to save customer record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Customer Details' : 'Add New Customer'}
      maxWidth="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Top Info Banner */}
        <div className="flex items-center justify-between rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/20 px-4 py-3 text-xs text-indigo-700 dark:text-indigo-300">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>
              Assigned Sales Rep:{' '}
              <strong className="text-slate-900 dark:text-white font-semibold">
                {isEditing
                  ? customerToEdit.salesEmployeeName
                  : isAdmin && formData.assignedEmployeeId
                  ? employees.find((e) => e._id === formData.assignedEmployeeId)?.name || user?.name
                  : user?.name}
              </strong>
            </span>
          </div>
          {!isAdmin ? (
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Lock className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
              Locked (Employee Profile)
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Admin Override Active</span>
          )}
        </div>

        {/* Duplicate Lead Warning Card */}
        {duplicateInfo && (
          <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 p-4 space-y-2 text-rose-800 dark:text-rose-200 animate-shake">
            <div className="flex items-center gap-2 font-bold text-xs">
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>Duplicate Lead Alert: Mobile number already exists in CRM!</span>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 text-xs space-y-1">
              <p>
                <strong>Existing Customer:</strong> {duplicateInfo.customerName} ({duplicateInfo.companyName || 'SofaShine'})
              </p>
              <p>
                <strong>Managed By:</strong> {duplicateInfo.salesEmployeeName} • <strong>Status:</strong> {duplicateInfo.followUpStatus || 'Active'}
              </p>
              <p className="text-[11px] text-slate-500">
                Registered on: {new Date(duplicateInfo.date).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Section 1: Basic Information */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-3 pb-1 border-b border-slate-200 dark:border-slate-800">
            <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            1. Customer & Contact Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Entry Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Entry Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className={`w-full rounded-lg border bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none ${
                  errors.customerName ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
                }`}
                required
              />
              {errors.customerName && <p className="mt-1 text-xs text-rose-500">{errors.customerName}</p>}
            </div>

            {/* Company / Brand Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Business / Company Brand <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white font-semibold focus:border-indigo-500 focus:outline-none"
                required
              >
                <option value="SofaShine">🛋️ SofaShine</option>
                <option value="CleanCruisers">🚗 CleanCruisers</option>
              </select>
            </div>

            {/* Mobile Number with Real-time Duplicate Check */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  onBlur={handleMobileBlur}
                  className={`w-full rounded-lg border bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none ${
                    duplicateInfo
                      ? 'border-rose-500 pr-9'
                      : errors.mobileNumber
                      ? 'border-rose-500'
                      : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
                  }`}
                  required
                />
                {checkingMobile && (
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 animate-spin">
                    ⏳
                  </span>
                )}
              </div>
              {errors.mobileNumber && <p className="mt-1 text-xs text-rose-500">{errors.mobileNumber}</p>}
            </div>

            {/* Alternate Mobile */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Alternate Mobile / Landline
              </label>
              <input
                type="tel"
                placeholder="Optional secondary number"
                value={formData.altMobileNumber}
                onChange={(e) => setFormData({ ...formData, altMobileNumber: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="contact@customer.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full rounded-lg border bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none ${
                  errors.email ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
                }`}
              />
              {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Priority & Lead Details */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-3 pb-1 border-b border-slate-200 dark:border-slate-800">
            <Flame className="h-4 w-4 text-rose-500" />
            2. Lead Priority & Requirements
          </h4>

          {/* Priority Radios */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Lead Priority <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRIORITIES.map((p) => (
                <label
                  key={p.id}
                  className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                    formData.priority === p.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500'
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{p.label}</span>
                    <input
                      type="radio"
                      name="priority"
                      value={p.id}
                      checked={formData.priority === p.id}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{p.desc}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Product / Service Interested In <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sofa Steam Cleaning, Ceramic Coating, Foam Wash"
                value={formData.productInterested}
                onChange={(e) => setFormData({ ...formData, productInterested: e.target.value })}
                className={`w-full rounded-lg border bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none ${
                  errors.productInterested ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
                }`}
                required
              />
              {errors.productInterested && (
                <p className="mt-1 text-xs text-rose-500">{errors.productInterested}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lead Source <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.leadSource}
                onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
              >
                {LEAD_SOURCES.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer Requirement / Details
              </label>
              <textarea
                rows={2}
                placeholder="Specific customer requests, fabric type, car model, room count..."
                value={formData.customerRequirement}
                onChange={(e) => setFormData({ ...formData, customerRequirement: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Address & Location Details */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-3 pb-1 border-b border-slate-200 dark:border-slate-800">
            <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            3. Location & Address Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location / Area <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Cyber City, Phase 3 (Optional)"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Gurgaon / Mumbai"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                State <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Haryana / Maharashtra"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Office / Postal Address
              </label>
              <input
                type="text"
                placeholder="e.g. Suite 402, Signature Towers, Sector 30"
                value={formData.fullAddress}
                onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Follow-up & Assignment */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-3 pb-1 border-b border-slate-200 dark:border-slate-800">
            <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            4. Follow-up & Management
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Follow-up Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                className={`w-full rounded-lg border bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none ${
                  errors.followUpDate ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
                }`}
                required
              />
              {errors.followUpDate && (
                <p className="mt-1 text-xs text-rose-500">{errors.followUpDate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Follow-up Time
              </label>
              <input
                type="text"
                placeholder="11:00 AM"
                value={formData.followUpTime}
                onChange={(e) => setFormData({ ...formData, followUpTime: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Follow-up Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.followUpStatus}
                onChange={(e) => setFormData({ ...formData, followUpStatus: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none font-medium"
              >
                {FOLLOWUP_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Admin-only Employee Assignment */}
            {isAdmin ? (
              <div>
                <label className="block text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1 flex items-center justify-between">
                  <span>Assigned Employee</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-mono">Admin Only</span>
                </label>
                <select
                  value={formData.assignedEmployeeId}
                  onChange={(e) => setFormData({ ...formData, assignedEmployeeId: e.target.value })}
                  className="w-full rounded-lg border border-indigo-300 dark:border-indigo-500/40 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-400 focus:outline-none"
                >
                  <option value={user?.id}>Assign to me ({user?.name})</option>
                  {employees
                    .filter((e) => e._id !== user?.id)
                    .map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.designation})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Sales Employee
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value={isEditing ? customerToEdit.salesEmployeeName : user?.name}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/80 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                  <Lock className="absolute right-3 top-2.5 h-4 w-4 text-amber-500/80" />
                </div>
                <p className="mt-1 text-[10px] text-slate-500">Auto-filled from logged-in profile.</p>
              </div>
            )}

            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Remarks / Interaction Notes
              </label>
              <textarea
                rows={2}
                placeholder="Notes on customer conversation, budget quotation details, next steps..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || checkingMobile}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:bg-indigo-800 transition-all"
          >
            {submitting ? (
              <span>Saving...</span>
            ) : (
              <span>{isEditing ? 'Update Customer' : 'Save Customer Details'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
