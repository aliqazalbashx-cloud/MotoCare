import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Gauge,
  Bike,
  Wrench,
  CalendarCheck,
  Receipt,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'motorcycles'
  | 'services'
  | 'maintenance'
  | 'expenses'
  | 'profile'
  | 'settings';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddBike: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddBike,
}) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: Gauge },
    { id: 'motorcycles' as NavTab, label: 'My Garage', icon: Bike },
    { id: 'services' as NavTab, label: 'Service History', icon: Wrench },
    { id: 'maintenance' as NavTab, label: 'Maintenance', icon: CalendarCheck },
    { id: 'expenses' as NavTab, label: 'Expenses', icon: Receipt },
  ];

  const handleSelect = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-zinc-950/90 border-b border-zinc-800 backdrop-blur-md">
        <div
          onClick={() => handleSelect('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-red-950/40">
            M
          </div>
          <span className="font-bold text-lg text-zinc-100 tracking-tight">
            Motor<span className="text-rose-500">Care</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddBike}
            className="p-2 text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition text-xs flex items-center gap-1 font-semibold"
            aria-label="Add Motorcycle"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[57px] bottom-0 z-40 bg-zinc-950/95 border-b border-zinc-800 p-4 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="pt-4 border-t border-zinc-850 mt-4">
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Account
              </div>
              <button
                onClick={() => handleSelect('profile')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                  currentTab === 'profile'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <User className="w-5 h-5 shrink-0" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => handleSelect('settings')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                  currentTab === 'settings'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Settings className="w-5 h-5 shrink-0" />
                <span>Settings</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-850">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-sm text-zinc-200">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-200 truncate">
                  {user?.name || 'Rider'}
                </p>
                <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition border border-rose-500/20"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex flex-col w-64 bg-zinc-950 border-r border-zinc-800/80 p-5 shrink-0 h-screen sticky top-0 justify-between select-none">
        <div>
          {/* Brand Logo */}
          <div
            onClick={() => handleSelect('dashboard')}
            className="flex items-center gap-3 cursor-pointer mb-8 px-2"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-red-950/40">
              M
            </div>
            <div>
              <span className="font-extrabold text-xl text-zinc-100 tracking-tight block leading-none">
                Motor<span className="text-rose-500">Care</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Garage & Service HQ
              </span>
            </div>
          </div>

          {/* Quick Action Button */}
          <button
            onClick={onOpenAddBike}
            className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:scale-[0.98] transition shadow-lg shadow-rose-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Add Motorcycle</span>
          </button>

          {/* Main Nav Items */}
          <nav className="space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Menu
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Footer and Settings */}
        <div className="pt-4 border-t border-zinc-850 space-y-2">
          <div className="space-y-0.5">
            <button
              onClick={() => handleSelect('profile')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                currentTab === 'profile'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <User className="w-4 h-4 text-zinc-400" />
              <span>Profile</span>
            </button>
            <button
              onClick={() => handleSelect('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                currentTab === 'settings'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Settings className="w-4 h-4 text-zinc-400" />
              <span>Settings</span>
            </button>
          </div>

          {/* Profile Card */}
          <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-600 flex items-center justify-center font-bold text-xs text-zinc-200 shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-200 truncate">
                  {user?.name || 'Rider'}
                </p>
                <p className="text-[11px] text-zinc-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
