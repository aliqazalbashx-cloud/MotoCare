import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';

interface AddScheduleModalProps {
  isOpen: boolean;
  motorcycles: Array<{ id: number; brand: string; model: string; nickname?: string | null; currentMileage: number }>;
  defaultMotorcycleId?: number;
  onClose: () => void;
  onSuccess: (newSchedule: any) => void;
}

const SCHEDULE_PRESETS = [
  { type: 'Oil Change', km: 1000, days: 90 },
  { type: 'Chain Service', km: 500, days: 30 },
  { type: 'Brake Inspection', km: 2000, days: 120 },
  { type: 'Air Filter Cleaning', km: 3000, days: 180 },
  { type: 'Spark Plug Inspection', km: 6000, days: 240 },
  { type: 'Tyre Inspection', km: 3000, days: 90 },
  { type: 'Battery Check', km: 5000, days: 180 },
  { type: 'Valve Clearance Check', km: 10000, days: 365 },
  { type: 'General Inspection', km: 3000, days: 180 },
  { type: 'Custom', km: 1000, days: 90 },
];

export const AddScheduleModal: React.FC<AddScheduleModalProps> = ({
  isOpen,
  motorcycles,
  defaultMotorcycleId,
  onClose,
  onSuccess,
}) => {
  const { apiFetch } = useAuth();
  const { success, error } = useToast();

  const [motorcycleId, setMotorcycleId] = useState<number>(defaultMotorcycleId || motorcycles[0]?.id || 0);
  const [presetType, setPresetType] = useState('Oil Change');
  const [customType, setCustomType] = useState('');
  const [intervalKm, setIntervalKm] = useState<number>(1000);
  const [intervalDays, setIntervalDays] = useState<string>('90');
  const [lastCompletedMileage, setLastCompletedMileage] = useState<number>(0);
  const [lastCompletedDate, setLastCompletedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultMotorcycleId) {
      setMotorcycleId(defaultMotorcycleId);
      const b = motorcycles.find((m) => m.id === defaultMotorcycleId);
      if (b) setLastCompletedMileage(b.currentMileage);
    } else if (motorcycles.length > 0 && !motorcycleId) {
      setMotorcycleId(motorcycles[0].id);
      setLastCompletedMileage(motorcycles[0].currentMileage);
    }
  }, [defaultMotorcycleId, motorcycles, motorcycleId]);

  const handlePresetChange = (type: string) => {
    setPresetType(type);
    const found = SCHEDULE_PRESETS.find((p) => p.type === type);
    if (found && type !== 'Custom') {
      setIntervalKm(found.km);
      setIntervalDays(found.days.toString());
    }
  };

  const handleBikeChange = (id: number) => {
    setMotorcycleId(id);
    const b = motorcycles.find((m) => m.id === id);
    if (b) setLastCompletedMileage(b.currentMileage);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const type = presetType === 'Custom' ? customType.trim() : presetType;
    if (!type) {
      setFormError('Please enter a maintenance type.');
      return;
    }
    if (!motorcycleId) {
      setFormError('Please select a motorcycle.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        motorcycleId,
        maintenanceType: type,
        intervalKm: Number(intervalKm),
        intervalDays: intervalDays ? parseInt(intervalDays, 10) : undefined,
        lastCompletedMileage: Number(lastCompletedMileage) || 0,
        lastCompletedDate: lastCompletedDate || undefined,
        isEnabled: true,
        notes: notes.trim() || undefined,
      };

      const result = await apiFetch('/api/schedules', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      success(`Scheduled ${type} tracking interval.`);
      setCustomType('');
      setNotes('');
      onSuccess(result);
      onClose();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Failed to save maintenance schedule.');
      error(err.message || 'Failed to save maintenance schedule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Recurring Maintenance Schedule"
      description="Configure recurring mileage and time intervals for automated service reminders."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Motorcycle *
            </label>
            <select
              value={motorcycleId}
              onChange={(e) => handleBikeChange(parseInt(e.target.value, 10))}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
              required
            >
              {motorcycles.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.brand} {b.model} {b.nickname ? `(${b.nickname})` : ''} — {b.currentMileage.toLocaleString()} km
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Maintenance Type *
            </label>
            <select
              value={presetType}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
              required
            >
              {SCHEDULE_PRESETS.map((p) => (
                <option key={p.type} value={p.type}>
                  {p.type}
                </option>
              ))}
            </select>
            {presetType === 'Custom' && (
              <input
                type="text"
                placeholder="e.g. Fork Oil Replacement"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                className="mt-2 w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
                required
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Interval (km) *
            </label>
            <input
              type="number"
              min="1"
              value={intervalKm}
              onChange={(e) => setIntervalKm(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Interval (Days, optional)
            </label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 90 (3 months)"
              value={intervalDays}
              onChange={(e) => setIntervalDays(e.target.value)}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Last Done Odometer (km)
            </label>
            <input
              type="number"
              min="0"
              value={lastCompletedMileage}
              onChange={(e) => setLastCompletedMileage(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Last Completed Date
            </label>
            <input
              type="date"
              value={lastCompletedDate}
              onChange={(e) => setLastCompletedDate(e.target.value)}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Manufacturer Guidance / Notes (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="e.g. 10W-40 full synthetic, torque bolts to 24 Nm..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
          />
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300/90 leading-relaxed">
          <strong>Notice:</strong> Maintenance intervals are user-configurable. Always follow your motorcycle manufacturer's official owner manual recommendations.
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:scale-[0.98] transition shadow-lg shadow-rose-950/40 flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting && (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            )}
            Save Schedule
          </button>
        </div>
      </form>
    </Modal>
  );
};
