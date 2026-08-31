import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/routes/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Auth Pages (Lazy Loaded)
const LoginPage = lazy(() =>
  import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const SignupPage = lazy(() =>
  import('./pages/auth/SignupPage').then((m) => ({ default: m.SignupPage }))
);

// Admin Pages (Lazy Loaded)
const AdminDashboard = lazy(() =>
  import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const AdminCustomers = lazy(() =>
  import('./pages/admin/AdminCustomers').then((m) => ({ default: m.AdminCustomers }))
);
const EmployeeManagement = lazy(() =>
  import('./pages/admin/EmployeeManagement').then((m) => ({ default: m.EmployeeManagement }))
);
const TargetManagementPage = lazy(() =>
  import('./pages/admin/TargetManagementPage').then((m) => ({ default: m.TargetManagementPage }))
);

// Employee Pages (Lazy Loaded)
const EmployeeCustomers = lazy(() =>
  import('./pages/employee/EmployeeCustomers').then((m) => ({ default: m.EmployeeCustomers }))
);
const EmployeeDashboard = lazy(() =>
  import('./pages/employee/EmployeeDashboard').then((m) => ({ default: m.EmployeeDashboard }))
);

// Common Pages (Lazy Loaded)
const DailyWorkReportPage = lazy(() =>
  import('./pages/common/DailyWorkReportPage').then((m) => ({ default: m.DailyWorkReportPage }))
);
const DataBackupCenterPage = lazy(() =>
  import('./pages/common/DataBackupCenterPage').then((m) => ({ default: m.DataBackupCenterPage }))
);
const ActivityLogsPage = lazy(() =>
  import('./pages/common/ActivityLogsPage').then((m) => ({ default: m.ActivityLogsPage }))
);

// Ultra-fast Top Loading Skeleton
const PageLoader = () => (
  <div className="flex h-64 w-full items-center justify-center">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
  </div>
);

// Root Redirect Component
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/employee/customers" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#0f172a',
                color: '#f8fafc',
                border: '1px solid #334155',
                borderRadius: '12px',
                fontSize: '13px',
              },
            }}
          />

          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Root redirect */}
              <Route path="/" element={<RootRedirect />} />

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="employees" element={<EmployeeManagement />} />
                <Route path="targets" element={<TargetManagementPage />} />
                <Route path="reports" element={<DailyWorkReportPage />} />
                <Route path="export-center" element={<DataBackupCenterPage />} />
                <Route path="logs" element={<ActivityLogsPage />} />
              </Route>

              {/* Employee Protected Routes */}
              <Route
                path="/employee"
                element={
                  <ProtectedRoute requiredRole="employee">
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/employee/customers" replace />} />
                <Route path="customers" element={<EmployeeCustomers />} />
                <Route path="dashboard" element={<EmployeeDashboard />} />
                <Route path="reports" element={<DailyWorkReportPage />} />
                <Route path="export-center" element={<DataBackupCenterPage />} />
                <Route path="logs" element={<ActivityLogsPage />} />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
