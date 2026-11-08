import {
  Item,
  CartItem,
  PaymentMethod,
  OrderStatus,
  Sale,
  Expense,
  CashbookEntry,
  CashBalanceResponse,
  DailyReport,
  MonthlyReport,
  WhatsAppSendPayload,
  WhatsAppSendResponse,
  WhatsAppConfig,
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
  customer_name?: string | null;
  customer_phone?: string | null;
  order_status?: OrderStatus;
  notes?: string | null;
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

export interface FetchSalesParams {
  date?: string;
  month?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  status?: string;
  limit?: number;
}

export async function fetchSales(filter?: string | FetchSalesParams): Promise<Sale[]> {
  const url = new URL(`${API_BASE}/sales`, window.location.origin);
  if (typeof filter === 'string') {
    if (filter) url.searchParams.append('date', filter);
  } else if (filter) {
    if (filter.date) url.searchParams.append('date', filter.date);
    if (filter.month) url.searchParams.append('month', filter.month);
    if (filter.start_date) url.searchParams.append('start_date', filter.start_date);
    if (filter.end_date) url.searchParams.append('end_date', filter.end_date);
    if (filter.search) url.searchParams.append('search', filter.search);
    if (filter.status) url.searchParams.append('status', filter.status);
    if (filter.limit) url.searchParams.append('limit', filter.limit.toString());
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch sales');
  return res.json();
}

export async function updateSaleStatus(id: number | string, newStatus: OrderStatus): Promise<Sale> {
  const res = await fetch(`${API_BASE}/sales/${id}/status?new_status=${encodeURIComponent(newStatus)}`, {
    method: 'PATCH',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update order status' }));
    throw new Error(err.detail || 'Failed to update order status');
  }
  return res.json();
}

export async function updateSale(id: number | string, data: Partial<Sale>): Promise<Sale> {
  const res = await fetch(`${API_BASE}/sales/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update sale' }));
    throw new Error(err.detail || 'Failed to update sale');
  }
  return res.json();
}

export async function sendSaleWhatsApp(
  id: number | string,
  payload: WhatsAppSendPayload
): Promise<WhatsAppSendResponse> {
  const res = await fetch(`${API_BASE}/sales/${id}/whatsapp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to generate WhatsApp message' }));
    throw new Error(err.detail || 'Failed to generate WhatsApp message');
  }
  return res.json();
}

export async function fetchWhatsAppConfig(): Promise<WhatsAppConfig> {
  const res = await fetch(`${API_BASE}/whatsapp/config`);
  if (!res.ok) throw new Error('Failed to fetch WhatsApp configuration');
  return res.json();
}

export async function fetchWhatsAppStatus(): Promise<any> {
  const res = await fetch(`${API_BASE}/whatsapp/status`);
  if (!res.ok) throw new Error('Failed to fetch WhatsApp status');
  return res.json();
}

export async function requestWhatsAppPairingCode(phone?: string): Promise<{
  success: boolean;
  phone?: string;
  pairingCode?: string;
  alreadyConnected?: boolean;
  message?: string;
}> {
  const res = await fetch(`${API_BASE}/whatsapp/pairing-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to request pairing code' }));
    throw new Error(err.detail || 'Failed to request pairing code');
  }
  return res.json();
}

export async function sendDirectWhatsApp(phone: string, message: string): Promise<any> {
  const res = await fetch(`${API_BASE}/whatsapp/send-direct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to send WhatsApp message' }));
    throw new Error(err.detail || 'Failed to send WhatsApp message');
  }
  return res.json();
}

export async function logoutWhatsApp(): Promise<any> {
  const res = await fetch(`${API_BASE}/whatsapp/logout`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to disconnect WhatsApp');
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
