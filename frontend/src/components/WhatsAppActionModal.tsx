'use client';

import React, { useState, useEffect } from 'react';
import { Sale, OrderStatus } from '../types';
import {
  sanitizeWhatsAppNumber,
  formatDisplayPhone,
  generateWhatsAppBillText,
  generateWhatsAppStatusText,
  openWhatsAppChat,
} from '../services/whatsapp';
import {
  sendSaleWhatsApp,
  updateSale,
  updateSaleStatus,
  fetchWhatsAppStatus,
} from '../services/api';
import { WhatsAppConnectModal } from './WhatsAppConnectModal';
import {
  X,
  Copy,
  Check,
  Send,
  Phone,
  MessageSquare,
  Receipt,
  Clock,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  QrCode,
  RefreshCw,
  Zap,
} from 'lucide-react';

interface WhatsAppActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale;
  initialMode?: 'bill' | 'status' | 'custom';
  initialStatus?: OrderStatus;
  onStatusUpdated?: (newSale: Sale) => void;
}

export const WhatsAppActionModal: React.FC<WhatsAppActionModalProps> = ({
  isOpen,
  onClose,
  sale,
  initialMode = 'bill',
  initialStatus,
  onStatusUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'bill' | 'status' | 'custom'>(initialMode);
  const [phone, setPhone] = useState<string>(sale.customer_phone || '');
  const [status, setStatus] = useState<OrderStatus>(initialStatus || sale.order_status || 'ready');
  const [customNote, setCustomNote] = useState<string>('');
  const [customBody, setCustomBody] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [sendingDirect, setSendingDirect] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  // WhatsApp Bridge connection state
  const [bridgeStatus, setBridgeStatus] = useState<any>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);

  const checkConnection = async () => {
    try {
      const res = await fetchWhatsAppStatus();
      setBridgeStatus(res);
    } catch (e) {
      console.warn('Failed to fetch WhatsApp bridge status:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setPhone(sale.customer_phone || '');
      setActiveTab(initialMode);
      if (initialStatus) setStatus(initialStatus);
      setCopied(false);
      setFeedback(null);
      checkConnection();
    }
  }, [isOpen, sale, initialMode, initialStatus]);

  if (!isOpen) return null;

  const isConnected = !!bridgeStatus?.connected;
  const connectedNumber = bridgeStatus?.phone || '0720129297';

  // Compute message text based on active tab
  let messageText = '';
  if (activeTab === 'bill') {
    messageText = generateWhatsAppBillText(sale);
  } else if (activeTab === 'status') {
    messageText = generateWhatsAppStatusText(sale, status, customNote);
  } else {
    messageText =
      customBody.trim() ||
      `Hello ${sale.customer_name || 'Customer'},\nRegarding your order #${sale.bill_number} at Chathura Printers: `;
  }

  const cleanPhone = sanitizeWhatsAppNumber(phone);
  const isValidPhone = cleanPhone.length >= 9;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Could not copy automatically. Please copy the text from the preview box.');
    }
  };

  // 1. Direct Background Automatic Send (NO new window opened!)
  const handleSendAutomatic = async () => {
    if (!isValidPhone) {
      alert('Please enter a valid WhatsApp phone number (e.g. 077 8683088).');
      return;
    }

    try {
      setSendingDirect(true);
      setFeedback(null);

      // Save customer phone to order if modified
      if (phone.trim() && phone.trim() !== (sale.customer_phone || '')) {
        try {
          await updateSale(sale.id, { customer_phone: phone.trim() });
        } catch (e) {
          console.warn('Failed to persist phone update:', e);
        }
      }

      // If sending a progress status update, update order status in database too
      if (activeTab === 'status' && status !== sale.order_status) {
        try {
          const updated = await updateSaleStatus(sale.id, status);
          if (onStatusUpdated) onStatusUpdated(updated);
        } catch (e) {
          console.warn('Failed to update sale status:', e);
        }
      }

      const res = await sendSaleWhatsApp(sale.id, {
        message_type: activeTab,
        status: activeTab === 'status' ? status : undefined,
        phone: cleanPhone,
        custom_message: activeTab === 'status' ? customNote : activeTab === 'custom' ? customBody : undefined,
        send_direct: true,
      });

      if (res.sent_via_api) {
        setFeedback({
          success: true,
          msg: `✓ Sent automatically via WhatsApp (${connectedNumber})! The message is now visible in your WhatsApp phone app.`,
        });
        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        // If not sent via bridge, tell user to link device
        setFeedback({
          success: false,
          msg: res.details || 'WhatsApp account 0720129297 is not linked. Please click "Link WhatsApp" below.',
        });
      }
    } catch (err: any) {
      setFeedback({
        success: false,
        msg: err.message || 'Failed to send automatically. Please ensure WhatsApp is linked.',
      });
    } finally {
      setSendingDirect(false);
    }
  };

  // 2. Fallback: Open WhatsApp Web / App
  const handleSendViaWhatsAppWeb = async () => {
    if (!isValidPhone) {
      alert('Please enter a valid WhatsApp phone number.');
      return;
    }

    if (phone.trim() && phone.trim() !== (sale.customer_phone || '')) {
      try {
        await updateSale(sale.id, { customer_phone: phone.trim() });
      } catch (e) {
        console.warn('Failed to persist phone update:', e);
      }
    }

    openWhatsAppChat(cleanPhone, messageText);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
                <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.529 1.831.815 2.791.815 3.182 0 5.768-2.586 5.768-5.767.001-3.18-2.585-5.766-5.768-5.766zm9.965 5.766c0 5.519-4.481 10-10 10-1.748 0-3.385-.45-4.819-1.238l-7.177 1.88 1.916-6.996c-.859-1.488-1.353-3.216-1.353-5.056 0-5.519 4.481-10 10-10 5.519 0 10 4.481 10 10z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base tracking-tight leading-tight">
                    WhatsApp Messaging
                  </h3>
                  {isConnected ? (
                    <span className="flex items-center gap-1 bg-emerald-500/40 text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                      0720129297 Connected
                    </span>
                  ) : (
                    <button
                      onClick={() => setIsConnectModalOpen(true)}
                      className="flex items-center gap-1 bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded-full hover:bg-amber-300 transition"
                    >
                      <QrCode className="w-2.5 h-2.5" />
                      Link 0720129297
                    </button>
                  )}
                </div>
                <p className="text-xs text-emerald-100 font-medium">
                  Bill #{sale.bill_number} • {sale.customer_name || 'Customer'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-100 p-1.5 border-b border-slate-200 gap-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('bill')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition ${
                activeTab === 'bill'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Bill Receipt</span>
            </button>

            <button
              onClick={() => setActiveTab('status')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition ${
                activeTab === 'status'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Progress Update</span>
            </button>

            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition ${
                activeTab === 'custom'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Custom Message</span>
            </button>
          </div>

          {/* Content Body */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50">
            {/* Connection alert banner if not connected */}
            {!isConnected && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    To send automatically without popups, link <strong>0720129297</strong> once.
                  </span>
                </div>
                <button
                  onClick={() => setIsConnectModalOpen(true)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] shrink-0 transition"
                >
                  Link Now
                </button>
              </div>
            )}

            {/* Customer WhatsApp Number input */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Recipient WhatsApp Number</span>
                </label>
                {cleanPhone && (
                  <span className="text-[11px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {formatDisplayPhone(phone)}
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 077 8683088 or +94 77..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Sri Lankan local numbers (077...) are automatically formatted to international (+94...).
              </p>
            </div>

            {/* Progress Options if on 'status' tab */}
            {activeTab === 'status' && (
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Order Progress to Notify:
                </label>

                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  {[
                    { id: 'pending', label: 'Queued / Received', icon: '⏳', desc: 'Order received' },
                    { id: 'in_progress', label: 'Printing / In Progress', icon: '⚙️', desc: 'Job started' },
                    { id: 'ready', label: 'Ready for Pickup', icon: '🎉', desc: 'Ready at counter' },
                    { id: 'completed', label: 'Completed', icon: '✅', desc: 'Order collected' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStatus(s.id as OrderStatus)}
                      className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition ${
                        status === s.id
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-base">{s.icon}</span>
                      <div>
                        <div className="font-bold">{s.label}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{s.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Optional Note for Customer:
                  </label>
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="e.g. Please bring your USB drive or reference sample"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Custom Message Field if on 'custom' tab */}
            {activeTab === 'custom' && (
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Type Custom WhatsApp Message:
                </label>
                <textarea
                  rows={3}
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  placeholder="Type any inquiry or notification for this customer..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Message Preview Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>WhatsApp Message Preview</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal font-mono">
                  {messageText.length} characters
                </span>
              </div>

              <div className="relative bg-[#EFEAE2] p-4 rounded-2xl border border-slate-300/80 shadow-inner">
                <div className="bg-white p-3 rounded-2xl shadow-sm text-xs font-sans text-slate-800 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto border border-slate-200">
                  {messageText}
                </div>
              </div>
            </div>

            {/* Feedback alert */}
            {feedback && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  feedback.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {feedback.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{feedback.msg}</span>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="p-4 bg-white border-t border-slate-200 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {/* PRIMARY ACTION: Send Automatically without opening new window! */}
              {isConnected ? (
                <button
                  onClick={handleSendAutomatic}
                  disabled={!isValidPhone || sendingDirect}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm shadow-md transition ${
                    !isValidPhone || sendingDirect
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 active:scale-98'
                  }`}
                >
                  {sendingDirect ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending from 0720129297...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                      <span>Send Automatically (0720129297)</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setIsConnectModalOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-md active:scale-98 transition"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Link 0720129297 to Send Automatically</span>
                </button>
              )}
            </div>

            {/* Secondary fallback link */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>
                {isConnected ? '✓ Messages sync directly to your phone WhatsApp' : 'QR scan required once'}
              </span>
              <button
                onClick={handleSendViaWhatsAppWeb}
                disabled={!isValidPhone}
                className="text-emerald-700 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Or open in WhatsApp Web</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Connect QR / Pairing Code Modal */}
      <WhatsAppConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnected={() => {
          checkConnection();
        }}
      />
    </>
  );
};
