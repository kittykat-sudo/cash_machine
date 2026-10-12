'use client';

import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Calculator,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Building2,
  Users,
  Zap,
  Wrench,
  Megaphone,
  PhoneCall,
  Sliders,
  ArrowRight,
  Info,
  Layers,
  LineChart,
  BarChart2,
  Plus,
  Trash2,
  Printer,
  Sparkles,
  RefreshCcw,
} from 'lucide-react';

interface CustomExpense {
  id: string;
  name: string;
  amount: string;
}

export const BusinessPlanView: React.FC = () => {
  // -------------------------------------------------------------
  // 1. LOAN PARAMETERS (Starts EMPTY by default as requested)
  // -------------------------------------------------------------
  const [loanPrincipal, setLoanPrincipal] = useState<string>(''); // Empty by default
  const [annualRate, setAnnualRate] = useState<string>('15.5');
  const [loanYears, setLoanYears] = useState<number>(5);
  const [calcModel, setCalcModel] = useState<'reducing' | 'flat'>('reducing');

  // Bank Quote Confirmation (Starts empty)
  const [bankQuotedEmi, setBankQuotedEmi] = useState<string>('');
  const [bankQuotedInterest, setBankQuotedInterest] = useState<string>('');

  // -------------------------------------------------------------
  // 2. DIRECT PRODUCTION COSTS (Paper, Toner, Machine Depreciation)
  // -------------------------------------------------------------
  const [paperCost, setPaperCost] = useState<string>('');
  const [tonerCost, setTonerCost] = useState<string>('');
  const [depreciationCost, setDepreciationCost] = useState<string>('');
  const [consumablesCost, setConsumablesCost] = useState<string>('');
  const [useItemizedDirectCosts, setUseItemizedDirectCosts] = useState<boolean>(true);
  const [manualGrossMarginPct, setManualGrossMarginPct] = useState<number>(40);

  // -------------------------------------------------------------
  // 3. FIXED MONTHLY EXPENSES (Starts EMPTY by default as requested)
  // -------------------------------------------------------------
  const [managerSalary, setManagerSalary] = useState<string>(''); // Empty by default
  const [managerCommissionPct, setManagerCommissionPct] = useState<string>('0'); // Differentiate with profit/rev
  const [commissionType, setCommissionType] = useState<'revenue' | 'profit'>('profit');
  const [electricity, setElectricity] = useState<string>('');
  const [repairs, setRepairs] = useState<string>('');
  const [marketing, setMarketing] = useState<string>('');
  const [phoneInternet, setPhoneInternet] = useState<string>('');
  const [customExpenses, setCustomExpenses] = useState<CustomExpense[]>([]);

  // -------------------------------------------------------------
  // 4. REVENUE SIMULATOR & GRAPH SETTINGS
  // -------------------------------------------------------------
  const [customRevenue, setCustomRevenue] = useState<number>(460000);
  const [chartMode, setChartMode] = useState<'curve' | 'waterfall'>('curve');
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  // -------------------------------------------------------------
  // NUMERIC PARSING & CALCULATIONS
  // -------------------------------------------------------------
  const principalNum = parseFloat(loanPrincipal) || 0;
  const rateNum = parseFloat(annualRate) || 0;
  const totalMonths = loanYears * 12;
  const monthlyRate = rateNum / 100 / 12;

  // Loan Math (Only active when principal > 0)
  const isLoanActive = principalNum > 0;
  const calculatedReducingEmi =
    isLoanActive && monthlyRate > 0 && totalMonths > 0
      ? (principalNum * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
      : 0;
  const month1Interest = isLoanActive ? principalNum * monthlyRate : 0;
  const totalRepaymentReducing = calculatedReducingEmi * totalMonths;
  const totalInterestReducing = isLoanActive ? totalRepaymentReducing - principalNum : 0;

  // Flat Rate alternative
  const totalFlatInterest = isLoanActive ? principalNum * (rateNum / 100) * loanYears : 0;
  const totalRepaymentFlat = isLoanActive ? principalNum + totalFlatInterest : 0;
  const flatMonthlyInstallment = isLoanActive && totalMonths > 0 ? totalRepaymentFlat / totalMonths : 0;
  const flatMonthlyInterest = isLoanActive && totalMonths > 0 ? totalFlatInterest / totalMonths : 0;

  const calculatedMonthlyInstallment =
    calcModel === 'reducing' ? calculatedReducingEmi : flatMonthlyInstallment;
  const calculatedMonthlyInterest =
    calcModel === 'reducing' ? month1Interest : flatMonthlyInterest;

  // Bank Quote Verification
  const bankEmiNum = parseFloat(bankQuotedEmi) || 0;
  const bankInterestNum = parseFloat(bankQuotedInterest) || 0;
  const emiVariance = bankEmiNum > 0 ? bankEmiNum - calculatedMonthlyInstallment : 0;
  const isEmiMatched = bankEmiNum > 0 && Math.abs(emiVariance) <= 15;

  // Active Loan Installment: Bank quote if provided, else calculated, or 0 if no loan
  const activeInstallment = bankEmiNum > 0 ? bankEmiNum : calculatedMonthlyInstallment;

  // Direct Costs Math
  const paperNum = parseFloat(paperCost) || 0;
  const tonerNum = parseFloat(tonerCost) || 0;
  const depreciationNum = parseFloat(depreciationCost) || 0;
  const consumablesNum = parseFloat(consumablesCost) || 0;
  const itemizedDirectTotal = paperNum + tonerNum + depreciationNum + consumablesNum;

  // Fixed Expenses Math (excluding manager commission for now)
  const salaryNum = parseFloat(managerSalary) || 0;
  const epfEtfAmount = salaryNum > 0 ? salaryNum * 0.15 : 0; // 15% EPF/ETF
  const elecNum = parseFloat(electricity) || 0;
  const repNum = parseFloat(repairs) || 0;
  const mktNum = parseFloat(marketing) || 0;
  const phoneNum = parseFloat(phoneInternet) || 0;
  const customExpensesTotal = customExpenses.reduce(
    (sum, exp) => sum + (parseFloat(exp.amount) || 0),
    0
  );

  const baseFixedExpenses =
    salaryNum + epfEtfAmount + elecNum + repNum + mktNum + phoneNum + customExpensesTotal;

  // Helper to compute cash flow for any revenue level
  const computeFinancials = (rev: number) => {
    // 1. Direct Costs & Gross Profit
    let directCosts = 0;
    let grossProfit = 0;
    let grossMarginPct = 0;

    if (useItemizedDirectCosts && itemizedDirectTotal > 0) {
      directCosts = itemizedDirectTotal;
      grossProfit = Math.max(0, rev - directCosts);
      grossMarginPct = rev > 0 ? (grossProfit / rev) * 100 : 0;
    } else {
      grossMarginPct = manualGrossMarginPct;
      grossProfit = rev * (grossMarginPct / 100);
      directCosts = rev - grossProfit;
    }

    // 2. Manager Differentiation (Commission / Profit-sharing)
    const commPct = parseFloat(managerCommissionPct) || 0;
    let managerCommission = 0;
    if (commPct > 0) {
      if (commissionType === 'revenue') {
        managerCommission = rev * (commPct / 100);
      } else {
        const preCommOperating = grossProfit - baseFixedExpenses;
        managerCommission = Math.max(0, preCommOperating * (commPct / 100));
      }
    }

    const totalFixed = baseFixedExpenses + managerCommission;
    const operatingProfit = grossProfit - totalFixed;
    const netReinvestment = operatingProfit - activeInstallment;

    return {
      revenue: rev,
      directCosts,
      grossProfit,
      grossMarginPct,
      managerCommission,
      totalFixed,
      operatingProfit,
      loanInstallment: activeInstallment,
      netReinvestment,
      isSurplus: netReinvestment >= 0,
    };
  };

  const currentFinancials = useMemo(
    () => computeFinancials(customRevenue),
    [
      customRevenue,
      useItemizedDirectCosts,
      itemizedDirectTotal,
      manualGrossMarginPct,
      managerCommissionPct,
      commissionType,
      baseFixedExpenses,
      activeInstallment,
    ]
  );

  // Dynamic Break-Even Monthly Revenue
  const effectiveMarginRatio = currentFinancials.grossMarginPct / 100;
  const breakEvenMonthly =
    effectiveMarginRatio > 0
      ? (currentFinancials.totalFixed + activeInstallment) / effectiveMarginRatio
      : 0;
  const breakEvenDaily = breakEvenMonthly / 26; // 26 working days

  // Pre-calculated comparison scenarios
  const slowScenario = useMemo(() => computeFinancials(300000), [computeFinancials]);
  const sampleScenario = useMemo(() => computeFinancials(460000), [computeFinancials]);
  const busyScenario = useMemo(() => computeFinancials(600000), [computeFinancials]);

  // Quick Action Handlers
  const handleLoadSampleExpenses = () => {
    setManagerSalary('50000');
    setElectricity('18000');
    setRepairs('8000');
    setMarketing('5000');
    setPhoneInternet('4000');
  };

  const handleClearExpenses = () => {
    setManagerSalary('');
    setElectricity('');
    setRepairs('');
    setMarketing('');
    setPhoneInternet('');
    setCustomExpenses([]);
  };

  const handleLoadSampleDirectCosts = () => {
    setPaperCost('150000');
    setTonerCost('70000');
    setDepreciationCost('35000');
    setConsumablesCost('21000');
    setUseItemizedDirectCosts(true);
  };

  const handleClearDirectCosts = () => {
    setPaperCost('');
    setTonerCost('');
    setDepreciationCost('');
    setConsumablesCost('');
  };

  const handleAddCustomExpense = () => {
    setCustomExpenses((prev) => [
      ...prev,
      { id: Date.now().toString(), name: 'Other Custom Expense', amount: '' },
    ]);
  };

  const handleRemoveCustomExpense = (id: string) => {
    setCustomExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const handleUpdateCustomExpense = (id: string, field: 'name' | 'amount', val: string) => {
    setCustomExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: val } : e))
    );
  };

  // -------------------------------------------------------------
  // SVG GRAPH DATA POINTS (100k to 800k in steps)
  // -------------------------------------------------------------
  const chartPoints = useMemo(() => {
    const revSteps = [100000, 200000, 300000, 400000, 460000, 500000, 600000, 700000, 800000];
    return revSteps.map((rev) => {
      const fin = computeFinancials(rev);
      return {
        rev,
        totalCosts: fin.directCosts + fin.totalFixed + fin.loanInstallment,
        grossProfit: fin.grossProfit,
        netReinvestment: fin.netReinvestment,
        isSurplus: fin.netReinvestment >= 0,
      };
    });
  }, [computeFinancials]);

  // SVG Chart bounds
  const chartWidth = 720;
  const chartHeight = 260;
  const padding = { top: 25, right: 30, bottom: 40, left: 65 };
  const graphInnerWidth = chartWidth - padding.left - padding.right;
  const graphInnerHeight = chartHeight - padding.top - padding.bottom;

  const minRev = 100000;
  const maxRev = 800000;
  const minNet = -150000;
  const maxNet = 350000;

  const getX = (rev: number) =>
    padding.left + ((rev - minRev) / (maxRev - minRev)) * graphInnerWidth;
  const getY = (net: number) =>
    padding.top +
    graphInnerHeight -
    ((net - minNet) / (maxNet - minNet)) * graphInnerHeight;

  const zeroY = getY(0);
  const breakEvenX = getX(Math.min(maxRev, Math.max(minRev, breakEvenMonthly)));
  const currentRevenueX = getX(Math.min(maxRev, Math.max(minRev, customRevenue)));
  const currentNetY = getY(currentFinancials.netReinvestment);

  const netPointsPath = chartPoints
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(pt.rev).toFixed(1)} ${getY(pt.netReinvestment).toFixed(1)}`)
    .join(' ');

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg uppercase tracking-wider">
                Financial Planning & Sensitivity
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {isLoanActive ? 'Active Loan Calculation' : 'Debt-Free Operating Mode'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Monthly Cash Flow, Loan & Cost Planning
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Expenses and loan amount are kept flexible so each month can be recorded as needed.
              Add direct costs (paper, toner, machine depreciation), adjust manager compensation, and verify bank loan figures.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Dynamic Break-Even</span>
              <span className="text-xl font-black text-slate-900 font-mono">
                Rs. {Math.round(breakEvenMonthly).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block">
                ~Rs. {Math.round(breakEvenDaily).toLocaleString()} / day (26 days)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Loan Installment */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-400">Monthly Loan Service</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isLoanActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
              }`}
            >
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {isLoanActive ? `Rs. ${Math.round(activeInstallment).toLocaleString()}` : 'Rs. 0'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {isLoanActive ? (
              isEmiMatched ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Matches Bank Quote
                </span>
              ) : (
                <span>{loanYears} Yrs @ {annualRate}%</span>
              )
            ) : (
              <span className="italic text-slate-400">No active loan entered</span>
            )}
          </div>
        </div>

        {/* Direct Costs (Paper, Toner, Deprec) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-400">Direct Production Costs</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            Rs. {Math.round(currentFinancials.directCosts).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Paper + Toner + Depreciation ({currentFinancials.grossMarginPct.toFixed(1)}% margin)
          </div>
        </div>

        {/* Fixed Overhead */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-400">Monthly Overhead</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            Rs. {Math.round(currentFinancials.totalFixed).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Manager (basic + comm) + Utilities & Repairs
          </div>
        </div>

        {/* Month End Net Reinvestment */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-400">Month-End Net Surplus</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                currentFinancials.isSurplus ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-black font-mono ${
              currentFinancials.isSurplus ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {currentFinancials.isSurplus ? '+' : ''}
            Rs. {Math.round(currentFinancials.netReinvestment).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {currentFinancials.isSurplus
              ? 'Net cash left to reinvest'
              : 'Deficit (top-up required)'}
          </div>
        </div>
      </div>

      {/* THREE INTERACTIVE PLANNING CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CARD 1: DIRECT PRODUCTION COSTS & DEPRECIATION */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Direct Costs & Depreciation</h3>
                <p className="text-xs text-slate-500">Fixed monthly cost for paper, toner & machine wear</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleLoadSampleDirectCosts}
              className="text-xs px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded-lg border border-amber-200 transition"
            >
              Load Sample Costs
            </button>
            <button
              onClick={handleClearDirectCosts}
              className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg transition"
            >
              Clear
            </button>
          </div>

          <div className="space-y-3">
            {/* Paper Stock */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Paper Stock (Reams / Boxes / NCR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rs.</span>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 150000"
                  value={paperCost}
                  onChange={(e) => setPaperCost(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Toner & Ink */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Toner, Ink & Cartridges
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rs.</span>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 70000"
                  value={tonerCost}
                  onChange={(e) => setTonerCost(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Machine Depreciation */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Machine Depreciation / Wear & Tear
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rs.</span>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 35000"
                  value={depreciationCost}
                  onChange={(e) => setDepreciationCost(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Monthly equipment amortization reserve
              </span>
            </div>

            {/* Other Consumables */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Other Consumables (Plates, Binding, Glue)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rs.</span>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 21000"
                  value={consumablesCost}
                  onChange={(e) => setConsumablesCost(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Direct Costs Summary Pill */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between items-center font-bold text-amber-950">
                <span>Total Direct Costs:</span>
                <span className="font-mono text-sm">
                  Rs. {itemizedDirectTotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-amber-800">
                <span>Implied Gross Margin:</span>
                <span className="font-mono font-bold">
                  {currentFinancials.grossMarginPct.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: MONTHLY FIXED EXPENSES & MANAGER DIFFERENTIATION */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Monthly Overhead</h3>
                <p className="text-xs text-slate-500">Add each month's bills & manager compensation</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleLoadSampleExpenses}
              className="text-xs px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 font-semibold rounded-lg border border-rose-200 transition"
            >
              Load Sample (92.5k)
            </button>
            <button
              onClick={handleClearExpenses}
              className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg transition"
            >
              Clear
            </button>
          </div>

          <div className="space-y-3">
            {/* Manager Salary with Differentiation */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-600" />
                  <span>Manager Basic Salary</span>
                </label>
                {salaryNum > 0 && (
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    +15% EPF/ETF (Rs. {epfEtfAmount.toLocaleString()})
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">Rs.</span>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 50000"
                  value={managerSalary}
                  onChange={(e) => setManagerSalary(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Differentiation / Commission Slider */}
              <div className="pt-2 border-t border-slate-200/60 text-xs">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-600 font-semibold">
                    Differentiate with {commissionType === 'profit' ? 'Operating Profit' : 'Revenue'}:
                  </span>
                  <span className="font-mono font-bold text-rose-700">
                    +{managerCommissionPct}% (+Rs. {Math.round(currentFinancials.managerCommission).toLocaleString()})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={managerCommissionPct}
                    onChange={(e) => setManagerCommissionPct(e.target.value)}
                    className="flex-1 accent-rose-600"
                  />
                  <select
                    value={commissionType}
                    onChange={(e) => setCommissionType(e.target.value as any)}
                    className="text-[10px] bg-white border border-slate-300 rounded px-1.5 py-0.5 font-semibold text-slate-700"
                  >
                    <option value="profit">% Profit</option>
                    <option value="revenue">% Revenue</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Electricity */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Electricity & Utilities
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">Rs.</span>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 18000"
                  value={electricity}
                  onChange={(e) => setElectricity(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Repairs */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Machine Repairs & Servicing
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">Rs.</span>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 8000"
                  value={repairs}
                  onChange={(e) => setRepairs(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Marketing & Phone */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Marketing</label>
                <input
                  type="number"
                  step="any"
                  placeholder="5000"
                  value={marketing}
                  onChange={(e) => setMarketing(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Phone/Net</label>
                <input
                  type="number"
                  step="any"
                  placeholder="4000"
                  value={phoneInternet}
                  onChange={(e) => setPhoneInternet(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Dynamic Custom Expenses */}
            {customExpenses.map((exp) => (
              <div key={exp.id} className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Expense name"
                  value={exp.name}
                  onChange={(e) => handleUpdateCustomExpense(exp.id, 'name', e.target.value)}
                  className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Amount"
                  value={exp.amount}
                  onChange={(e) => handleUpdateCustomExpense(exp.id, 'amount', e.target.value)}
                  className="w-24 px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
                <button
                  onClick={() => handleRemoveCustomExpense(exp.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <button
              onClick={handleAddCustomExpense}
              className="text-xs text-rose-600 font-semibold hover:underline flex items-center gap-1 pt-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add another overhead item
            </button>
          </div>
        </div>

        {/* CARD 3: FUTURE LOAN CALCULATOR & BANK CONFIRMATION */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Future Bank Loan</h3>
                <p className="text-xs text-slate-500">Enter when ready; kept empty by default</p>
              </div>
            </div>

            {/* Calculation Model Toggle */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                onClick={() => setCalcModel('reducing')}
                className={`px-2 py-1 rounded transition ${
                  calcModel === 'reducing' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Reducing
              </button>
              <button
                onClick={() => setCalcModel('flat')}
                className={`px-2 py-1 rounded transition ${
                  calcModel === 'flat' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Flat
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {/* Loan Principal Input */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Loan Amount Taking (Rs.)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rs.</span>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 2,800,000 (leave empty if no loan)"
                  value={loanPrincipal}
                  onChange={(e) => setLoanPrincipal(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-1.5 mt-1.5">
                {[2000000, 2800000, 3500000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setLoanPrincipal(amt.toString())}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Rs. {amt / 100000}L
                  </button>
                ))}
                {loanPrincipal && (
                  <button
                    onClick={() => {
                      setLoanPrincipal('');
                      setBankQuotedEmi('');
                      setBankQuotedInterest('');
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold hover:bg-rose-100"
                  >
                    Clear Loan
                  </button>
                )}
              </div>
            </div>

            {/* Rate & Tenure */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Fixed Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={annualRate}
                  onChange={(e) => setAnnualRate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Term (Years)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={loanYears}
                  onChange={(e) => setLoanYears(parseInt(e.target.value) || 1)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Calculations Box */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Calculated Monthly Payment:</span>
                <span className="font-mono font-black text-blue-700 text-sm">
                  {isLoanActive ? `Rs. ${Math.round(calculatedMonthlyInstallment).toLocaleString()}` : 'Rs. 0'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <span>Month 1 Interest Charge:</span>
                <span className="font-mono font-semibold">
                  {isLoanActive ? `Rs. ${Math.round(calculatedMonthlyInterest).toLocaleString()}` : 'Rs. 0'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <span>Total Interest Paid ({loanYears} yrs):</span>
                <span className="font-mono font-semibold text-rose-600">
                  {isLoanActive
                    ? `Rs. ${Math.round(calcModel === 'reducing' ? totalInterestReducing : totalFlatInterest).toLocaleString()}`
                    : 'Rs. 0'}
                </span>
              </div>
            </div>

            {/* Bank Confirmation Inputs */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-emerald-950 block">Bank Confirmation:</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-emerald-900 block mb-0.5">Bank Quoted EMI</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 67350"
                    value={bankQuotedEmi}
                    onChange={(e) => setBankQuotedEmi(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-emerald-300 rounded text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-emerald-900 block mb-0.5">Bank Quoted Interest</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 36167"
                    value={bankQuotedInterest}
                    onChange={(e) => setBankQuotedInterest(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-emerald-300 rounded text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              {bankEmiNum > 0 && (
                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <span>Status:</span>
                  <span
                    className={`font-bold flex items-center gap-1 ${
                      isEmiMatched ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {isEmiMatched ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Matches Bank Quote
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3" /> Variance: Rs. {emiVariance.toFixed(2)}
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE GRAPH: BREAK-EVEN & PROFIT TRAJECTORY */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <LineChart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Visual Financial Health & Break-Even Trajectory
              </h3>
              <p className="text-xs text-slate-500">
                Track how surplus cash evolves from slow (Rs. 300k) to target (Rs. 460k) and growth (Rs. 600k+)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span className="text-slate-600 font-semibold">Surplus Zone</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span className="text-slate-600 font-semibold">Deficit Zone</span>
              </span>
            </div>
          </div>
        </div>

        {/* SVG Interactive Chart */}
        <div className="relative overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto select-none font-sans"
            style={{ minWidth: '600px' }}
          >
            {/* Grid Lines */}
            {[-100000, 0, 100000, 200000, 300000].map((val) => {
              const y = getY(val);
              return (
                <g key={val}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={chartWidth - padding.right}
                    y2={y}
                    stroke={val === 0 ? '#0F172A' : '#E2E8F0'}
                    strokeWidth={val === 0 ? 1.5 : 1}
                    strokeDasharray={val === 0 ? 'none' : '3 3'}
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill={val === 0 ? '#0F172A' : '#94A3B8'}
                    fontWeight={val === 0 ? 'bold' : 'normal'}
                  >
                    {val >= 0 ? `+${val / 1000}k` : `${val / 1000}k`}
                  </text>
                </g>
              );
            })}

            {/* Zero Break-Even Line Highlight */}
            <line
              x1={padding.left}
              y1={zeroY}
              x2={chartWidth - padding.right}
              y2={zeroY}
              stroke="#047857"
              strokeWidth="1.5"
            />

            {/* Vertical Dynamic Break-Even Line */}
            {breakEvenMonthly >= minRev && breakEvenMonthly <= maxRev && (
              <g>
                <line
                  x1={breakEvenX}
                  y1={padding.top}
                  x2={breakEvenX}
                  y2={chartHeight - padding.bottom}
                  stroke="#F59E0B"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <rect
                  x={breakEvenX - 45}
                  y={padding.top - 18}
                  width="90"
                  height="16"
                  rx="4"
                  fill="#FEF3C7"
                  stroke="#F59E0B"
                  strokeWidth="1"
                />
                <text
                  x={breakEvenX}
                  y={padding.top - 6}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="bold"
                  fill="#92400E"
                >
                  Break-Even: {Math.round(breakEvenMonthly / 1000)}k
                </text>
              </g>
            )}

            {/* Net Reinvestment Trajectory Line */}
            <path
              d={netPointsPath}
              fill="none"
              stroke="#2563EB"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Point Markers */}
            {chartPoints.map((pt) => {
              const x = getX(pt.rev);
              const y = getY(pt.netReinvestment);
              const isSelected = Math.abs(pt.rev - customRevenue) < 30000;
              return (
                <g
                  key={pt.rev}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  onClick={() => setCustomRevenue(pt.rev)}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 6 : 4}
                    fill={pt.isSurplus ? '#10B981' : '#EF4444'}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                  {/* X Axis Label */}
                  <text
                    x={x}
                    y={chartHeight - padding.bottom + 16}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#64748B"
                    fontWeight={isSelected ? 'bold' : 'normal'}
                  >
                    {pt.rev / 1000}k
                  </text>
                </g>
              );
            })}

            {/* Active/Current Revenue Marker */}
            {customRevenue >= minRev && customRevenue <= maxRev && (
              <g>
                <circle
                  cx={currentRevenueX}
                  cy={currentNetY}
                  r="8"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                  className="animate-pulse"
                />
                <circle
                  cx={currentRevenueX}
                  cy={currentNetY}
                  r="5"
                  fill={currentFinancials.isSurplus ? '#059669' : '#DC2626'}
                />
              </g>
            )}
          </svg>
        </div>

        {/* Hover / Active Point Detail Tooltip Box */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-500 block">Selected Simulated Revenue:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              Rs. {customRevenue.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Gross Profit:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              Rs. {Math.round(currentFinancials.grossProfit).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Fixed Overhead + Manager:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              Rs. {Math.round(currentFinancials.totalFixed).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Loan Installment:</span>
            <span className="font-mono font-bold text-blue-700 text-sm">
              -Rs. {Math.round(activeInstallment).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Net Reinvestment:</span>
            <span
              className={`font-mono font-black text-sm ${
                currentFinancials.isSurplus ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {currentFinancials.isSurplus ? '+' : ''}
              Rs. {Math.round(currentFinancials.netReinvestment).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* WHAT’S LEFT AT MONTH END: SIDE-BY-SIDE SCENARIOS & SLIDER */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-lg text-slate-900">
              What’s Left at Month End (Scenarios Comparison)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare Slow (300k), Sample (460k), and Busy (600k) with your current cost & loan inputs
            </p>
          </div>
        </div>

        {/* 3 Scenario Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Slow Month (300k) */}
          <div className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase text-slate-500">Slow Month</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    slowScenario.isSurplus
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {slowScenario.isSurplus ? 'Surplus' : 'Top-up Needed'}
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                Rs. 300,000
              </div>
              <div className="text-xs text-slate-500 mt-1">~Rs. 11,540 / day</div>

              <div className="mt-4 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Profit</span>
                  <span className="font-mono font-semibold">
                    Rs. {Math.round(slowScenario.grossProfit).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Overhead</span>
                  <span className="font-mono font-semibold">
                    -Rs. {Math.round(slowScenario.totalFixed).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Operating Profit</span>
                  <span className="font-mono font-bold">
                    Rs. {Math.round(slowScenario.operatingProfit).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Loan Installment</span>
                  <span className="font-mono font-semibold">
                    -Rs. {Math.round(activeInstallment).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-800">Left at Month End</span>
                <span
                  className={`text-lg font-black font-mono ${
                    slowScenario.isSurplus ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {slowScenario.isSurplus ? '+' : ''}
                  Rs. {Math.round(slowScenario.netReinvestment).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Sample Month (460k) */}
          <div className="p-5 rounded-2xl border-2 border-emerald-400 bg-emerald-50/40 space-y-3 flex flex-col justify-between shadow-sm relative">
            <span className="absolute -top-3 right-4 px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold uppercase rounded-full shadow-sm">
              Base Target
            </span>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase text-emerald-800">Sample Month</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    sampleScenario.isSurplus
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {sampleScenario.isSurplus ? 'Self-Sustaining' : 'Deficit'}
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                Rs. 460,000
              </div>
              <div className="text-xs text-slate-500 mt-1">~Rs. 17,690 / day</div>

              <div className="mt-4 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Profit</span>
                  <span className="font-mono font-semibold">
                    Rs. {Math.round(sampleScenario.grossProfit).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Overhead</span>
                  <span className="font-mono font-semibold">
                    -Rs. {Math.round(sampleScenario.totalFixed).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Operating Profit</span>
                  <span className="font-mono font-bold">
                    Rs. {Math.round(sampleScenario.operatingProfit).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Loan Installment</span>
                  <span className="font-mono font-semibold">
                    -Rs. {Math.round(activeInstallment).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-200">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-900">Left to Reinvest</span>
                <span
                  className={`text-xl font-black font-mono ${
                    sampleScenario.isSurplus ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {sampleScenario.isSurplus ? '+' : ''}
                  Rs. {Math.round(sampleScenario.netReinvestment).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Busy Month (600k) */}
          <div className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase text-slate-500">Busy Month</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    busyScenario.isSurplus
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {busyScenario.isSurplus ? 'High Growth' : 'Tight'}
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                Rs. 600,000
              </div>
              <div className="text-xs text-slate-500 mt-1">~Rs. 23,080 / day</div>

              <div className="mt-4 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Profit</span>
                  <span className="font-mono font-semibold">
                    Rs. {Math.round(busyScenario.grossProfit).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Overhead</span>
                  <span className="font-mono font-semibold">
                    -Rs. {Math.round(busyScenario.totalFixed).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Operating Profit</span>
                  <span className="font-mono font-bold">
                    Rs. {Math.round(busyScenario.operatingProfit).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Loan Installment</span>
                  <span className="font-mono font-semibold">
                    -Rs. {Math.round(activeInstallment).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-900">Left to Reinvest</span>
                <span
                  className={`text-xl font-black font-mono ${
                    busyScenario.isSurplus ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {busyScenario.isSurplus ? '+' : ''}
                  Rs. {Math.round(busyScenario.netReinvestment).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CUSTOM REVENUE SLIDER */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-inner space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <h4 className="font-bold text-sm text-white">
                Interactive Monthly Revenue Simulator
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Monthly Revenue:</span>
              <input
                type="number"
                step="10000"
                value={customRevenue}
                onChange={(e) => setCustomRevenue(parseFloat(e.target.value) || 0)}
                className="w-36 px-2.5 py-1 bg-slate-700 border border-slate-600 rounded-lg text-sm font-bold font-mono text-emerald-400 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <input
            type="range"
            min="100000"
            max="1000000"
            step="10000"
            value={customRevenue}
            onChange={(e) => setCustomRevenue(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-700/60 text-xs">
            <div>
              <span className="text-slate-400 block">
                Gross Profit ({currentFinancials.grossMarginPct.toFixed(1)}%)
              </span>
              <span className="font-mono font-bold text-white text-base">
                Rs. {Math.round(currentFinancials.grossProfit).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Total Fixed Overhead</span>
              <span className="font-mono font-bold text-white text-base">
                Rs. {Math.round(currentFinancials.totalFixed).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Loan Installment</span>
              <span className="font-mono font-bold text-slate-300 text-base">
                -Rs. {Math.round(activeInstallment).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Net Reinvestment</span>
              <span
                className={`font-mono font-black text-lg ${
                  currentFinancials.isSurplus ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {currentFinancials.isSurplus ? '+' : ''}
                Rs. {Math.round(currentFinancials.netReinvestment).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
