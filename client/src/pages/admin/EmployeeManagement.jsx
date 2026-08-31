import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { UserStatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import {
  UserCheck,
  UserPlus,
  Search,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Power,
  Shield,
  Phone,
  Mail,
  Briefcase,
  Users,
  Award,
  Clock,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: 'Sales Executive',
    role: 'employee',
    status: 'approved',
    password: '',
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employees', {
        params: { status: statusFilter, search },
      });
      if (res.data.success) {
        setEmployees(res.data.employees);
      }
    } catch (error) {
      toast.error('Failed to load employees.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEmployees();
  };

  // Status Change (Approve, Reject, Activate, Deactivate)
  const handleStatusChange = async (id, newStatus, employeeName) => {
    try {
      const res = await api.patch(`/employees/${id}/status`, { status: newStatus });
      toast.success(res.data.message || `Employee status updated to ${newStatus}.`);
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Status update failed.');
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      designation: 'Sales Executive',
      role: 'employee',
      status: 'approved',
      password: '',
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      designation: emp.designation,
      role: emp.role,
      status: emp.status,
      password: '',
    });
  };

  // Save Add / Edit
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingEmployee) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        const res = await api.put(`/employees/${editingEmployee._id}`, payload);
        toast.success(res.data.message || 'Employee updated successfully.');
        setEditingEmployee(null);
      } else {
        if (!formData.password) {
          toast.error('Password is required for new employee accounts.');
          setIsSubmitting(false);
          return;
        }
        const res = await api.post('/employees', formData);
        toast.success(res.data.message || 'Employee created successfully.');
        setIsAddModalOpen(false);
      }
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save employee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Employee
  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await api.delete(`/employees/${employeeToDelete._id}`);
      toast.success(res.data.message || 'Employee account deleted.');
      setEmployeeToDelete(null);
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete employee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Summary counts
  const totalCount = employees.length;
  const approvedCount = employees.filter((e) => e.status === 'approved').length;
  const pendingCount = employees.filter((e) => e.status === 'pending').length;
  const inactiveCount = employees.filter((e) => e.status === 'inactive' || e.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white dark:bg-slate-900/80 p-6 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-sm transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Sales Employee Management
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Manage sales team accounts, review pending signups, and monitor employee metrics
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Mini Stat Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3.5 shadow-sm dark:shadow-none">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Employees</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/20 p-3.5 shadow-sm dark:shadow-none">
          <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Active & Approved</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{approvedCount}</p>
        </div>
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-950/20 p-3.5 shadow-sm dark:shadow-none">
          <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase">Pending Review</p>
          <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-300">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3.5 shadow-sm dark:shadow-none">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Inactive / Rejected</p>
          <p className="mt-1 text-2xl font-bold text-slate-500 dark:text-slate-400">{inactiveCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-white dark:bg-slate-900/60 p-4 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors">
        <form onSubmit={handleSearch} className="flex-1 w-full sm:w-auto relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, phone, designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Approval</option>
            <option value="inactive">Inactive</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            onClick={fetchEmployees}
            disabled={loading}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Employee List Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm dark:shadow-xl transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Customers</th>
                <th className="py-3 px-4 text-center">Pending Follow-ups</th>
                <th className="py-3 px-4 text-center">Won Deals</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-indigo-500 dark:text-indigo-400" />
                      <span>Loading employee directory...</span>
                    </div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No employees matching filter criteria.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Name & Avatar */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-xl font-bold text-white text-xs shadow-sm"
                          style={{ backgroundColor: emp.avatarColor || '#3b82f6' }}
                        >
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{emp.name}</p>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            Joined {new Date(emp.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email & Phone */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <Mail className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                          <span>{emp.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          <Phone className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                          <span>{emp.phone}</span>
                        </div>
                      </div>
                    </td>

                    {/* Designation */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                      {emp.designation}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <UserStatusBadge status={emp.status} />
                    </td>

                    {/* Total Customers */}
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <span className="font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        {emp.totalCustomers || 0}
                      </span>
                    </td>

                    {/* Pending Follow-ups */}
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <span className="font-semibold text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20">
                        {emp.pendingFollowups || 0}
                      </span>
                    </td>

                    {/* Won Deals */}
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20">
                        {emp.convertedLeads || 0}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* If Pending: Show 1-Click Quick Approval & Rejection */}
                        {emp.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(emp._id, 'approved', emp.name)}
                              title="Approve Signup"
                              className="flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 transition-colors"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusChange(emp._id, 'rejected', emp.name)}
                              title="Reject Signup"
                              className="flex items-center gap-1 rounded-lg bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 px-2.5 py-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/30 transition-colors"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </>
                        )}

                        {/* If Active: Toggle Inactive / Active */}
                        {emp.status === 'approved' && (
                          <button
                            onClick={() => handleStatusChange(emp._id, 'inactive', emp.name)}
                            title="Deactivate Account"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        )}

                        {emp.status === 'inactive' && (
                          <button
                            onClick={() => handleStatusChange(emp._id, 'approved', emp.name)}
                            title="Re-activate Account"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors"
                          >
                            <Power className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          </button>
                        )}

                        {/* Edit Employee */}
                        <button
                          onClick={() => openEditModal(emp)}
                          title="Edit Details"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        {/* Delete Employee */}
                        <button
                          onClick={() => setEmployeeToDelete(emp)}
                          title="Delete Employee"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      <Modal
        isOpen={isAddModalOpen || !!editingEmployee}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingEmployee(null);
        }}
        title={editingEmployee ? `Edit Employee: ${editingEmployee.name}` : 'Add New Sales Employee'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveEmployee} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name <span className="text-rose-500 dark:text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sarah Jenkins"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Work Email <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="sarah@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Designation</label>
              <input
                type="text"
                placeholder="e.g. Territory Sales Manager"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Account Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="approved">Approved & Active</option>
                <option value="pending">Pending Approval</option>
                <option value="inactive">Inactive</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password {editingEmployee && '(Leave empty to keep existing password)'}
            </label>
            <input
              type="password"
              placeholder={editingEmployee ? '••••••••' : 'Min 6 characters'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingEmployee(null);
              }}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:bg-indigo-800 transition-all"
            >
              {isSubmitting
                ? 'Saving...'
                : editingEmployee
                ? 'Update Employee'
                : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!employeeToDelete}
        onClose={() => setEmployeeToDelete(null)}
        onConfirm={handleDeleteEmployee}
        title="Delete Employee Account"
        message={`Are you sure you want to delete employee "${employeeToDelete?.name}" (${employeeToDelete?.email})? All historic customer records linked to this employee will be preserved.`}
        confirmText="Yes, Delete Employee"
        isDanger={true}
        loading={isSubmitting}
      />
    </div>
  );
};
