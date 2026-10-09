'use client';

import React from 'react';
import { ShoppingCart, BookOpen, Receipt, BarChart3, Settings2, Wallet } from 'lucide-react';

interface NavbarProps {
  activeTab: 'register' | 'cashbook' | 'expenses' | 'reports' | 'items';
  setActiveTab: (tab: 'register' | 'cashbook' | 'expenses' | 'reports' | 'items') => void;
  cashBalance: number;
  cashierName: string;
  hasOpeningFloat: boolean;
  onOpenDrawerModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cashBalance,
  cashierName,
  hasOpeningFloat,
  onOpenDrawerModal,
}) => {
  const tabs = [
    { id: 'register', label: 'Cash Register', icon: ShoppingCart },
    { id: 'cashbook', label: 'Cashbook', icon: BookOpen },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'reports', label: 'Day Summary & Profit', icon: BarChart3 },
    { id: 'items', label: 'Price List', icon: Settings2 },
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

          <div className="hidden sm:block text-right">
            <div className="text-xs font-semibold text-slate-200">{cashierName}</div>
            <div className="text-[10px] text-emerald-400">Online</div>
          </div>
        </div>
      </div>
    </header>
  );
};
