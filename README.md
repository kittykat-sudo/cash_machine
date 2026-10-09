# Chathura Printers — Cash Register Web App (Local Docker)

A web-based cash register and point-of-sale system tailored for **Chathura Printers**. Built with **Next.js (React)**, **FastAPI (Python)**, **PostgreSQL**, and **Redis**, fully dockerized for local deployment.

---

## Quick Start with Docker

To build and start all containers:

```bash
docker compose up -d --build
```

To view logs:
```bash
docker compose logs -f
```

To stop all services:
```bash
docker compose down
```

---

## Access URLs & Ports

| Service | Host URL | Notes |
|---|---|---|
| **Frontend Web App (POS Till)** | [http://localhost:3000](http://localhost:3000) | Cash Register, Cashbook, Expenses, Day Audit |
| **Backend API Docs (FastAPI)** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive Swagger documentation |
| **PostgreSQL Database** | `localhost:5433` | Mapped to `5433` to prevent port collisions |
| **Redis Cache & Sequencer** | `localhost:6380` | Mapped to `6380` to prevent port collisions |

---

## Default Seed Credentials

- **Admin Account**: `admin@chathura.local` / `admin123`
- **Cashier Account**: `cashier@chathura.local` / `cashier123`

---

## Core Features

1. **Cash Register Screen**:
   - Quick category tabs: *Printing*, *Photocopy*, *Lamination*, *Binding*, *Stationery*, and *Custom*.
   - Large touch buttons with prices in LKR.
   - Side running bill panel (live line totals, discount, subtotal, net total).
   - Numeric touch keypad for fast page count entry.
   - Cash / Card / Bank payment toggles.
   - One-click **"Print & Complete"** action.

2. **Thermal & A4 Bill Printing**:
   - Integrated browser print styling (`@media print`) matching 80mm/58mm thermal receipt paper roll and standard printers.

3. **Automatic Cashbook Integration**:
   - Every completed sale and expense atomically writes to the `cashbook_entries` ledger with a live running balance.

4. **Day-End Audit & Reconciliation**:
   - Real-time profit metric: `Net Profit = Total Sales - Total Expenses`.
   - 3-Way reconciliation check between physical cashbook running balance and recorded transaction inflows/outflows.
