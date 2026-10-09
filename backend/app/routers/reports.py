from datetime import datetime, date
from decimal import Decimal
from typing import Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Sale, Expense, CashbookEntry, SaleItem, Item
from app.schemas import DailyReportResponse, MonthlyReportResponse, ReconciliationStatus

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/daily", response_model=DailyReportResponse)
def get_daily_report(
    date_str: Optional[str] = Query(None, alias="date", description="Date in YYYY-MM-DD format"),
    db: Session = Depends(get_db)
):
    if date_str:
        try:
            report_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format, expected YYYY-MM-DD")
    else:
        report_date = date.today()

    start_dt = datetime.combine(report_date, datetime.min.time())
    end_dt = datetime.combine(report_date, datetime.max.time())

    # 1. Sales metrics
    sales_today = db.query(Sale).filter(Sale.created_at >= start_dt, Sale.created_at <= end_dt).all()
    total_sales = sum(s.total for s in sales_today) if sales_today else Decimal("0.00")
    sales_count = len(sales_today)

    cash_sales = sum(s.total for s in sales_today if s.payment_method == "cash") or Decimal("0.00")
    card_sales = sum(s.total for s in sales_today if s.payment_method == "card") or Decimal("0.00")
    bank_sales = sum(s.total for s in sales_today if s.payment_method == "bank") or Decimal("0.00")

    # 2. Expenses metrics
    expenses_today = db.query(Expense).filter(Expense.expense_date == report_date).all()
    total_expenses = sum(e.amount for e in expenses_today) if expenses_today else Decimal("0.00")
    expenses_count = len(expenses_today)

    net_profit = total_sales - total_expenses

    # 3. Cashbook running balance & reconciliation
    latest_cb = db.query(CashbookEntry).order_by(CashbookEntry.id.desc()).first()
    current_cashbook_balance = latest_cb.running_balance if latest_cb else Decimal("0.00")

    # Reconciliation: sum(all cash_in) - sum(all cash_out)
    all_cash_in = db.query(func.coalesce(func.sum(CashbookEntry.amount), 0)).filter(CashbookEntry.entry_type == "cash_in").scalar()
    all_cash_out = db.query(func.coalesce(func.sum(CashbookEntry.amount), 0)).filter(CashbookEntry.entry_type == "cash_out").scalar()
    calculated_cash_position = Decimal(str(all_cash_in)) - Decimal(str(all_cash_out))

    diff = abs(current_cashbook_balance - calculated_cash_position)
    is_balanced = diff < Decimal("0.01")

    reconciliation = ReconciliationStatus(
        is_balanced=is_balanced,
        cashbook_balance=current_cashbook_balance,
        calculated_cash_position=calculated_cash_position,
        difference=diff,
        explanation="Ledger running balance matches all cash-in vs cash-out transactions perfectly." if is_balanced else f"Discrepancy detected of Rs. {diff}"
    )

    return DailyReportResponse(
        date=report_date.isoformat(),
        total_sales=total_sales,
        sales_count=sales_count,
        cash_sales=cash_sales,
        card_sales=card_sales,
        bank_sales=bank_sales,
        total_expenses=total_expenses,
        expenses_count=expenses_count,
        net_profit=net_profit,
        current_cashbook_balance=current_cashbook_balance,
        reconciliation=reconciliation
    )

@router.get("/monthly", response_model=MonthlyReportResponse)
def get_monthly_report(
    month_str: Optional[str] = Query(None, alias="month", description="Month in YYYY-MM format"),
    db: Session = Depends(get_db)
):
    if month_str:
        try:
            target_dt = datetime.strptime(month_str, "%Y-%m")
            year = target_dt.year
            month = target_dt.month
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid month format, expected YYYY-MM")
    else:
        now = datetime.now()
        year = now.year
        month = now.month
        month_str = f"{year}-{month:02d}"

    # Calculate month date range
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)

    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date, datetime.min.time())

    # Sales in month
    sales = db.query(Sale).filter(Sale.created_at >= start_dt, Sale.created_at < end_dt).all()
    total_sales = sum(s.total for s in sales) if sales else Decimal("0.00")
    sales_count = len(sales)

    # Expenses in month
    expenses = db.query(Expense).filter(Expense.expense_date >= start_date, Expense.expense_date < end_date).all()
    total_expenses = sum(e.amount for e in expenses) if expenses else Decimal("0.00")
    expenses_count = len(expenses)

    net_profit = total_sales - total_expenses

    # Category breakdown for expenses
    expense_breakdown: Dict[str, float] = {}
    for exp in expenses:
        cat = exp.category
        expense_breakdown[cat] = float(expense_breakdown.get(cat, 0.0) + float(exp.amount))

    # Category breakdown for items sold
    sale_items = (
        db.query(SaleItem, Item.category)
        .join(Sale, Sale.id == SaleItem.sale_id)
        .outerjoin(Item, Item.id == SaleItem.item_id)
        .filter(Sale.created_at >= start_dt, Sale.created_at < end_dt)
        .all()
    )
    category_breakdown: Dict[str, float] = {}
    for s_item, cat in sale_items:
        category_key = cat or "other"
        category_breakdown[category_key] = float(category_breakdown.get(category_key, 0.0) + float(s_item.line_total))

    return MonthlyReportResponse(
        month=month_str,
        total_sales=total_sales,
        sales_count=sales_count,
        total_expenses=total_expenses,
        expenses_count=expenses_count,
        net_profit=net_profit,
        category_breakdown=category_breakdown,
        expense_breakdown=expense_breakdown
    )
