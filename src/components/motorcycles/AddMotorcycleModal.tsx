import React, { useState } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';

interface AddMotorcycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBike: any) => void;
}

const COMMON_BRANDS = [
  'Honda',
  'Yamaha',
  'Kawasaki',
  'Suzuki',
  'BMW',
  'KTM',
  'Royal Enfield',
  'Ducati',
  'Triumph',
  'Harley-Davidson',
  'Aprilia',
  'Other',
];

export const AddMotorcycleModal: React.FC<AddMotorcycleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { apiFetch } = useAuth();
  const { success, error } = useToast();

  const [brand, setBrand] = useState('Honda');
  const [customBrand, setCustomBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [nickname, setNickname] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [currentMileage, setCurrentMileage] = useState<number>(0);
  const [purchaseDate, setPurchaseDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [createDefaultSchedules, setCreateDefaultSchedules] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const effectiveBrand = brand === 'Other' ? customBrand.trim() : brand;
    if (!effectiveBrand) {
      setFormError('Please select or specify a brand.');
      return;
    }
    if (!model.trim()) {
      setFormError('Please enter the motorcycle model (e.g. CB150F).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        brand: effectiveBrand,
        model: model.trim(),
        year: Number(year),
        nickname: nickname.trim() || undefined,
        registrationNumber: registrationNumber.trim() || undefined,
        currentMileage: Number(currentMileage) || 0,
        purchaseDate: purchaseDate || undefined,
        imageUrl: imageUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        createDefaultSchedules,
      };

      const newBike = await apiFetch('/api/motorcycles', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      success(`${newBike.brand} ${newBike.model} added to your garage!`);
      // Reset form
      setModel('');
      setNickname('');
      setRegistrationNumber('');
      setCurrentMileage(0);
      setPurchaseDate('');
      setImageUrl('');
      setNotes('');
      onSuccess(newBike);
      onClose();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Failed to save motorcycle.');
      error(err.message || 'Failed to save motorcycle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Motorcycle to Garage"
      description="Enter your motorcycle details to start tracking maintenance and expenses."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Brand */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Brand *
            </label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
              required
            >
              {COMMON_BRANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            {brand === 'Other' && (
              <input
                type="text"
                placeholder="Enter custom brand"
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                className="mt-2 w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
                required
              />
            )}
          </div>

          {/* Model */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Model *
            </label>
            <input
              type="text"
              placeholder="e.g. CB150F, MT-07, Ninja 400"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
              required
            />
          </div>

          {/* Year */}
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

          {/* Nickname */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Nickname (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Red Beast, Daily Commuter"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          {/* Current Mileage */}
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

          {/* Registration Number */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Registration Number
            </label>
            <input
              type="text"
              placeholder="e.g. ABC-123"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          {/* Purchase Date */}
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

          {/* Image URL */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Photo URL (Optional)
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

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Notes / Specs (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Engine displacement, custom mods, tire sizes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
          />
        </div>

        {/* Checkbox for default presets */}
        <label className="flex items-center gap-3 p-3 bg-zinc-800/40 border border-zinc-800 rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={createDefaultSchedules}
            onChange={(e) => setCreateDefaultSchedules(e.target.checked)}
            className="w-4 h-4 rounded text-rose-600 bg-zinc-900 border-zinc-700 focus:ring-rose-500"
          />
          <span className="text-xs text-zinc-300">
            Automatically configure recommended maintenance schedules (Oil, Chain, Brakes, General Inspection)
          </span>
        </label>

        {/* Action Buttons */}
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
            Save Motorcycle
          </button>
        </div>
      </form>
    </Modal>
  );
};
