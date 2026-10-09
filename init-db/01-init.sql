-- Chathura Printers Cash Register Schema
-- Based on architecture spec

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'cashier',   -- 'admin' | 'cashier'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,                     -- 'A4 B/W Print', 'Lamination A4', 'Spiral Binding'
  category TEXT NOT NULL,                 -- 'printing' | 'photocopy' | 'lamination' | 'binding' | 'stationery' | 'other'
  unit TEXT NOT NULL DEFAULT 'each',      -- 'page' | 'copy' | 'sheet' | 'each'
  unit_price NUMERIC(12,2) NOT NULL,
  barcode TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  bill_number TEXT UNIQUE NOT NULL,
  cashier_id INTEGER REFERENCES users(id),
  subtotal NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',  -- 'cash' | 'card' | 'bank'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES items(id),
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,                 -- 'ink' | 'paper' | 'electricity' | 'rent' | 'maintenance' | 'other'
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cashbook_entries (
  id SERIAL PRIMARY KEY,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_type TEXT NOT NULL,               -- 'cash_in' | 'cash_out'
  category TEXT NOT NULL,                 -- 'sale' | 'expense' | 'owner_deposit' | 'owner_withdrawal'
  reference_table TEXT,                   -- 'sales' | 'expenses' | NULL
  reference_id INTEGER,
  amount NUMERIC(12,2) NOT NULL,
  running_balance NUMERIC(12,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS equity_ledger (
  id SERIAL PRIMARY KEY,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_type TEXT NOT NULL,               -- 'opening_capital' | 'profit_retained' | 'owner_drawing'
  amount NUMERIC(12,2) NOT NULL,
  note TEXT
);

-- Seed Default Users (Passwords: admin123, cashier123)
INSERT INTO users (name, email, password_hash, role) VALUES
('Store Owner (Admin)', 'admin@chathura.local', '$2b$12$4mU8dkhf8P8UeYF0uU3LSeiH5.WpXfB/0w0/o/KxT5gVn8tH6Fz4q', 'admin'),
('Counter Cashier', 'cashier@chathura.local', '$2b$12$4mU8dkhf8P8UeYF0uU3LSeiH5.WpXfB/0w0/o/KxT5gVn8tH6Fz4q', 'cashier')
ON CONFLICT (email) DO NOTHING;

-- Seed Catalog Items for Chathura Printers
INSERT INTO items (name, category, unit, unit_price, barcode, is_active) VALUES
('A4 B/W Print', 'printing', 'page', 10.00, 'PRN-A4-BW', true),
('A4 Color Print', 'printing', 'page', 50.00, 'PRN-A4-CLR', true),
('A3 B/W Print', 'printing', 'page', 25.00, 'PRN-A3-BW', true),
('A3 Color Print', 'printing', 'page', 100.00, 'PRN-A3-CLR', true),
('Glossy Photo Print 4x6', 'printing', 'sheet', 60.00, 'PRN-PHT-4X6', true),

('A4 B/W Photocopy (Single)', 'photocopy', 'copy', 8.00, 'CPY-A4-SGL', true),
('A4 B/W Photocopy (Double)', 'photocopy', 'copy', 15.00, 'CPY-A4-DBL', true),
('A3 B/W Photocopy', 'photocopy', 'copy', 20.00, 'CPY-A3-BW', true),

('Lamination A4', 'lamination', 'sheet', 60.00, 'LAM-A4', true),
('Lamination A3', 'lamination', 'sheet', 120.00, 'LAM-A3', true),
('ID Card Lamination', 'lamination', 'each', 40.00, 'LAM-ID', true),

('Spiral Binding (Small)', 'binding', 'each', 120.00, 'BND-SPR-SM', true),
('Spiral Binding (Large)', 'binding', 'each', 200.00, 'BND-SPR-LG', true),
('Tape / Soft Binding', 'binding', 'each', 80.00, 'BND-TPE', true),
('Hard Cover Project Binding', 'binding', 'each', 550.00, 'BND-HRD', true),

('CR Book 120pg', 'stationery', 'each', 220.00, 'STN-CR120', true),
('Ballpoint Pen (Blue/Black)', 'stationery', 'each', 40.00, 'STN-PEN', true),
('A4 Paper Pack (80gsm 500s)', 'stationery', 'each', 1450.00, 'STN-A4-REEM', true),
('Clear Folder A4', 'stationery', 'each', 50.00, 'STN-FLDR', true),
('Custom Print / Service', 'other', 'each', 0.00, 'CST-01', true)
ON CONFLICT DO NOTHING;

-- Note: Opening cash drawer float is entered by the cashier in the morning via POS UI.

