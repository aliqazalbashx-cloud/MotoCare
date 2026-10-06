import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import {
  Bike,
  ShieldCheck,
  CalendarCheck,
  Receipt,
  CheckCircle2,
  Lock,
  Mail,
  User,
  ArrowRight,
  Flame,
} from 'lucide-react';

export const LandingAndAuthView: React.FC = () => {
  const { login, register, loginWithGoogle, loginAsDemo } = useAuth();
  const { error, success } = useToast();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (authMode === 'register') {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'login') {
        await login(email, password);
        success('Welcome back to MotorCare!');
      } else {
        await register(name, email, password, confirmPassword);
        success('Account created successfully! Welcome to MotorCare.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
      error(err.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      success('Signed in with Google!');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMessage(null);
    setIsDemoSubmitting(true);
    try {
      await loginAsDemo();
      success('Logged in as Demo Rider! Pre-populated with Honda CB150F & Yamaha MT-07.');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to initialize demo environment.');
    } finally {
      setIsDemoSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-rose-500 selection:text-white">
      {/* Header Bar */}
      <header className="px-6 py-5 max-w-7xl mx-auto w-full flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-red-950/50">
            M
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight">
              Motor<span className="text-rose-500">Care</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
              Garage & Service Platform
            </span>
          </div>
        </div>

        <button
          onClick={handleDemoLogin}
          disabled={isDemoSubmitting}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 transition hover:border-zinc-700 shadow-md"
        >
          {isDemoSubmitting ? (
            <span className="w-4 h-4 border-2 border-zinc-400/20 border-t-zinc-200 rounded-full animate-spin" />
          ) : (
            <Flame className="w-4 h-4 text-amber-500" />
          )}
          <span>Quick Demo Login</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-6 py-12 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Product Value & Features */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              <Bike className="w-3.5 h-3.5" />
              <span>Next-Gen Motorcycle Maintenance Log</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-zinc-100">
              Never miss an oil change or service interval again.
            </h1>
            <p className="text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed">
              MotorCare is a precision digital garage for motorcycle enthusiasts and daily riders. Track service history, recurring maintenance intervals, expenses, and maintenance health scores.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-850">
              <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 w-fit mb-3">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-200 mb-1">
                Automated Schedule Tracking
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Smart recurring mileage and date reminders: Oil Change, Chain Service, Brake checks, and custom intervals.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-850">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 w-fit mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-200 mb-1">
                Maintenance Health Score
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Deterministic 0–100 health metrics that reflect the condition and timeliness of your bike's maintenance.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-850">
              <div className="p-2.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 w-fit mb-3">
                <Bike className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-200 mb-1">
                Multi-Motorcycle Garage
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Manage your daily commuter, weekend canyon carver, or track weapon in one organized workspace.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-850">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit mb-3">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-zinc-200 mb-1">
                Expense & Cost Analytics
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Categorized spending breakdown for fuel, parts, accessories, insurance, and routine upkeep.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div className="lg:col-span-5">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-7 shadow-2xl backdrop-blur-xl">
            {/* Tabs */}
            <div className="flex p-1 bg-zinc-950/80 rounded-2xl border border-zinc-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl transition ${
                  authMode === 'login'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl transition ${
                  authMode === 'register'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Register
              </button>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Fast Demo Button */}
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isDemoSubmitting}
              className="w-full mb-4 py-2.5 px-4 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition"
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>One-Click Demo (demo@motorcare.local)</span>
            </button>

            {/* Google Sign-in */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full mb-5 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-200 text-sm font-medium flex items-center justify-center gap-3 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider text-zinc-500">
                <span className="bg-zinc-900 px-3">or credentials</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. Alex Henderson"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-rose-500 transition"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    placeholder="rider@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-rose-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-rose-500 transition"
                    required
                  />
                </div>
              </div>

              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-rose-500 transition"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:scale-[0.99] transition shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {authMode === 'login' ? 'Sign In to Garage' : 'Create Free Account'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-zinc-900 text-center text-xs text-zinc-500">
        <p>MotorCare &copy; {new Date().getFullYear()} — Digital Motorcycle Maintenance & Service Log</p>
      </footer>
    </div>
  );
};
