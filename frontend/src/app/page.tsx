'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { RegisterView } from '../components/RegisterView';
import { CashbookView } from '../components/CashbookView';
import { ExpensesView } from '../components/ExpensesView';
import { ReportsView } from '../components/ReportsView';
import { ItemsView } from '../components/ItemsView';
import { OpeningFloatModal } from '../components/OpeningFloatModal';
import { fetchCashBalance } from '../services/api';

export default function Home() {
  const [activeTab, setActiveTab] = useState<
    'register' | 'cashbook' | 'expenses' | 'reports' | 'items'
  >('register');
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [hasOpeningFloat, setHasOpeningFloat] = useState<boolean>(true);
  const [showFloatModal, setShowFloatModal] = useState<boolean>(false);
  const [cashierName, setCashierName] = useState<string>('Counter Cashier');

  useEffect(() => {
    updateBalance(true);
  }, []);

  const updateBalance = async (isInitialLoad = false) => {
    try {
      const data = await fetchCashBalance();
      const balance = Number(data.running_balance) || 0;
      setCashBalance(balance);
      setHasOpeningFloat(data.has_opening_float);

      // If opening float has not been recorded yet for today, prompt the cashier
      if (isInitialLoad && !data.has_opening_float) {
        setShowFloatModal(true);
      }
    } catch (err) {
      console.warn('Could not fetch initial balance:', err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cashBalance={cashBalance}
        cashierName={cashierName}
        hasOpeningFloat={hasOpeningFloat}
        onOpenDrawerModal={() => setShowFloatModal(true)}
      />

      <main className="flex-1 overflow-auto">
        {activeTab === 'register' && (
          <RegisterView onSaleCompleted={() => updateBalance(false)} />
        )}
        {activeTab === 'cashbook' && (
          <CashbookView onBalanceUpdated={() => updateBalance(false)} />
        )}
        {activeTab === 'expenses' && (
          <ExpensesView onExpenseAdded={() => updateBalance(false)} />
        )}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'items' && <ItemsView />}
      </main>

      <OpeningFloatModal
        currentBalance={cashBalance}
        isOpen={showFloatModal}
        onClose={() => setShowFloatModal(false)}
        onFloatRecorded={() => updateBalance(false)}
      />
    </div>
  );
}
