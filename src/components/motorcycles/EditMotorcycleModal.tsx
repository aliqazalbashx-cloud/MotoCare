import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';

interface EditMotorcycleModalProps {
  isOpen: boolean;
  motorcycle: any;
  onClose: () => void;
  onSuccess: (updatedBike: any) => void;
}

export const EditMotorcycleModal: React.FC<EditMotorcycleModalProps> = ({
  isOpen,
  motorcycle,
  onClose,
  onSuccess,
}) => {
  const { apiFetch } = useAuth();
  const { success, error } = useToast();

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [nickname, setNickname] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [currentMileage, setCurrentMileage] = useState<number>(0);
  const [purchaseDate, setPurchaseDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (motorcycle) {
      setBrand(motorcycle.brand || '');
      setModel(motorcycle.model || '');
      setYear(motorcycle.year || new Date().getFullYear());
      setNickname(motorcycle.nickname || '');
      setRegistrationNumber(motorcycle.registrationNumber || '');
      setCurrentMileage(motorcycle.currentMileage || 0);
      setPurchaseDate(motorcycle.purchaseDate || '');
      setImageUrl(motorcycle.imageUrl || '');
      setNotes(motorcycle.notes || '');
    }
  }, [motorcycle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motorcycle) return;
    setFormError(null);

    setIsSubmitting(true);
    try {
      const payload = {
        brand: brand.trim(),
        model: model.trim(),
        year: Number(year),
        nickname: nickname.trim() || undefined,
        registrationNumber: registrationNumber.trim() || undefined,
        currentMileage: Number(currentMileage) || 0,
        purchaseDate: purchaseDate || undefined,
        imageUrl: imageUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const updated = await apiFetch(`/api/motorcycles/${motorcycle.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      success('Motorcycle updated successfully.');
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Failed to update motorcycle.');
      error(err.message || 'Failed to update motorcycle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Motorcycle"
      description="Update odometer, specs, registration, or notes."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Brand *
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Model *
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Year *
            </label>
            <input
              type="number"
              min="1950"
              max="2035"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Current Odometer (km) *
            </label>
            <input
              type="number"
              min="0"
              value={currentMileage}
              onChange={(e) => setCurrentMileage(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Registration Number
            </label>
            <input
              type="text"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Purchase Date
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Photo URL
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Notes / Specs
          </label>
          <textarea
            rows={2}
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
            Update Motorcycle
          </button>
        </div>
      </form>
    </Modal>
  );
};
