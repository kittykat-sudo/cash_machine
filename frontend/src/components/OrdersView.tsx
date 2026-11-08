'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Sale, OrderStatus } from '../types';
import { fetchSales, updateSaleStatus, fetchWhatsAppStatus } from '../services/api';
import { formatDisplayPhone, sanitizeWhatsAppNumber, openWhatsAppChat, generateWhatsAppStatusText } from '../services/whatsapp';
import { WhatsAppActionModal } from './WhatsAppActionModal';
import { WhatsAppConnectModal } from './WhatsAppConnectModal';
import { ReceiptModal } from './ReceiptModal';
import {
  Search,
  Filter,
  RefreshCw,
  Clock,
  Printer,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Phone,
  MessageSquare,
  Receipt,
  Sparkles,
  ChevronRight,
  User,
  Calendar,
  Layers,
} from 'lucide-react';

interface OrdersViewProps {
  onNavigate?: (tab: any) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ onNavigate }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [selectedSaleForWhatsApp, setSelectedSaleForWhatsApp] = useState<Sale | null>(null);
  const [whatsappMode, setWhatsappMode] = useState<'bill' | 'status' | 'custom'>('status');
  const [whatsappInitialStatus, setWhatsappInitialStatus] = useState<OrderStatus | undefined>(undefined);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState<boolean>(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);

  useEffect(() => {
    loadOrders();
    checkWhatsAppStatus();
  }, [statusFilter]);

  const checkWhatsAppStatus = async () => {
    try {
      const res = await fetchWhatsAppStatus();
      setIsWhatsAppConnected(!!res?.connected);
    } catch {
      // silent
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 200 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const data = await fetchSales(params);
      setSales(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (sale: Sale, newStatus: OrderStatus, promptWhatsApp = true) => {
    try {
      const updated = await updateSaleStatus(sale.id, newStatus);
      setSales((prev) => prev.map((s) => (s.id === sale.id ? updated : s)));

      // If customer has phone number, prompt to send WhatsApp status update
      if (promptWhatsApp && sale.customer_phone) {
        setSelectedSaleForWhatsApp(updated);
        setWhatsappMode('status');
        setWhatsappInitialStatus(newStatus);
      }
    } catch (err: any) {
      alert(`Could not update order status: ${err.message || err}`);
    }
  };

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const matchBill = s.bill_number?.toLowerCase().includes(q);
      const matchCust = s.customer_name?.toLowerCase().includes(q);
      const matchPhone = s.customer_phone?.toLowerCase().includes(q);
      const matchNotes = s.notes?.toLowerCase().includes(q);
      const matchItems = (s.items || []).some((i) => i.description.toLowerCase().includes(q));
      return matchBill || matchCust || matchPhone || matchNotes || matchItems;
    });
  }, [sales, searchQuery]);

  // Counts by status
  const counts = useMemo(() => {
    const res = { all: sales.length, pending: 0, in_progress: 0, ready: 0, completed: 0 };
    sales.forEach((s) => {
      const st = (s.order_status || 'completed') as keyof typeof res;
      if (res[st] !== undefined) res[st]++;
    });
    return res;
  }, [sales]);

  const getStatusBadge = (status?: string) => {
    const st = (status || 'completed').toLowerCase();
    switch (st) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            ⏳ Queued / Pending
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            ⚙️ In Progress
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
            🎉 Ready for Pickup
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            ✅ Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            ❌ Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            {/* WhatsApp Logo */}
            <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.529 1.831.815 2.791.815 3.182 0 5.768-2.586 5.768-5.767.001-3.18-2.585-5.766-5.768-5.766zm9.965 5.766c0 5.519-4.481 10-10 10-1.748 0-3.385-.45-4.819-1.238l-7.177 1.88 1.916-6.996c-.859-1.488-1.353-3.216-1.353-5.056 0-5.519 4.481-10 10-10 5.519 0 10 4.481 10 10z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Print Orders & WhatsApp Progress</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Live
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Track print production progress and send automatic WhatsApp notifications & bills to customers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm border ${
              isWhatsAppConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 ring-2 ring-amber-400/40'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isWhatsAppConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{isWhatsAppConnected ? 'WhatsApp: 0720129297' : 'Link WhatsApp (0720129297)'}</span>
          </button>

          <button
            onClick={loadOrders}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Orders', count: counts.all },
            { id: 'pending', label: '⏳ Queued', count: counts.pending },
            { id: 'in_progress', label: '⚙️ In Progress', count: counts.in_progress },
            { id: 'ready', label: '🎉 Ready for Pickup', count: counts.ready },
            { id: 'completed', label: '✅ Completed', count: counts.completed },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border shadow-sm ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by bill #, customer, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading orders & jobs...</p>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 text-center">
          <AlertCircle className="w-10 h-10 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No orders found</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            {searchQuery
              ? `No orders matching "${searchQuery}". Try a different keyword.`
              : 'There are no orders in this category right now.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSales.map((sale) => {
            const hasPhone = Boolean(sale.customer_phone);
            const currentStatus = sale.order_status || 'completed';

            return (
              <div
                key={sale.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 border-b border-slate-100 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <span>{sale.bill_number}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(sale.created_at).toLocaleString('en-LK', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </div>
                    </div>
                    {getStatusBadge(currentStatus)}
                  </div>

                  {/* Customer Info */}
                  <div className="pt-1 flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sale.customer_name || 'Walk-in Customer'}</span>
                    </div>

                    {hasPhone ? (
                      <div className="flex items-center justify-between text-xs bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200/80">
                        <div className="flex items-center gap-1.5 font-mono font-semibold text-emerald-900">
                          {/* WhatsApp Icon */}
                          <svg className="w-3.5 h-3.5 fill-emerald-600" viewBox="0 0 24 24">
                            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.529 1.831.815 2.791.815 3.182 0 5.768-2.586 5.768-5.767.001-3.18-2.585-5.766-5.768-5.766zm9.965 5.766c0 5.519-4.481 10-10 10-1.748 0-3.385-.45-4.819-1.238l-7.177 1.88 1.916-6.996c-.859-1.488-1.353-3.216-1.353-5.056 0-5.519 4.481-10 10-10 5.519 0 10 4.481 10 10z" />
                          </svg>
                          <span>{formatDisplayPhone(sale.customer_phone)}</span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedSaleForWhatsApp(sale);
                            setWhatsappMode('status');
                          }}
                          className="text-[10px] text-emerald-700 hover:text-emerald-950 font-bold underline flex items-center gap-0.5"
                        >
                          <span>Chat</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                        <span>No WhatsApp connected</span>
                        <button
                          onClick={() => {
                            setSelectedSaleForWhatsApp(sale);
                            setWhatsappMode('bill');
                          }}
                          className="text-emerald-700 hover:underline font-semibold"
                        >
                          + Add Phone
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Special Job Notes if any */}
                  {sale.notes && (
                    <div className="p-2 bg-amber-50/80 border border-amber-200/60 rounded-xl text-xs text-amber-900 leading-snug">
                      <span className="font-bold text-[10px] uppercase text-amber-700 block">
                        Job Instructions:
                      </span>
                      {sale.notes}
                    </div>
                  )}
                </div>

                {/* Items Summary */}
                <div className="p-4 bg-slate-50/50 flex-1 space-y-1.5 text-xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Ordered Services:
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {(sale.items || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-700">
                        <span className="truncate pr-2">
                          <b className="text-slate-900">{Number(item.quantity)}x</b> {item.description}
                        </span>
                        <span className="font-mono text-slate-900 shrink-0">
                          Rs. {Number(item.line_total).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="text-xs text-slate-500 font-semibold">Total Amount:</span>
                    <span className="text-base font-black text-slate-900 font-mono">
                      Rs. {Number(sale.total).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Progress & WhatsApp Quick Actions Bar */}
                <div className="p-3 bg-white border-t border-slate-200 space-y-2">
                  {/* Status Progress Step Button */}
                  {currentStatus === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(sale, 'in_progress', true)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
                    >
                      <span>Start Printing (⚙️ In Progress)</span>
                    </button>
                  )}

                  {currentStatus === 'in_progress' && (
                    <button
                      onClick={() => handleStatusChange(sale, 'ready', true)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
                    >
                      <span>Mark Ready for Pickup (🎉 Ready)</span>
                    </button>
                  )}

                  {currentStatus === 'ready' && (
                    <button
                      onClick={() => handleStatusChange(sale, 'completed', true)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition"
                    >
                      <span>Mark Collected (✅ Complete)</span>
                    </button>
                  )}

                  {/* Secondary Action Row: WhatsApp Menu & View Receipt */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedSaleForWhatsApp(sale);
                        setWhatsappMode('status');
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs transition"
                      title="Send WhatsApp update or bill"
                    >
                      {/* WhatsApp Icon */}
                      <svg className="w-3.5 h-3.5 fill-emerald-600" viewBox="0 0 24 24">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.529 1.831.815 2.791.815 3.182 0 5.768-2.586 5.768-5.767.001-3.18-2.585-5.766-5.768-5.766zm9.965 5.766c0 5.519-4.481 10-10 10-1.748 0-3.385-.45-4.819-1.238l-7.177 1.88 1.916-6.996c-.859-1.488-1.353-3.216-1.353-5.056 0-5.519 4.481-10 10-10 5.519 0 10 4.481 10 10z" />
                      </svg>
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={() => setSelectedSaleForReceipt(sale)}
                      className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
                      title="View or reprint thermal bill"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Bill</span>
                    </button>
                  </div>
                </div>
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
          initialMode={whatsappMode}
          initialStatus={whatsappInitialStatus}
          onStatusUpdated={(updated) => {
            setSales((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          }}
        />
      )}

      {/* Thermal Bill Receipt Modal */}
      {selectedSaleForReceipt && (
        <ReceiptModal
          sale={selectedSaleForReceipt}
          onClose={() => setSelectedSaleForReceipt(null)}
        />
      )}

      {/* WhatsApp QR Connect Modal */}
      <WhatsAppConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnected={() => {
          setIsWhatsAppConnected(true);
        }}
      />
    </div>
  );
};
