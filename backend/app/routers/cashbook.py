from datetime import datetime, date
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CashbookEntry, EquityLedger
from app.schemas import (
    CashbookEntryResponse,
    CashAdjustmentCreate,
    OpeningFloatCreate,
    CashBalanceResponse,
)
from app.services.cashbook_service import record_cashbook_transaction
from app.services.redis_service import redis_service

router = APIRouter(prefix="/cashbook", tags=["cashbook"])

@router.get("", response_model=List[CashbookEntryResponse])
def get_cashbook_entries(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(CashbookEntry)
    if start_date:
        try:
            s_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            query = query.filter(CashbookEntry.entry_date >= s_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date")
    if end_date:
        try:
            e_date = datetime.strptime(end_date, "%Y-%m-%d").date()
            query = query.filter(CashbookEntry.entry_date <= e_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date")

    return query.order_by(CashbookEntry.id.desc()).limit(limit).all()

@router.get("/balance", response_model=CashBalanceResponse)
def get_current_balance(db: Session = Depends(get_db)):
    # Always query latest DB state to ensure 100% accuracy even if rows were manually altered
    latest = db.query(CashbookEntry).order_by(CashbookEntry.id.desc()).first()
    balance = latest.running_balance if latest else Decimal("0.00")
    redis_service.set_cached_cash_balance(balance)

    today = date.today()
    today_opening = db.query(CashbookEntry).filter(
        CashbookEntry.entry_date == today,
        CashbookEntry.category.in_(["opening_capital", "owner_deposit"])
    ).first()

    entries_count = db.query(CashbookEntry).count()

    return {
        "running_balance": balance,
        "has_opening_float": today_opening is not None,
        "opening_amount": today_opening.amount if today_opening else None,
        "entries_count": entries_count
    }

@router.post("/opening-float", response_model=CashbookEntryResponse, status_code=status.HTTP_201_CREATED)
def set_opening_float(float_in: OpeningFloatCreate, db: Session = Depends(get_db)):
    try:
        # Record in equity ledger
        equity_entry = EquityLedger(
            entry_date=date.today(),
            entry_type="opening_capital",
            amount=float_in.amount,
            note=float_in.note or "Morning opening cash drawer float"
        )
        db.add(equity_entry)

        # Record in cashbook
        entry = record_cashbook_transaction(
            db=db,
            entry_type="cash_in",
            category="opening_capital",
            amount=float_in.amount,
            note=float_in.note or "Morning opening cash drawer float"
        )

        db.commit()
        db.refresh(entry)
        redis_service.set_cached_cash_balance(entry.running_balance)
        return entry
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to record opening float: {str(e)}")


@router.post("/adjust", response_model=CashbookEntryResponse, status_code=status.HTTP_201_CREATED)
def adjust_cash(adj: CashAdjustmentCreate, db: Session = Depends(get_db)):
    if adj.entry_type not in ["cash_in", "cash_out"]:
        raise HTTPException(status_code=400, detail="entry_type must be cash_in or cash_out")

    valid_categories = ["owner_deposit", "owner_withdrawal", "opening_capital"]
    if adj.category not in valid_categories:
        raise HTTPException(status_code=400, detail=f"category must be one of {valid_categories}")

    try:
        # Record in equity ledger
        equity_type = "owner_drawing" if adj.entry_type == "cash_out" else "owner_deposit"
        equity_entry = EquityLedger(
            entry_date=date.today(),
            entry_type=equity_type,
            amount=adj.amount,
            note=adj.note
        )
        db.add(equity_entry)

        # Record in cashbook
        entry = record_cashbook_transaction(
            db=db,
            entry_type=adj.entry_type,
            category=adj.category,
            amount=adj.amount,
            note=adj.note or f"Capital adjustment: {adj.category}"
        )

        db.commit()
        db.refresh(entry)
        return entry
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Adjustment failed: {str(e)}")
