import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Building2, Shield, User, ArrowRight, AlertCircle, Sun, Moon, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState('employee'); // 'employee' | 'admin'
  const [identifier, setIdentifier] = useState(''); // email for admin, mobile number for employee
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanInput = identifier.trim();

    if (activeTab === 'employee') {
      // Validate mobile phone number (10 digits)
      const digitsOnly = cleanInput.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        setErrorMessage('Please enter a valid 10-digit registered mobile number.');
        return;
      }
    } else {
      // Validate admin email
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(cleanInput.toLowerCase())) {
        setErrorMessage('Please enter a valid administrator email address (e.g. admin@crm.com).');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await login(cleanInput, password, activeTab);
      if (res.success) {
        toast.success(`Welcome back, ${res.user.name}!`);
        if (res.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/employee/customers');
        }
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please verify your credentials.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 items-center justify-center p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      {/* Theme toggle button in top right */}
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-5 right-5 flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
        title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      >
        {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
      </button>

      {/* Background radial gradient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 dark:from-indigo-900/20 via-transparent to-transparent -z-10 pointer-events-none" />

      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 shadow-xl shadow-indigo-600/30">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">SalesPulse CRM</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Internal Sales & Customer Relationship Management Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('employee');
                setIdentifier('');
                setPassword('');
                setErrorMessage('');
              }}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                activeTab === 'employee'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Worker Login (Mobile)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setIdentifier('');
                setPassword('');
                setErrorMessage('');
              }}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Admin Portal</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>
                  {activeTab === 'employee' ? 'Registered Mobile Number' : 'Admin Work Email Address'}
                </span>
                {activeTab === 'employee' && (
                  <span className="text-[11px] font-normal text-indigo-600 dark:text-indigo-400">
                    📱 10-Digit Mobile
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type={activeTab === 'employee' ? 'tel' : 'email'}
                  required
                  placeholder={
                    activeTab === 'employee' ? 'e.g. 9876543210' : 'admin@crm.com'
                  }
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 active:scale-[0.99] disabled:bg-indigo-800 transition-all"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>
                    Sign In to {activeTab === 'admin' ? 'Admin Portal' : 'Worker Panel'}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Employee Signup link */}
          {activeTab === 'employee' && (
            <div className="mt-5 text-center pt-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                New sales team member?{' '}
                <Link to="/signup" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                  Register new worker account
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
