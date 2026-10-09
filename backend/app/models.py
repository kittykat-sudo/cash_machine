from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Text, Numeric, Boolean, Date, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    email = Column(Text, unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    role = Column(Text, nullable=False, default="cashier")  # 'admin' | 'cashier'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sales = relationship("Sale", back_populates="cashier")
    expenses = relationship("Expense", back_populates="creator")


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    category = Column(Text, nullable=False, index=True)  # 'printing' | 'photocopy' | 'lamination' | 'binding' | 'stationery' | 'other'
    unit = Column(Text, nullable=False, default="each")
    unit_price = Column(Numeric(12, 2), nullable=False)
    barcode = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    bill_number = Column(Text, unique=True, nullable=False, index=True)
    cashier_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    subtotal = Column(Numeric(12, 2), nullable=False)
    discount = Column(Numeric(12, 2), nullable=False, default=0)
    tax_amount = Column(Numeric(12, 2), nullable=False, default=0)
    total = Column(Numeric(12, 2), nullable=False)
    payment_method = Column(Text, nullable=False, default="cash")  # 'cash' | 'card' | 'bank'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    cashier = relationship("User", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=True)
    description = Column(Text, nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    line_total = Column(Numeric(12, 2), nullable=False)

    sale = relationship("Sale", back_populates="items")
    item = relationship("Item")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    expense_date = Column(Date, nullable=False, default=date.today)
    category = Column(Text, nullable=False)  # 'ink' | 'paper' | 'electricity' | 'rent' | 'maintenance' | 'other'
    amount = Column(Numeric(12, 2), nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("User", back_populates="expenses")


class CashbookEntry(Base):
    __tablename__ = "cashbook_entries"

    id = Column(Integer, primary_key=True, index=True)
    entry_date = Column(Date, nullable=False, default=date.today, index=True)
    entry_type = Column(Text, nullable=False)  # 'cash_in' | 'cash_out'
    category = Column(Text, nullable=False)  # 'sale' | 'expense' | 'owner_deposit' | 'owner_withdrawal'
    reference_table = Column(Text, nullable=True)  # 'sales' | 'expenses' | None
    reference_id = Column(Integer, nullable=True)
    amount = Column(Numeric(12, 2), nullable=False)
    running_balance = Column(Numeric(12, 2), nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class EquityLedger(Base):
    __tablename__ = "equity_ledger"

    id = Column(Integer, primary_key=True, index=True)
    entry_date = Column(Date, nullable=False, default=date.today)
    entry_type = Column(Text, nullable=False)  # 'opening_capital' | 'profit_retained' | 'owner_drawing'
    amount = Column(Numeric(12, 2), nullable=False)
    note = Column(Text, nullable=True)
