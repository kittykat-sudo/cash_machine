'use client';

import React, { useState, useEffect } from 'react';
import {
  fetchWhatsAppStatus,
  requestWhatsAppPairingCode,
  logoutWhatsApp,
} from '../services/api';
import {
  X,
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface WhatsAppConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export const WhatsAppConnectModal: React.FC<WhatsAppConnectModalProps> = ({
  isOpen,
  onClose,
  onConnected,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<any>(null);
  const [pairingMode, setPairingMode] = useState<'qr' | 'code'>('qr');
  const [pairingPhone, setPairingPhone] = useState<string>('0720129297');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [requestingCode, setRequestingCode] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  const loadStatus = async () => {
    try {
      setErrorMsg(null);
      const data = await fetchWhatsAppStatus();
      setStatus(data);
      if (data?.pairing_code && !pairingCode) {
        setPairingCode(data.pairing_code);
      }
      if (data?.connected && onConnected) {
        onConnected();
      }
    } catch (err: any) {
      console.warn('Failed to load WhatsApp status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    loadStatus();

    // Poll status every 3 seconds while open
    const interval = setInterval(loadStatus, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const isConnected = !!status?.connected;
  const connectedNumber = status?.phone || '0720129297';
  const qrImage = status?.qr;

  const handleRequestPairingCode = async () => {
    try {
      setRequestingCode(true);
      setErrorMsg(null);
      const res = await requestWhatsAppPairingCode(pairingPhone);
      if (res.pairingCode) {
        setPairingCode(res.pairingCode);
      } else if (res.alreadyConnected) {
        loadStatus();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request pairing code');
    } finally {
      setRequestingCode(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to disconnect WhatsApp (0720129297)?')) return;
    try {
      setLoggingOut(true);
      await logoutWhatsApp();
      setPairingCode(null);
      await loadStatus();
    } catch (err: any) {
      alert('Failed to disconnect: ' + err.message);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
              <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.529 1.831.815 2.791.815 3.182 0 5.768-2.586 5.768-5.767.001-3.18-2.585-5.766-5.768-5.766zm9.965 5.766c0 5.519-4.481 10-10 10-1.748 0-3.385-.45-4.819-1.238l-7.177 1.88 1.916-6.996c-.859-1.488-1.353-3.216-1.353-5.056 0-5.519 4.481-10 10-10 5.519 0 10 4.481 10 10z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight leading-tight">
                Connect Shop WhatsApp
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                Automatic messaging via 0720129297
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 bg-slate-50 flex-1">
          {isConnected ? (
            /* Connected state */
            <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full mb-2">
                  Connected & Active
                </span>
                <h4 className="text-lg font-bold text-slate-800">
                  {connectedNumber}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Chathura Printers WhatsApp is ready. All bills and order progress updates will be sent automatically from this account and appear in your WhatsApp chats!
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-3">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{loggingOut ? 'Disconnecting...' : 'Disconnect / Switch Account'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Not connected state - Pairing options */
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Link your WhatsApp once:</span>
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    Link <strong>0720129297</strong> using WhatsApp Linked Devices. Messages will send automatically in background without opening any browser tabs.
                  </div>
                </div>
              </div>

              {/* Tabs: QR Code or 8-digit Code */}
              <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold gap-1">
                <button
                  onClick={() => setPairingMode('qr')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                    pairingMode === 'qr'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan QR Code</span>
                </button>
                <button
                  onClick={() => setPairingMode('code')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                    pairingMode === 'code'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Use 8-Digit Code</span>
                </button>
              </div>

              {/* Tab 1: QR Code */}
              {pairingMode === 'qr' && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
                  <div className="flex justify-center">
                    {qrImage ? (
                      <div className="p-3 bg-white border-2 border-slate-300 rounded-2xl shadow-inner">
                        <img
                          src={qrImage}
                          alt="WhatsApp QR Code"
                          className="w-56 h-56 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-56 h-56 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                        <span className="text-xs font-medium">Generating QR code...</span>
                      </div>
                    )}
                  </div>

                  <div className="text-left text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>How to link:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                      <li>Open WhatsApp on phone <strong>0720129297</strong></li>
                      <li>Tap <strong>Settings</strong> (or 3 dots) &rarr; <strong>Linked Devices</strong></li>
                      <li>Tap <strong>Link a Device</strong> and point your camera here</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Tab 2: Pairing Code */}
              {pairingMode === 'code' && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      WhatsApp Phone Number:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={pairingPhone}
                        onChange={(e) => setPairingPhone(e.target.value)}
                        placeholder="0720129297"
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        onClick={handleRequestPairingCode}
                        disabled={requestingCode}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        {requestingCode ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Smartphone className="w-3.5 h-3.5" />
                        )}
                        <span>{pairingCode ? 'New Code' : 'Get Code'}</span>
                      </button>
                    </div>
                  </div>

                  {pairingCode ? (
                    <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-center space-y-2">
                      <div className="text-xs font-semibold text-emerald-900">
                        Enter this 8-digit code on WhatsApp:
                      </div>
                      <div className="text-2xl sm:text-3xl font-mono font-extrabold tracking-widest text-emerald-800 bg-white py-2.5 px-4 rounded-xl shadow-inner border border-emerald-200 select-all">
                        {pairingCode.length === 8 ? `${pairingCode.slice(0, 4)} - ${pairingCode.slice(4)}` : pairingCode}
                      </div>
                      <div className="text-[11px] text-emerald-700 text-left pt-2 space-y-1">
                        <div>1. Open WhatsApp on <strong>{pairingPhone}</strong></div>
                        <div>2. Tap <strong>Linked Devices</strong> &rarr; <strong>Link a Device</strong></div>
                        <div>3. Tap <strong>"Link with phone number instead"</strong> at the bottom of the camera screen</div>
                        <div>4. Type the 8 characters above</div>
                        <div className="text-amber-800 font-semibold pt-1">
                          💡 Tip: Codes expire quickly. If it says "Couldn't link device", click "New Code" or switch to the "Scan QR Code" tab for instant connection!
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Click "Get Code" above to receive an 8-character code directly without needing to scan with a camera.
                    </p>
                  )}
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  {errorMsg}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>End-to-End Encrypted via Baileys Multi-Device</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
          >
            {isConnected ? 'Done' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
