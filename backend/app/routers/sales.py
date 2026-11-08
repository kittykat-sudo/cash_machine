from datetime import datetime, date
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_

from app.database import get_db
from app.models import Sale, SaleItem, User
from app.schemas import SaleCreate, SaleResponse, SaleUpdate, WhatsAppSendRequest, WhatsAppSendResponse
from app.services.redis_service import redis_service
from app.services.cashbook_service import record_cashbook_transaction
from app.services.whatsapp_service import whatsapp_service
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
            customer_name=sale_in.customer_name.strip() if sale_in.customer_name else None,
            customer_phone=sale_in.customer_phone.strip() if sale_in.customer_phone else None,
            order_status=(sale_in.order_status or "completed").lower(),
            notes=sale_in.notes.strip() if sale_in.notes else None,
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
        cust_suffix = f" - {sale_in.customer_name.strip()}" if sale_in.customer_name and sale_in.customer_name.strip() else ""
        record_cashbook_transaction(
            db=db,
            entry_type="cash_in",
            category="sale",
            amount=total,
            reference_table="sales",
            reference_id=new_sale.id,
            note=f"Bill #{bill_number} ({sale_in.payment_method.upper()}){cust_suffix}"
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
    month: Optional[str] = Query(None, description="Filter by month (YYYY-MM)"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by order status (pending, in_progress, ready, completed, cancelled)"),
    search: Optional[str] = Query(None, description="Search term for bill#, customer, phone, or item description"),
    limit: int = Query(500, le=2000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Sale).options(
        joinedload(Sale.items).joinedload(SaleItem.item)
    )

    if status_filter and status_filter.lower() != "all":
        query = query.filter(Sale.order_status == status_filter.lower())

    if month:
        try:
            target_dt = datetime.strptime(month, "%Y-%m")
            year = target_dt.year
            m = target_dt.month
            start_d = date(year, m, 1)
            end_d = date(year + 1, 1, 1) if m == 12 else date(year, m + 1, 1)
            start_dt = datetime.combine(start_d, datetime.min.time())
            end_dt = datetime.combine(end_d, datetime.min.time())
            query = query.filter(Sale.created_at >= start_dt, Sale.created_at < end_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid month format, expected YYYY-MM")
    elif date_str:
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            start_dt = datetime.combine(target_date, datetime.min.time())
            end_dt = datetime.combine(target_date, datetime.max.time())
            query = query.filter(Sale.created_at >= start_dt, Sale.created_at <= end_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format, expected YYYY-MM-DD")
    else:
        if start_date:
            try:
                s_date = datetime.strptime(start_date, "%Y-%m-%d").date()
                query = query.filter(Sale.created_at >= datetime.combine(s_date, datetime.min.time()))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format, expected YYYY-MM-DD")
        if end_date:
            try:
                e_date = datetime.strptime(end_date, "%Y-%m-%d").date()
                query = query.filter(Sale.created_at <= datetime.combine(e_date, datetime.max.time()))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format, expected YYYY-MM-DD")

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        subquery = db.query(SaleItem.sale_id).filter(func.lower(SaleItem.description).like(term))
        query = query.filter(
            or_(
                func.lower(Sale.bill_number).like(term),
                func.lower(Sale.customer_name).like(term),
                func.lower(Sale.customer_phone).like(term),
                Sale.id.in_(subquery)
            )
        )

    return query.order_by(Sale.created_at.desc(), Sale.id.desc()).offset(offset).limit(limit).all()

@router.get("/{identifier}", response_model=SaleResponse)
def get_sale(identifier: str, db: Session = Depends(get_db)):
    if identifier.isdigit():
        sale = db.query(Sale).filter(Sale.id == int(identifier)).first()
    else:
        sale = db.query(Sale).filter(Sale.bill_number == identifier).first()

    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale

@router.patch("/{identifier}", response_model=SaleResponse)
def update_sale(
    identifier: str,
    update_data: SaleUpdate,
    db: Session = Depends(get_db)
):
    if identifier.isdigit():
        sale = db.query(Sale).filter(Sale.id == int(identifier)).first()
    else:
        sale = db.query(Sale).filter(Sale.bill_number == identifier).first()

    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    if update_data.customer_name is not None:
        sale.customer_name = update_data.customer_name.strip() if update_data.customer_name else None
    if update_data.customer_phone is not None:
        sale.customer_phone = update_data.customer_phone.strip() if update_data.customer_phone else None
    if update_data.order_status is not None:
        sale.order_status = update_data.order_status.lower()
    if update_data.notes is not None:
        sale.notes = update_data.notes.strip() if update_data.notes else None

    db.commit()
    db.refresh(sale)
    return sale

@router.patch("/{identifier}/status", response_model=SaleResponse)
def update_sale_status(
    identifier: str,
    new_status: str = Query(..., description="New order status (pending, in_progress, ready, completed, cancelled)"),
    db: Session = Depends(get_db)
):
    if identifier.isdigit():
        sale = db.query(Sale).filter(Sale.id == int(identifier)).first()
    else:
        sale = db.query(Sale).filter(Sale.bill_number == identifier).first()

    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    valid_statuses = ["pending", "in_progress", "ready", "completed", "cancelled"]
    clean_status = new_status.strip().lower()
    if clean_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status '{new_status}'. Must be one of {valid_statuses}")

    sale.order_status = clean_status
    db.commit()
    db.refresh(sale)
    return sale

@router.post("/{identifier}/whatsapp", response_model=WhatsAppSendResponse)
def send_sale_whatsapp(
    identifier: str,
    req: WhatsAppSendRequest,
    db: Session = Depends(get_db)
):
    if identifier.isdigit():
        sale = db.query(Sale).filter(Sale.id == int(identifier)).first()
    else:
        sale = db.query(Sale).filter(Sale.bill_number == identifier).first()

    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    target_phone = req.phone or sale.customer_phone
    if not target_phone or not target_phone.strip():
        raise HTTPException(
            status_code=400,
            detail="No customer WhatsApp number found for this order. Please provide a phone number."
        )

    # Generate message content
    if req.message_type == "bill":
        msg = whatsapp_service.build_bill_message(sale)
    elif req.message_type == "status":
        status_to_use = req.status or sale.order_status or "received"
        msg = whatsapp_service.build_progress_message(sale, status=status_to_use, custom_text=req.custom_message)
    elif req.message_type == "custom":
        msg = req.custom_message or ""
        if not msg.strip():
            raise HTTPException(status_code=400, detail="custom_message cannot be empty for custom message type")
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported message_type '{req.message_type}'")

    wa_link = whatsapp_service.build_wa_link(target_phone, msg)

    sent_via_api = False
    details = None

    if req.send_direct:
        api_result = whatsapp_service.send_via_api(target_phone, msg)
        sent_via_api = api_result.get("success", False) and api_result.get("provider") in ("bridge", "meta_cloud", "twilio")
        details = api_result.get("error") or api_result.get("info") or str(api_result.get("response") or "")

    return WhatsAppSendResponse(
        success=True,
        phone=target_phone,
        message=msg,
        wa_link=wa_link,
        sent_via_api=sent_via_api,
        details=details
    )
