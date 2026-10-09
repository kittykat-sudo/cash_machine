from datetime import date
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session
from app.models import CashbookEntry
from app.services.redis_service import redis_service

def record_cashbook_transaction(
    db: Session,
    entry_type: str,            # 'cash_in' | 'cash_out'
    category: str,              # 'sale' | 'expense' | 'owner_deposit' | 'owner_withdrawal'
    amount: Decimal,
    reference_table: Optional[str] = None,
    reference_id: Optional[int] = None,
    note: Optional[str] = None,
    entry_date: Optional[date] = None
) -> CashbookEntry:
    """
    Appends a row to cashbook_entries inside the caller's active database transaction.
    Locks the latest entry with FOR UPDATE to guarantee correct running balance calculation.
    """
    if entry_date is None:
        entry_date = date.today()

    latest_entry = (
        db.query(CashbookEntry)
        .order_by(CashbookEntry.id.desc())
        .with_for_update()
        .first()
    )

    prev_balance = latest_entry.running_balance if latest_entry else Decimal("0.00")

    if entry_type == "cash_in":
        new_balance = prev_balance + Decimal(str(amount))
    elif entry_type == "cash_out":
        new_balance = prev_balance - Decimal(str(amount))
    else:
        raise ValueError(f"Invalid entry_type: {entry_type}")

    entry = CashbookEntry(
        entry_date=entry_date,
        entry_type=entry_type,
        category=category,
        reference_table=reference_table,
        reference_id=reference_id,
        amount=amount,
        running_balance=new_balance,
        note=note
    )

    db.add(entry)
    db.flush()  # Ensures entry.id is assigned

    # Update Redis cache with latest running balance
    redis_service.set_cached_cash_balance(new_balance)

    return entry
