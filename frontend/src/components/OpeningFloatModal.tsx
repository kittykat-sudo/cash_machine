'use client';

import React, { useState } from 'react';
import { setOpeningFloat } from '../services/api';
import { Sun, Wallet, Check, X, AlertCircle } from 'lucide-react';

interface OpeningFloatModalProps {
  currentBalance: number;
  isOpen: boolean;
  onClose: () => void;
  onFloatRecorded: () => void;
}

export const OpeningFloatModal: React.FC<OpeningFloatModalProps> = ({
  currentBalance,
  isOpen,
  onClose,
  onFloatRecorded,
}) => {
  const [amountStr, setAmountStr] = useState<string>('2000');
  const [note, setNote] = useState<string>('Morning opening cash float');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const presets = [0, 1000, 2000, 3000, 5000, 10000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount < 0) {
      setError('Please enter a valid non-negative amount.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await setOpeningFloat(amount, note.trim() || undefined);
      onFloatRecorded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to set morning float');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">
                Morning Cash Drawer Float
              </h3>
              <p className="text-xs text-slate-500">Count physical cash in till to start day</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Balance Display */}
          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-slate-400" />
              <span>Current Drawer Balance:</span>
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              Rs. {Number(currentBalance).toFixed(2)}
            </span>
          </div>

          {/* Amount input */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Opening Float Amount (LKR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-sm">
                Rs.
              </span>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="2000.00"
                className="w-full pl-12 pr-4 py-2.5 bg-white border-2 border-slate-300 rounded-2xl text-xl font-mono font-black text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Presets */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Quick Float Presets
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {presets.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setAmountStr(p.toString())}
                  className="py-1.5 px-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition"
                >
                  Rs. {p.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Note / Cashier Remark
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Morning cash drawer float"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 text-sm transition"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Set Float & Open Register'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 border border-slate-300 text-slate-700 font-semibold rounded-2xl text-sm hover:bg-slate-100 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
