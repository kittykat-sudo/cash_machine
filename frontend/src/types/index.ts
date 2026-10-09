export type ItemCategory =
  | 'printing'
  | 'photocopy'
  | 'lamination'
  | 'binding'
  | 'stationery'
  | 'other';

export interface Item {
  id: number;
  name: string;
  category: ItemCategory | string;
  unit: string;
  unit_price: number | string;
  barcode?: string | null;
  is_active: boolean;
}

export interface CartItem {
  item_id?: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export type PaymentMethod = 'cash' | 'card' | 'bank';

export interface Sale {
  id: number;
  bill_number: string;
  cashier_id?: number | null;
  subtotal: number | string;
  discount: number | string;
  tax_amount: number | string;
  total: number | string;
  payment_method: PaymentMethod;
  created_at: string;
  items: {
    id: number;
    item_id?: number | null;
    description: string;
    quantity: number | string;
    unit_price: number | string;
    line_total: number | string;
  }[];
}

export interface Expense {
  id: number;
  expense_date: string;
  category: string;
  amount: number | string;
  description?: string | null;
  created_by?: number | null;
  created_at: string;
}

export interface CashbookEntry {
  id: number;
  entry_date: string;
  entry_type: 'cash_in' | 'cash_out';
  category: string;
  reference_table?: string | null;
  reference_id?: number | null;
  amount: number | string;
  running_balance: number | string;
  note?: string | null;
  created_at: string;
}

export interface CashBalanceResponse {
  running_balance: number | string;
  has_opening_float: boolean;
  opening_amount?: number | string | null;
  entries_count: number;
}

export interface ReconciliationStatus {
  is_balanced: boolean;
  cashbook_balance: number | string;
  calculated_cash_position: number | string;
  difference: number | string;
  explanation: string;
}

export interface DailyReport {
  date: string;
  total_sales: number | string;
  sales_count: number;
  cash_sales: number | string;
  card_sales: number | string;
  bank_sales: number | string;
  total_expenses: number | string;
  expenses_count: number;
  net_profit: number | string;
  current_cashbook_balance: number | string;
  reconciliation: ReconciliationStatus;
}

export interface MonthlyReport {
  month: string;
  total_sales: number | string;
  sales_count: number;
  total_expenses: number | string;
  expenses_count: number;
  net_profit: number | string;
  category_breakdown: Record<string, number>;
  expense_breakdown: Record<string, number>;
}
