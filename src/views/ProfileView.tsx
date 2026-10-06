import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { User, Mail, Lock, Shield, CheckCircle2 } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, updateProfileName, changePassword } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsUpdatingName(true);
    try {
      await updateProfileName(name.trim());
      success('Profile name updated successfully.');
    } catch (err: any) {
      console.error(err);
      error(err.message || 'Failed to update name.');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      error('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      error('New password must be at least 6 characters.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      success('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      error(err.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
          Rider Profile
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
          Manage your personal account credentials and security settings.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-6 shadow-xl">
        <div className="flex items-center gap-4 pb-6 border-b border-zinc-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-red-950/40">
            {user?.name?.[0]?.toUpperCase() || 'R'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">{user?.name}</h2>
            <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-zinc-500" />
              <span>{user?.email}</span>
            </p>
            <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80">
              Active Member
            </span>
          </div>
        </div>

        {/* Update Name Form */}
        <form onSubmit={handleUpdateName} className="space-y-4">
          <h3 className="text-sm font-bold text-zinc-200">Personal Information</h3>
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Display Name
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
                required
              />
              <button
                type="submit"
                disabled={isUpdatingName || name.trim() === user?.name}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-500 transition disabled:opacity-40"
              >
                {isUpdatingName ? 'Saving...' : 'Update Name'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-zinc-100">Change Password</h3>
        </div>
        <p className="text-xs text-zinc-400">
          Ensure your account uses a secure password of at least 6 characters.
        </p>

        <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            {isChangingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
