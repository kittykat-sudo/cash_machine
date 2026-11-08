'use client';

import React from 'react';
import { ShoppingCart, TrendingUp, BookOpen, Receipt, BarChart3, Settings2, Wallet, Landmark, Clock } from 'lucide-react';

interface NavbarProps {
  activeTab: 'register' | 'orders' | 'revenue' | 'cashbook' | 'expenses' | 'reports' | 'items' | 'businessPlan';
  setActiveTab: (tab: 'register' | 'orders' | 'revenue' | 'cashbook' | 'expenses' | 'reports' | 'items' | 'businessPlan') => void;
  cashBalance: number;
  cashierName: string;
  hasOpeningFloat: boolean;
  onOpenDrawerModal: () => void;
  onOpenWhatsAppModal?: () => void;
  isWhatsAppConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cashBalance,
  cashierName,
  hasOpeningFloat,
  onOpenDrawerModal,
  onOpenWhatsAppModal,
  isWhatsAppConnected,
}) => {
  const tabs = [
    { id: 'register', label: 'Cash Register', icon: ShoppingCart },
    { id: 'orders', label: 'Orders & WhatsApp', icon: Clock },
    { id: 'revenue', label: 'Revenue', icon: TrendingUp },
    { id: 'cashbook', label: 'Cashbook', icon: BookOpen },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'reports', label: 'Day Summary & Profit', icon: BarChart3 },
    { id: 'items', label: 'Price List', icon: Settings2 },
    { id: 'businessPlan', label: 'Loan & Month-End', icon: Landmark },
  ] as const;

  return (
    <header className="bg-slate-900 text-white shadow-md no-print sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-xl text-slate-950 shadow">
            CP
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight leading-none text-white">
              CHATHURA PRINTERS
            </h1>
            <span className="text-xs text-slate-400">Cash Register & POS</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Drawer & Cashier Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenDrawerModal}
            className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border transition-all text-left shadow-sm ${
              hasOpeningFloat
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
                : 'bg-amber-950/70 border-amber-500/80 text-amber-200 hover:bg-amber-900/80 ring-2 ring-amber-500/40'
            }`}
            title="Click to view or set morning drawer float"
          >
            <Wallet className={`w-4 h-4 ${hasOpeningFloat ? 'text-emerald-400' : 'text-amber-400'}`} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Cash Drawer</span>
                {!hasOpeningFloat && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-amber-400 text-slate-950 font-extrabold rounded uppercase">
                    Set Float
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-emerald-400 font-mono">
                Rs. {Number(cashBalance).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </button>

          {onOpenWhatsAppModal && (
            <button
              onClick={onOpenWhatsAppModal}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition shadow-sm ${
                isWhatsAppConnected
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-amber-950/60 border-amber-500/60 text-amber-300 hover:bg-amber-900/60'
              }`}
              title={isWhatsAppConnected ? 'WhatsApp 0720129297 Connected' : 'Click to Link WhatsApp 0720129297'}
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.529 1.831.815 2.791.815 3.182 0 5.768-2.586 5.768-5.767.001-3.18-2.585-5.766-5.768-5.766zm9.965 5.766c0 5.519-4.481 10-10 10-1.748 0-3.385-.45-4.819-1.238l-7.177 1.88 1.916-6.996c-.859-1.488-1.353-3.216-1.353-5.056 0-5.519 4.481-10 10-10 5.519 0 10 4.481 10 10z" />
              </svg>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isWhatsAppConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="hidden md:inline">{isWhatsAppConnected ? '0720129297' : 'Link WhatsApp'}</span>
              </div>
            </button>
          )}

          <div className="hidden sm:block text-right">
            <div className="text-xs font-semibold text-slate-200">{cashierName}</div>
            <div className="text-[10px] text-emerald-400">Online</div>
          </div>
        </div>
      </div>
    </header>
  );
};
