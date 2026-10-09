'use client';

import React, { useState, useEffect } from 'react';
import { DailyReport, MonthlyReport } from '../types';
import { fetchDailyReport, fetchMonthlyReport } from '../services/api';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Layers,
  PieChart,
  RefreshCw,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [mode, setMode] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  const [dailyData, setDailyData] = useState<DailyReport | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mode === 'daily') {
      loadDaily(selectedDate);
    } else {
      loadMonthly(selectedMonth);
    }
  }, [mode, selectedDate, selectedMonth]);

  const loadDaily = async (date: string) => {
    try {
      setLoading(true);
      const data = await fetchDailyReport(date);
      setDailyData(data);
    } catch (err) {
      console.error('Failed to load daily report:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthly = async (month: string) => {
    try {
      setLoading(true);
      const data = await fetchMonthlyReport(month);
      setMonthlyData(data);
    } catch (err) {
      console.error('Failed to load monthly report:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* View Switcher & Date Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Day Summary, Profit & Audit
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Always-visible profit, cash positions, and automated day-close reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setMode('daily')}
              className={`px-3 py-1.5 rounded-lg transition ${
                mode === 'daily'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setMode('monthly')}
              className={`px-3 py-1.5 rounded-lg transition ${
                mode === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
          </div>

          {/* Date Picker */}
          {mode === 'daily' ? (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          ) : (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          )}

          <button
            onClick={() => (mode === 'daily' ? loadDaily(selectedDate) : loadMonthly(selectedMonth))}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium">Loading report metrics...</div>
      ) : mode === 'daily' && dailyData ? (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sales Revenue */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-slate-400">Total Sales</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                Rs. {Number(dailyData.total_sales).toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {dailyData.sales_count} bill(s) issued today
              </div>
            </div>

            {/* Total Expenses */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-slate-400">Total Expenses</span>
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-rose-600 font-mono">
                Rs. {Number(dailyData.total_expenses).toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {dailyData.expenses_count} expense record(s)
              </div>
            </div>

            {/* Net Profit */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-slate-400">Net Profit (Day)</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div
                className={`text-2xl font-black font-mono ${
                  Number(dailyData.net_profit) >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                Rs. {Number(dailyData.net_profit).toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Sales − Expenses</div>
            </div>

            {/* Current Drawer Cash */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-slate-400">Physical Cash Balance</span>
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-800 font-mono">
                Rs. {Number(dailyData.current_cashbook_balance).toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Live drawer running balance</div>
            </div>
          </div>

          {/* Payment Method Breakdown & 3-Way Reconciliation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Method Breakdown */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-slate-600" />
                <span>Payment Breakdown</span>
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-sm font-semibold text-slate-700">Cash Payments</span>
                  <span className="font-mono font-bold text-slate-900">
                    Rs. {Number(dailyData.cash_sales).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-sm font-semibold text-slate-700">Card Payments</span>
                  <span className="font-mono font-bold text-slate-900">
                    Rs. {Number(dailyData.card_sales).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-sm font-semibold text-slate-700">Bank Transfers</span>
                  <span className="font-mono font-bold text-slate-900">
                    Rs. {Number(dailyData.bank_sales).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* 3-Way Reconciliation Audit Card */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {dailyData.reconciliation.is_balanced ? (
                      <ShieldCheck className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-amber-500" />
                    )}
                    <h3 className="font-bold text-base text-slate-900">
                      Day-End Audit Reconciliation
                    </h3>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      dailyData.reconciliation.is_balanced
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {dailyData.reconciliation.is_balanced ? 'Balanced' : 'Discrepancy'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {dailyData.reconciliation.explanation}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Cashbook Running Balance
                    </span>
                    <span className="text-base font-black font-mono text-slate-900">
                      Rs. {Number(dailyData.reconciliation.cashbook_balance).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Sum(Cash In) − Sum(Cash Out)
                    </span>
                    <span className="text-base font-black font-mono text-slate-900">
                      Rs. {Number(dailyData.reconciliation.calculated_cash_position).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Variance / Difference
                    </span>
                    <span
                      className={`text-base font-black font-mono ${
                        dailyData.reconciliation.is_balanced
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      }`}
                    >
                      Rs. {Number(dailyData.reconciliation.difference).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 italic">
                * Rule: Assets (Cash + Inventory) ≈ Owner's Equity. Day reconciliation verifies no unrecorded cash left the drawer.
              </div>
            </div>
          </div>
        </div>
      ) : mode === 'monthly' && monthlyData ? (
        <div className="space-y-6">
          {/* Monthly KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-xs font-bold uppercase text-slate-400 block mb-1">
                Monthly Revenue
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono">
                Rs. {Number(monthlyData.total_sales).toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1">{monthlyData.sales_count} bills</div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-xs font-bold uppercase text-slate-400 block mb-1">
                Monthly Expenses
              </span>
              <div className="text-2xl font-black text-rose-600 font-mono">
                Rs. {Number(monthlyData.total_expenses).toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1">{monthlyData.expenses_count} expenses</div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-xs font-bold uppercase text-slate-400 block mb-1">
                Net Profit
              </span>
              <div
                className={`text-2xl font-black font-mono ${
                  Number(monthlyData.net_profit) >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                Rs. {Number(monthlyData.net_profit).toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Retained Earnings</div>
            </div>
          </div>

          {/* Breakdown grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sales by Service Category */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-base text-slate-900 mb-4">Sales by Category</h3>
              {Object.keys(monthlyData.category_breakdown).length === 0 ? (
                <p className="text-xs text-slate-400">No category sales data for this month.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(monthlyData.category_breakdown).map(([cat, amount]) => (
                    <div key={cat} className="flex justify-between items-center text-sm">
                      <span className="capitalize font-medium text-slate-700">{cat}</span>
                      <span className="font-mono font-bold text-slate-900">
                        Rs. {amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expenses by Category */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-base text-slate-900 mb-4">Expenses by Category</h3>
              {Object.keys(monthlyData.expense_breakdown).length === 0 ? (
                <p className="text-xs text-slate-400">No expense records for this month.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(monthlyData.expense_breakdown).map(([cat, amount]) => (
                    <div key={cat} className="flex justify-between items-center text-sm">
                      <span className="capitalize font-medium text-slate-700">{cat}</span>
                      <span className="font-mono font-bold text-rose-600">
                        Rs. {amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
