'use client';

import React, { useState, useEffect } from 'react';
import { Expense } from '../types';
import { fetchExpenses, createExpense } from '../services/api';
import { Plus, Receipt, Calendar, Tag, FileText, Banknote } from 'lucide-react';

interface ExpensesViewProps {
  onExpenseAdded: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ onExpenseAdded }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [category, setCategory] = useState('paper');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await fetchExpenses();
      setExpenses(data);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'paper', label: 'Paper Stock (Reams/Boxes)' },
    { id: 'ink', label: 'Toner & Ink Cartridges' },
    { id: 'electricity', label: 'Electricity & Utilities' },
    { id: 'rent', label: 'Shop Rent' },
    { id: 'maintenance', label: 'Machine Repair & Servicing' },
    { id: 'stationery', label: 'Stationery Supplies' },
    { id: 'other', label: 'Other Miscellaneous' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    try {
      setSubmitting(true);
      await createExpense({
        category,
        amount: parsedAmount,
        description: description.trim() || undefined,
        expense_date: expenseDate,
      });

      setDescription('');
      setAmount('');
      loadExpenses();
      onExpenseAdded();
    } catch (err: any) {
      alert(`Failed to add expense: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT: Quick Record Expense Form */}
      <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Record Expense</h3>
            <p className="text-xs text-slate-500">Auto-books cash out from drawer</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Date</span>
            </label>
            <input
              type="date"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Category</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
              <Banknote className="w-3.5 h-3.5 text-slate-400" />
              <span>Amount (Rs.)</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="any"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-base font-bold font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Description / Supplier Note</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. 5x Double-A A4 80gsm Reams from City Paper"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !amount || parseFloat(amount) <= 0}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : 'Add Expense'}</span>
          </button>
        </form>
      </div>

      {/* RIGHT: Recent Expenses History */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900">Recent Expense Logs</h3>
          <span className="text-xs text-slate-500">{expenses.length} entries</span>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount (LKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    Loading expense records...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    No expenses recorded yet.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-xs font-mono text-slate-600 whitespace-nowrap">
                      {exp.expense_date}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 capitalize">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700">
                      {exp.description || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-xs text-rose-600 whitespace-nowrap">
                      - Rs. {Number(exp.amount).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
