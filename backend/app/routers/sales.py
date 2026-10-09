from datetime import datetime, date
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Sale, SaleItem, User
from app.schemas import SaleCreate, SaleResponse
from app.services.redis_service import redis_service
from app.services.cashbook_service import record_cashbook_transaction
from app.routers.auth import get_current_user

router = APIRouter(prefix="/sales", tags=["sales"])

@router.post("", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
def create_sale(
    sale_in: SaleCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    if not sale_in.items:
        raise HTTPException(status_code=400, detail="Sale must contain at least one item")

    # Compute subtotal and prepare sale items
    subtotal = Decimal("0.00")
    sale_items_data = []

    for item_data in sale_in.items:
        qty = Decimal(str(item_data.quantity))
        price = Decimal(str(item_data.unit_price))
        line_total = qty * price
        subtotal += line_total
        sale_items_data.append({
            "item_id": item_data.item_id,
            "description": item_data.description,
            "quantity": qty,
            "unit_price": price,
            "line_total": line_total
        })

    discount = Decimal(str(sale_in.discount or 0))
    tax_amount = Decimal(str(sale_in.tax_amount or 0))
    total = max(Decimal("0.00"), subtotal - discount + tax_amount)

    # Fallback count in case Redis is offline
    today_start = datetime.combine(date.today(), datetime.min.time())
    db_count = db.query(Sale).filter(Sale.created_at >= today_start).count()

    bill_number = redis_service.generate_bill_number(db_fallback_count=db_count)

    cashier_id = sale_in.cashier_id or (current_user.id if current_user else None)

    try:
        # 1. Create Sale Header
        new_sale = Sale(
            bill_number=bill_number,
            cashier_id=cashier_id,
            subtotal=subtotal,
            discount=discount,
            tax_amount=tax_amount,
            total=total,
            payment_method=sale_in.payment_method.lower()
        )
        db.add(new_sale)
        db.flush()

        # 2. Create Sale Items
        for item_dict in sale_items_data:
            s_item = SaleItem(
                sale_id=new_sale.id,
                item_id=item_dict["item_id"],
                description=item_dict["description"],
                quantity=item_dict["quantity"],
                unit_price=item_dict["unit_price"],
                line_total=item_dict["line_total"]
            )
            db.add(s_item)

        # 3. Post to Cashbook atomically inside the same transaction
        record_cashbook_transaction(
            db=db,
            entry_type="cash_in",
            category="sale",
            amount=total,
            reference_table="sales",
            reference_id=new_sale.id,
            note=f"Bill #{bill_number} ({sale_in.payment_method.upper()})"
        )

        db.commit()
        db.refresh(new_sale)
        return new_sale

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record sale: {str(e)}"
        )

@router.get("", response_model=List[SaleResponse])
def get_sales(
    date_str: Optional[str] = Query(None, alias="date", description="Filter by date (YYYY-MM-DD)"),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Sale)
    if date_str:
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            start_dt = datetime.combine(target_date, datetime.min.time())
            end_dt = datetime.combine(target_date, datetime.max.time())
            query = query.filter(Sale.created_at >= start_dt, Sale.created_at <= end_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format, expected YYYY-MM-DD")

    return query.order_by(Sale.created_at.desc()).offset(offset).limit(limit).all()

@router.get("/{identifier}", response_model=SaleResponse)
def get_sale(identifier: str, db: Session = Depends(get_db)):
    if identifier.isdigit():
        sale = db.query(Sale).filter(Sale.id == int(identifier)).first()
    else:
        sale = db.query(Sale).filter(Sale.bill_number == identifier).first()

    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale
