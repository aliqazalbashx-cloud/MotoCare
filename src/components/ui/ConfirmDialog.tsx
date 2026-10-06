import React from 'react';
import { Modal } from './Modal.tsx';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          {isDestructive && (
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
          <p className="text-sm text-zinc-300 leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium rounded-xl text-white transition flex items-center gap-2 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700'
                : 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700'
            } disabled:opacity-50`}
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
