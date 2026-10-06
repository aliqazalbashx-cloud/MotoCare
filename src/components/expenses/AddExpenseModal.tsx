import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';

interface AddExpenseModalProps {
  isOpen: boolean;
  motorcycles: Array<{ id: number; brand: string; model: string; nickname?: string | null }>;
  defaultMotorcycleId?: number;
  onClose: () => void;
  onSuccess: (newExpense: any) => void;
}

const EXPENSE_CATEGORIES = [
  'Maintenance',
  'Fuel',
  'Parts',
  'Accessories',
  'Insurance',
  'Registration',
  'Other',
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  motorcycles,
  defaultMotorcycleId,
  onClose,
  onSuccess,
}) => {
  const { apiFetch } = useAuth();
  const { success, error } = useToast();

  const [motorcycleId, setMotorcycleId] = useState<number>(defaultMotorcycleId || motorcycles[0]?.id || 0);
  const [category, setCategory] = useState('Fuel');
  const [amount, setAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultMotorcycleId) {
      setMotorcycleId(defaultMotorcycleId);
    } else if (motorcycles.length > 0 && !motorcycleId) {
      setMotorcycleId(motorcycles[0].id);
    }
  }, [defaultMotorcycleId, motorcycles, motorcycleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!motorcycleId) {
      setFormError('Please select a motorcycle.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!description.trim()) {
      setFormError('Please enter a description for the expense.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        motorcycleId,
        category,
        amount: parsedAmount,
        expenseDate,
        description: description.trim(),
      };

      const result = await apiFetch('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      success('Expense recorded successfully.');
      setAmount('');
      setDescription('');
      onSuccess(result);
      onClose();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Failed to save expense.');
      error(err.message || 'Failed to save expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Motorcycle Expense"
      description="Track fuel, parts, insurance, gear, or general motorcycle spending."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
            {formError}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Motorcycle *
          </label>
          <select
            value={motorcycleId}
            onChange={(e) => setMotorcycleId(parseInt(e.target.value, 10))}
            className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
            required
          >
            {motorcycles.map((b) => (
              <option key={b.id} value={b.id}>
                {b.brand} {b.model} {b.nickname ? `(${b.nickname})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
              required
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Amount (Rs. / $) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Date *
          </label>
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Description *
          </label>
          <input
            type="text"
            placeholder="e.g. Shell V-Power 12 Litres, Mobile Mount, Brake Pads"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-zinc-800/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-rose-500 transition"
            required
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
            Save Expense
          </button>
        </div>
      </form>
    </Modal>
  );
};
