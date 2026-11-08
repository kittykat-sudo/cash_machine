'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Sale } from '../types';
import { fetchSales } from '../services/api';
import { formatDisplayPhone } from '../services/whatsapp';
import { WhatsAppActionModal } from './WhatsAppActionModal';
import {
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  Receipt,
  Tag,
  CreditCard,
  Banknote,
  Building2,
  Calendar,
  X,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
  Phone,
} from 'lucide-react';

interface RevenueViewProps {
  onNavigate?: (tab: 'register' | 'orders' | 'revenue' | 'cashbook' | 'expenses' | 'reports' | 'items' | 'businessPlan') => void;
  initialMode?: 'daily' | 'monthly';
  initialDate?: string;
  initialMonth?: string;
  embedded?: boolean; // When rendered inside ReportsView
}

interface FlattenedSaleItem {
  id: number;
  saleId: number;
  billNumber: string;
  createdAt: string;
  customerName?: string | null;
  paymentMethod: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  category: string;
}

export const RevenueView: React.FC<RevenueViewProps> = ({
  onNavigate,
  initialMode = 'monthly',
  initialDate,
  initialMonth,
  embedded = false,
}) => {
  const [mode, setMode] = useState<'daily' | 'monthly'>(initialMode);
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    initialMonth || new Date().toISOString().slice(0, 7)
  );

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'itemized' | 'bills'>('itemized');
  const [expandedBills, setExpandedBills] = useState<Record<string, boolean>>({});
  const [selectedSaleForWhatsApp, setSelectedSaleForWhatsApp] = useState<Sale | null>(null);

  useEffect(() => {
    loadSales();
  }, [mode, selectedDate, selectedMonth]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const params = mode === 'daily' ? { date: selectedDate } : { month: selectedMonth };
      const data = await fetchSales(params);
      setSales(data);
    } catch (err) {
      console.error('Failed to load sales for revenue view:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'printing', label: 'Printing' },
    { id: 'photocopy', label: 'Photocopy' },
    { id: 'lamination', label: 'Lamination' },
    { id: 'binding', label: 'Binding' },
    { id: 'stationery', label: 'Stationery' },
    { id: 'other', label: 'Other / Custom' },
  ];

  // Flatten sales into individual item rows for line-by-line revenue analysis
  const allFlattenedItems: FlattenedSaleItem[] = useMemo(() => {
    const list: FlattenedSaleItem[] = [];
    sales.forEach((s) => {
      (s.items || []).forEach((item) => {
        list.push({
          id: item.id,
          saleId: s.id,
          billNumber: s.bill_number,
          createdAt: s.created_at,
          customerName: s.customer_name,
          paymentMethod: s.payment_method,
          description: item.description,
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unit_price) || 0,
          lineTotal: Number(item.line_total) || 0,
          category: item.category || 'other',
        });
      });
    });
    return list;
  }, [sales]);

  // Filter items by search query, category, and payment method
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allFlattenedItems.filter((item) => {
      // Search matching: item description, bill number, or customer name
      const matchesSearch =
        !query ||
        item.description.toLowerCase().includes(query) ||
        item.billNumber.toLowerCase().includes(query) ||
        (item.customerName && item.customerName.toLowerCase().includes(query));

      // Category matching
      const matchesCategory =
        selectedCategory === 'all' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();

      // Payment method matching
      const matchesPayment =
        selectedPaymentMethod === 'all' ||
        item.paymentMethod.toLowerCase() === selectedPaymentMethod.toLowerCase();

      return matchesSearch && matchesCategory && matchesPayment;
    });
  }, [allFlattenedItems, searchQuery, selectedCategory, selectedPaymentMethod]);

  // Filtered sales for the Bills view mode
  const filteredSales = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query && selectedCategory === 'all' && selectedPaymentMethod === 'all') {
      return sales;
    }
    // A sale matches if any of its items match the filtered items
    const matchingBillNumbers = new Set(filteredItems.map((item) => item.billNumber));
    return sales.filter((s) => matchingBillNumbers.has(s.bill_number));
  }, [sales, filteredItems, searchQuery, selectedCategory, selectedPaymentMethod]);

  // Aggregate stats
  const totalPeriodRevenue = useMemo(() => {
    return sales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  }, [sales]);

  const filteredRevenue = useMemo(() => {
    return filteredItems.reduce((acc, item) => acc + item.lineTotal, 0);
  }, [filteredItems]);

  const totalQuantitySold = useMemo(() => {
    return filteredItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [filteredItems]);

  const uniqueBillsCount = useMemo(() => {
    return new Set(filteredItems.map((item) => item.billNumber)).size;
  }, [filteredItems]);

  const toggleBillExpand = (billNumber: string) => {
    setExpandedBills((prev) => ({
      ...prev,
      [billNumber]: !prev[billNumber],
    }));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedPaymentMethod('all');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedPaymentMethod !== 'all';

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-LK', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-amber-200 text-amber-950 font-bold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className={`space-y-6 ${embedded ? '' : 'max-w-7xl mx-auto p-4 md:p-6'}`}>
      {/* Header & Date Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                How Revenue Was Created (Sales Breakdown)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Itemized sales details, customer bills, and individual sales item revenue filters.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
            onClick={loadSales}
            title="Refresh sales list"
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {onNavigate && (
            <button
              onClick={() => onNavigate('expenses')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition shadow-sm"
              title="Click to redirect into Expenses tab"
            >
              <span>Expenses Tab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Period Sales */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-xs font-bold uppercase text-slate-400 block mb-1">
            {mode === 'monthly' ? 'Total Month Revenue' : 'Total Day Revenue'}
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono">
            Rs. {totalPeriodRevenue.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">{sales.length} total bills issued</div>
        </div>

        {/* Filtered Revenue */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-200 bg-emerald-50/30">
          <span className="text-xs font-bold uppercase text-emerald-800 block mb-1">
            {hasActiveFilters ? 'Filtered Item Revenue' : 'All Items Revenue'}
          </span>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            Rs. {filteredRevenue.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-600 mt-1">
            {hasActiveFilters
              ? `${Math.round((filteredRevenue / (totalPeriodRevenue || 1)) * 100)}% of period revenue`
              : 'Sum of all sold line items'}
          </div>
        </div>

        {/* Units / Line Items Sold */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-xs font-bold uppercase text-slate-400 block mb-1">
            Quantity Sold
          </span>
          <div className="text-2xl font-black text-blue-700 font-mono">
            {totalQuantitySold.toLocaleString('en-LK', { maximumFractionDigits: 2 })} units
          </div>
          <div className="text-xs text-slate-500 mt-1">{filteredItems.length} line item record(s)</div>
        </div>

        {/* Unique Bills Count */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-xs font-bold uppercase text-slate-400 block mb-1">
            Associated Bills
          </span>
          <div className="text-2xl font-black text-slate-800 font-mono">
            {uniqueBillsCount} bills
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Avg Rs.{' '}
            {uniqueBillsCount > 0
              ? (filteredRevenue / uniqueBillsCount).toFixed(2)
              : '0.00'}{' '}
            / bill
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter each sales item using search (e.g. 'Color Print', 'Seal', 'Binding', 'A4', bill#, customer)..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle: Itemized vs Bills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto text-xs font-bold">
            <button
              onClick={() => setViewMode('itemized')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'itemized'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Each Sales Item</span>
            </button>
            <button
              onClick={() => setViewMode('bills')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'bills'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Bills / Invoices</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Pills: Category & Payment Method */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase mr-1">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase mr-1">Payment:</span>
            {['all', 'cash', 'card', 'bank'].map((pm) => (
              <button
                key={pm}
                onClick={() => setSelectedPaymentMethod(pm)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                  selectedPaymentMethod === pm
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {pm === 'all' ? 'All Payments' : pm}
              </button>
            ))}

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-2 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition flex items-center gap-1 border border-rose-200"
              >
                <X className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* REVENUE CREATION LIST */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center text-slate-400 font-medium flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
          <span>Loading sales revenue items...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-800">No sales items match your filter</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery
              ? `No items found matching "${searchQuery}". Check the spelling or reset your filters.`
              : 'No sales were recorded for this selected date/month.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : viewMode === 'itemized' ? (
        /* ITEMIZED VIEW: Every single sold item as a line item */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-bold text-slate-700">
              Showing <span className="text-emerald-700 font-mono">{filteredItems.length}</span> sold sales items
              {searchQuery && (
                <span className="text-slate-500 font-normal">
                  {' '}
                  matching &ldquo;<span className="font-semibold text-slate-800">{searchQuery}</span>&rdquo;
                </span>
              )}
            </div>
            <div className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
              Subtotal: Rs. {filteredRevenue.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Bill Number</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Sales Item / Service</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Line Total</th>
                  <th className="py-3 px-4 text-center">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredItems.map((item, idx) => (
                  <tr key={`${item.saleId}-${item.id}-${idx}`} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {highlightMatch(item.billNumber, searchQuery)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {item.customerName ? (
                        <span className="font-semibold text-slate-800">
                          {highlightMatch(item.customerName, searchQuery)}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Walk-in</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{highlightMatch(item.description, searchQuery)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-700 whitespace-nowrap">
                      {item.quantity.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-500 whitespace-nowrap">
                      Rs. {item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-sm text-emerald-700 whitespace-nowrap">
                      Rs. {item.lineTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          item.paymentMethod === 'cash'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.paymentMethod === 'card'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {item.paymentMethod}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* BILLS VIEW: Grouped by invoice / bill */
        <div className="space-y-4">
          <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
            <span>Showing {filteredSales.length} bills matching current filters</span>
            <span className="font-mono text-emerald-700 font-bold">
              Total: Rs. {filteredRevenue.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {filteredSales.map((sale) => {
            const isExpanded = expandedBills[sale.bill_number] !== false; // default expanded
            return (
              <div
                key={sale.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
              >
                {/* Bill Header */}
                <div
                  onClick={() => toggleBillExpand(sale.bill_number)}
                  className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/60 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {highlightMatch(sale.bill_number, searchQuery)}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            sale.payment_method === 'cash'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sale.payment_method === 'card'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {sale.payment_method}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {formatDateTime(sale.created_at)}
                        {sale.customer_name && (
                          <span>
                            {' '}
                            • Customer:{' '}
                            <strong className="text-slate-700">
                              {highlightMatch(sale.customer_name, searchQuery)}
                            </strong>
                          </span>
                        )}
                        {sale.customer_phone && (
                          <span className="text-emerald-700 font-mono font-semibold">
                            {' '}
                            • 📱 {formatDisplayPhone(sale.customer_phone)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSaleForWhatsApp(sale);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition shadow-sm"
                      title="Send WhatsApp Receipt or Progress"
                    >
                      <svg className="w-3.5 h-3.5 fill-emerald-600" viewBox="0 0 24 24">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.529 1.831.815 2.791.815 3.182 0 5.768-2.586 5.768-5.767.001-3.18-2.585-5.766-5.768-5.766zm9.965 5.766c0 5.519-4.481 10-10 10-1.748 0-3.385-.45-4.819-1.238l-7.177 1.88 1.916-6.996c-.859-1.488-1.353-3.216-1.353-5.056 0-5.519 4.481-10 10-10 5.519 0 10 4.481 10 10z" />
                      </svg>
                      <span>WhatsApp</span>
                    </button>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Bill Total</span>
                      <span className="font-mono font-black text-base text-emerald-700">
                        Rs. {Number(sale.total).toFixed(2)}
                      </span>
                    </div>
                    <div className="p-1 rounded-lg hover:bg-slate-200 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Items in this bill */}
                {isExpanded && (
                  <div className="p-4 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 uppercase font-semibold border-b border-slate-100 pb-2">
                          <th className="py-1 px-2">Item Description</th>
                          <th className="py-1 px-2 text-right">Qty</th>
                          <th className="py-1 px-2 text-right">Unit Price</th>
                          <th className="py-1 px-2 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-medium">
                        {(sale.items || []).map((item, i) => {
                          const matchesQuery =
                            searchQuery &&
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
                          return (
                            <tr
                              key={i}
                              className={matchesQuery ? 'bg-amber-50/60 font-semibold' : ''}
                            >
                              <td className="py-2 px-2 text-slate-800">
                                {highlightMatch(item.description, searchQuery)}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-slate-600">
                                {Number(item.quantity).toFixed(2)}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-slate-500">
                                Rs. {Number(item.unit_price).toFixed(2)}
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-bold text-emerald-700">
                                Rs. {Number(item.line_total).toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* WhatsApp Modal */}
      {selectedSaleForWhatsApp && (
        <WhatsAppActionModal
          isOpen={Boolean(selectedSaleForWhatsApp)}
          onClose={() => setSelectedSaleForWhatsApp(null)}
          sale={selectedSaleForWhatsApp}
          initialMode="bill"
        />
      )}
    </div>
  );
};
