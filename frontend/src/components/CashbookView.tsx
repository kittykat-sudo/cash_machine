'use client';

import React, { useState, useEffect } from 'react';
import { CashbookEntry } from '../types';
import { fetchCashbook, adjustCash } from '../services/api';
import { ArrowDownLeft, ArrowUpRight, PlusCircle, MinusCircle, RefreshCw, Filter } from 'lucide-react';

interface CashbookViewProps {
  onBalanceUpdated: () => void;
}

export const CashbookView: React.FC<CashbookViewProps> = ({ onBalanceUpdated }) => {
  const [entries, setEntries] = useState<CashbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [adjType, setAdjType] = useState<'cash_in' | 'cash_out'>('cash_in');
  const [adjCategory, setAdjCategory] = useState<'owner_deposit' | 'owner_withdrawal'>('owner_deposit');
  const [adjAmount, setAdjAmount] = useState<number>(1000);
  const [adjNote, setAdjNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCashbook();
  }, []);

  const loadCashbook = async () => {
    try {
      setLoading(true);
      const data = await fetchCashbook();
      setEntries(data);
    } catch (err) {
      console.error('Failed to load cashbook:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adjAmount <= 0) return;
    try {
      setSubmitting(true);
      await adjustCash({
        amount: adjAmount,
        entry_type: adjType,
        category: adjCategory,
        note: adjNote.trim() || undefined,
      });
      setModalOpen(false);
      setAdjNote('');
      loadCashbook();
      onBalanceUpdated();
    } catch (err: any) {
      alert(`Adjustment error: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Cashbook & Drawer Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable transaction record. Every counter sale, expense, and owner adjustment is automatically booked here.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadCashbook}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
            title="Refresh entries"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setAdjType('cash_in');
              setAdjCategory('owner_deposit');
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Deposit / Float</span>
          </button>

          <button
            onClick={() => {
              setAdjType('cash_out');
              setAdjCategory('owner_withdrawal');
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <MinusCircle className="w-4 h-4" />
            <span>Owner Drawing</span>
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Note / Reference</th>
                <th className="py-3 px-4 text-right">Amount (LKR)</th>
                <th className="py-3 px-4 text-right">Running Balance (LKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading cashbook records...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No cashbook entries recorded yet.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const isCashIn = entry.entry_type === 'cash_in';
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-xs font-mono text-slate-600 whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleString('en-LK', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                            isCashIn
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isCashIn ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          {entry.entry_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold capitalize text-slate-700">
                        {entry.category.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {entry.note || (entry.reference_table ? `${entry.reference_table} #${entry.reference_id}` : '-')}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold text-xs whitespace-nowrap ${
                          isCashIn ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isCashIn ? '+' : '-'} Rs. {Number(entry.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-sm text-slate-900 whitespace-nowrap">
                        Rs. {Number(entry.running_balance).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Capital Adjustment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {adjType === 'cash_in' ? 'Deposit / Cash Float' : 'Owner Cash Drawing'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Updates both cashbook running balance and owner's equity ledger.
            </p>

            <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Amount (LKR)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-base font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Note / Reason
                </label>
                <input
                  type="text"
                  placeholder={adjType === 'cash_in' ? 'e.g. Additional change float' : 'e.g. Personal cash withdrawal'}
                  value={adjNote}
                  onChange={(e) => setAdjNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting || adjAmount <= 0}
                  className={`flex-1 py-3 text-white font-bold rounded-xl text-sm shadow transition ${
                    adjType === 'cash_in'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submitting ? 'Recording...' : 'Record Entry'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
