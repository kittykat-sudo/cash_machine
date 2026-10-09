from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Expense, User
from app.schemas import ExpenseCreate, ExpenseResponse
from app.services.cashbook_service import record_cashbook_transaction
from app.routers.auth import get_current_user

router = APIRouter(prefix="/expenses", tags=["expenses"])

@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    exp_in: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    expense_date = exp_in.expense_date or date.today()
    created_by = exp_in.created_by or (current_user.id if current_user else None)

    try:
        # 1. Save Expense
        expense = Expense(
            expense_date=expense_date,
            category=exp_in.category.lower(),
            amount=exp_in.amount,
            description=exp_in.description,
            created_by=created_by
        )
        db.add(expense)
        db.flush()

        # 2. Record cash_out in cashbook atomically
        record_cashbook_transaction(
            db=db,
            entry_type="cash_out",
            category="expense",
            amount=exp_in.amount,
            reference_table="expenses",
            reference_id=expense.id,
            note=f"Expense: {exp_in.category.capitalize()} - {exp_in.description or 'No note'}",
            entry_date=expense_date
        )

        db.commit()
        db.refresh(expense)
        return expense

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record expense: {str(e)}"
        )

@router.get("", response_model=List[ExpenseResponse])
def get_expenses(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Expense)
    if start_date:
        try:
            s_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            query = query.filter(Expense.expense_date >= s_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date")
    if end_date:
        try:
            e_date = datetime.strptime(end_date, "%Y-%m-%d").date()
            query = query.filter(Expense.expense_date <= e_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date")

    return query.order_by(Expense.expense_date.desc(), Expense.id.desc()).limit(limit).all()
