from datetime import datetime, date
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field

# --- Item Schemas ---
class ItemBase(BaseModel):
    name: str
    category: str
    unit: str = "each"
    unit_price: Decimal
    barcode: Optional[str] = None
    is_active: bool = True

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    unit_price: Optional[Decimal] = None
    barcode: Optional[str] = None
    is_active: Optional[bool] = None

class ItemResponse(ItemBase):
    id: int

    class Config:
        from_attributes = True


# --- Sale Schemas ---
class SaleItemCreate(BaseModel):
    item_id: Optional[int] = None
    description: str
    quantity: Decimal = Field(gt=0)
    unit_price: Decimal = Field(ge=0)

class SaleItemResponse(BaseModel):
    id: int
    item_id: Optional[int]
    description: str
    quantity: Decimal
    unit_price: Decimal
    line_total: Decimal

    class Config:
        from_attributes = True

class SaleCreate(BaseModel):
    cashier_id: Optional[int] = None
    items: List[SaleItemCreate]
    discount: Decimal = Decimal("0.00")
    tax_amount: Decimal = Decimal("0.00")
    payment_method: str = "cash"  # 'cash' | 'card' | 'bank'

class SaleResponse(BaseModel):
    id: int
    bill_number: str
    cashier_id: Optional[int]
    subtotal: Decimal
    discount: Decimal
    tax_amount: Decimal
    total: Decimal
    payment_method: str
    created_at: datetime
    items: List[SaleItemResponse]

    class Config:
        from_attributes = True


# --- Expense Schemas ---
class ExpenseCreate(BaseModel):
    expense_date: Optional[date] = None
    category: str  # 'ink' | 'paper' | 'electricity' | 'rent' | 'maintenance' | 'other'
    amount: Decimal = Field(gt=0)
    description: Optional[str] = None
    created_by: Optional[int] = None

class ExpenseResponse(BaseModel):
    id: int
    expense_date: date
    category: str
    amount: Decimal
    description: Optional[str]
    created_by: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Cashbook Schemas ---
class CashbookEntryResponse(BaseModel):
    id: int
    entry_date: date
    entry_type: str  # 'cash_in' | 'cash_out'
    category: str
    reference_table: Optional[str]
    reference_id: Optional[int]
    amount: Decimal
    running_balance: Decimal
    note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class CashAdjustmentCreate(BaseModel):
    amount: Decimal
    entry_type: str  # 'cash_in' | 'cash_out'
    category: str  # 'owner_deposit' | 'owner_withdrawal'
    note: Optional[str] = None

class OpeningFloatCreate(BaseModel):
    amount: Decimal = Field(ge=0)
    note: Optional[str] = "Morning cash float"

class CashBalanceResponse(BaseModel):
    running_balance: Decimal
    has_opening_float: bool
    opening_amount: Optional[Decimal] = None
    entries_count: int



# --- Reports Schemas ---
class ReconciliationStatus(BaseModel):
    is_balanced: bool
    cashbook_balance: Decimal
    calculated_cash_position: Decimal
    difference: Decimal
    explanation: str

class DailyReportResponse(BaseModel):
    date: str
    total_sales: Decimal
    sales_count: int
    cash_sales: Decimal
    card_sales: Decimal
    bank_sales: Decimal
    total_expenses: Decimal
    expenses_count: int
    net_profit: Decimal
    current_cashbook_balance: Decimal
    reconciliation: ReconciliationStatus

class MonthlyReportResponse(BaseModel):
    month: str
    total_sales: Decimal
    sales_count: int
    total_expenses: Decimal
    expenses_count: int
    net_profit: Decimal
    category_breakdown: dict
    expense_breakdown: dict


# --- User & Auth Schemas ---
class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
