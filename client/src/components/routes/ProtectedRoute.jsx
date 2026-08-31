import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, LogOut, Clock } from 'lucide-react';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-xs font-medium text-slate-400">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If employee account is pending approval
  if (user?.status === 'pending') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 mb-4 border border-amber-500/30">
            <Clock className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Account Pending Approval</h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Welcome, <strong className="text-white">{user?.name}</strong>! Your sales employee
            account was submitted successfully and is awaiting review by a CRM Administrator.
          </p>
          <div className="mt-6 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
            Once approved, you will have immediate access to your customer management dashboard.
          </div>
          <button
            onClick={logout}
            className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Check role requirement
  if (requiredRole && user?.role !== requiredRole) {
    // If employee tries to access admin route, redirect to employee home
    if (user?.role === 'employee') {
      return <Navigate to="/employee/customers" replace />;
    }
    // If admin tries to access employee-specific root, redirect to admin dashboard
    if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return children;
};
