import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import {
  Settings,
  Database,
  Moon,
  LogOut,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, logout, loginAsDemo } = useAuth();
  const { success, error } = useToast();

  const [isResetting, setIsResetting] = useState(false);
  const [distanceUnit, setDistanceUnit] = useState('km');

  const handleResetDemoData = async () => {
    setIsResetting(true);
    try {
      await loginAsDemo();
      success('Garage re-synchronized with Honda CB150F and Yamaha MT-07 demo data.');
    } catch (err: any) {
      console.error(err);
      error(err.message || 'Failed to reseed demo data.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
          Configure application preferences and data management.
        </p>
      </div>

      {/* Preferences Card */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-5 shadow-xl">
        <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
          Garage Preferences
        </h3>

        <div className="flex items-center justify-between py-3 border-b border-zinc-800">
          <div>
            <p className="text-sm font-semibold text-zinc-200">Distance Units</p>
            <p className="text-xs text-zinc-400">
              Metric (Kilometers) or Imperial (Miles) for odometers and intervals
            </p>
          </div>
          <select
            value={distanceUnit}
            onChange={(e) => setDistanceUnit(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-200"
          >
            <option value="km">Kilometers (km)</option>
            <option value="mi">Miles (mi)</option>
          </select>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-zinc-800">
          <div>
            <p className="text-sm font-semibold text-zinc-200">Visual Theme</p>
            <p className="text-xs text-zinc-400">
              Automotive Dark Charcoal & Red Accent
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <Moon className="w-3.5 h-3.5 text-rose-500" />
            <span>Dark Automotive</span>
          </span>
        </div>
      </div>

      {/* Developer & Demo Data Tools */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-zinc-100">
            Database & Demo Environment
          </h3>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Need sample records for testing? You can reload the pre-built demo motorcycle dataset (Honda CB150F 2026 and Yamaha MT-07 2025 with service histories and expense receipts).
        </p>

        <div className="pt-2">
          <button
            onClick={handleResetDemoData}
            disabled={isResetting}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            <span>{isResetting ? 'Reseeding Data...' : 'Reload Demo Fleet & Records'}</span>
          </button>
        </div>
      </div>

      {/* Account Session */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-zinc-100">Session</h3>
        <p className="text-xs text-zinc-400">
          Logged in as <strong className="text-zinc-200">{user?.email}</strong>
        </p>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of MotorCare</span>
        </button>
      </div>
    </div>
  );
};
