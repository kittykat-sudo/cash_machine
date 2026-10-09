import {
  Item,
  CartItem,
  PaymentMethod,
  Sale,
  Expense,
  CashbookEntry,
  CashBalanceResponse,
  DailyReport,
  MonthlyReport,
} from '../types';

const API_BASE = '/api';

export async function fetchItems(category?: string): Promise<Item[]> {
  const url = new URL(`${API_BASE}/items`, window.location.origin);
  if (category && category !== 'all') {
    url.searchParams.append('category', category);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch items');
  return res.json();
}

export async function createItem(data: Partial<Item>): Promise<Item> {
  const res = await fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create item');
  return res.json();
}

export async function updateItem(id: number, data: Partial<Item>): Promise<Item> {
  const res = await fetch(`${API_BASE}/items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update item');
  return res.json();
}

export async function deleteItem(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/items/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete item');
}

export interface CreateSalePayload {
  items: CartItem[];
  discount: number;
  tax_amount: number;
  payment_method: PaymentMethod;
  cashier_id?: number | null;
}

export async function createSale(payload: CreateSalePayload): Promise<Sale> {
  const res = await fetch(`${API_BASE}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to record sale' }));
    throw new Error(err.detail || 'Failed to record sale');
  }
  return res.json();
}

export async function fetchSales(date?: string): Promise<Sale[]> {
  const url = new URL(`${API_BASE}/sales`, window.location.origin);
  if (date) url.searchParams.append('date', date);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch sales');
  return res.json();
}

export async function createExpense(data: {
  category: string;
  amount: number;
  description?: string;
  expense_date?: string;
}): Promise<Expense> {
  const res = await fetch(`${API_BASE}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to record expense' }));
    throw new Error(err.detail || 'Failed to record expense');
  }
  return res.json();
}

export async function fetchExpenses(startDate?: string, endDate?: string): Promise<Expense[]> {
  const url = new URL(`${API_BASE}/expenses`, window.location.origin);
  if (startDate) url.searchParams.append('start_date', startDate);
  if (endDate) url.searchParams.append('end_date', endDate);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch expenses');
  return res.json();
}

export async function fetchCashbook(startDate?: string, endDate?: string): Promise<CashbookEntry[]> {
  const url = new URL(`${API_BASE}/cashbook`, window.location.origin);
  if (startDate) url.searchParams.append('start_date', startDate);
  if (endDate) url.searchParams.append('end_date', endDate);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch cashbook');
  return res.json();
}

export async function fetchCashBalance(): Promise<CashBalanceResponse> {
  const res = await fetch(`${API_BASE}/cashbook/balance`);
  if (!res.ok) throw new Error('Failed to fetch cash balance');
  return res.json();
}

export async function setOpeningFloat(amount: number, note?: string): Promise<CashbookEntry> {
  const res = await fetch(`${API_BASE}/cashbook/opening-float`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, note }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to record opening float' }));
    throw new Error(err.detail || 'Failed to record opening float');
  }
  return res.json();
}

export async function adjustCash(data: {
  amount: number;
  entry_type: 'cash_in' | 'cash_out';
  category: 'owner_deposit' | 'owner_withdrawal';
  note?: string;
}): Promise<CashbookEntry> {
  const res = await fetch(`${API_BASE}/cashbook/adjust`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to record adjustment');
  return res.json();
}

export async function fetchDailyReport(date?: string): Promise<DailyReport> {
  const url = new URL(`${API_BASE}/reports/daily`, window.location.origin);
  if (date) url.searchParams.append('date', date);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch daily report');
  return res.json();
}

export async function fetchMonthlyReport(month?: string): Promise<MonthlyReport> {
  const url = new URL(`${API_BASE}/reports/monthly`, window.location.origin);
  if (month) url.searchParams.append('month', month);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch monthly report');
  return res.json();
}
