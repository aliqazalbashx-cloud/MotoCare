import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';

interface AddServiceModalProps {
  isOpen: boolean;
  motorcycles: Array<{ id: number; brand: string; model: string; nickname?: string | null; currentMileage: number }>;
  defaultMotorcycleId?: number;
  onClose: () => void;
  onSuccess: (newService: any) => void;
}

const SERVICE_TYPES = [
  'Oil Change',
  'Engine Service',
  'Brake Service',
  'Chain & Sprocket',
  'Tyre',
  'Battery',
  'Electrical',
  'Suspension',
  'General Inspection',
  'Other',
];

export const AddServiceModal: React.FC<AddServiceModalProps> = ({
  isOpen,
  motorcycles,
  defaultMotorcycleId,
  onClose,
  onSuccess,
}) => {
  const { apiFetch } = useAuth();
  const { success, error } = useToast();

  const [motorcycleId, setMotorcycleId] = useState<number>(defaultMotorcycleId || motorcycles[0]?.id || 0);
  const [serviceType, setServiceType] = useState('Oil Change');
  const [serviceDate, setServiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [mileage, setMileage] = useState<number>(0);
  const [cost, setCost] = useState<string>('0');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync mileage with selected bike
  useEffect(() => {
    if (defaultMotorcycleId) {
      setMotorcycleId(defaultMotorcycleId);
      const b = motorcycles.find((m) => m.id === defaultMotorcycleId);
      if (b) setMileage(b.currentMileage);
    } else if (motorcycles.length > 0 && !motorcycleId) {
      setMotorcycleId(motorcycles[0].id);
      setMileage(motorcycles[0].currentMileage);
    }
  }, [defaultMotorcycleId, motorcycles, motorcycleId]);

  const handleBikeChange = (id: number) => {
    setMotorcycleId(id);
    const b = motorcycles.find((m) => m.id === id);
    if (b) setMileage(b.currentMileage);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!motorcycleId) {
      setFormError('Please select a motorcycle.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        motorcycleId,
        serviceType,
        serviceDate,
        mileage: Number(mileage),
        cost: parseFloat(cost) || 0,
        partsReplaced: partsReplaced.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const result = await apiFetch('/api/services', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      success(`${serviceType} recorded successfully.`);
      setPartsReplaced('');
      setNotes('');
      setCost('0');
      onSuccess(result);
      onClose();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Failed to record service.');
      error(err.message || 'Failed to record service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Service Record"
      description="Record a completed maintenance or service event to update your history."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Select Bike */}
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

          {/* Service Type */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Service Type *
            </label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
              required
            >
              {SERVICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Service Date *
            </label>
            <input
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
              required
            />
          </div>

          {/* Mileage */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Mileage at Service (km) *
            </label>
            <input
              type="number"
              min="0"
              value={mileage}
              onChange={(e) => setMileage(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
              required
            />
          </div>

          {/* Cost */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Total Cost (Rs. / $) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
              required
            />
          </div>
        </div>

        {/* Parts Replaced */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Parts Replaced / Fluids (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Engine oil 10W-40, OEM oil filter, brake pads"
            value={partsReplaced}
            onChange={(e) => setPartsReplaced(e.target.value)}
            className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Mechanic Notes / Workshop (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Work done at Authorized Center, torqued to specs, spark plug checked..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
          />
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
            Save Service Record
          </button>
        </div>
      </form>
    </Modal>
  );
};
