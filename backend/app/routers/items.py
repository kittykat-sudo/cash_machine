from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Item
from app.schemas import ItemCreate, ItemUpdate, ItemResponse

router = APIRouter(prefix="/items", tags=["items"])

@router.get("", response_model=List[ItemResponse])
def get_items(
    category: Optional[str] = Query(None, description="Filter items by category"),
    active_only: bool = Query(True, description="Only return active items"),
    db: Session = Depends(get_db)
):
    query = db.query(Item)
    if active_only:
        query = query.filter(Item.is_active == True)
    if category and category.lower() != "all":
        query = query.filter(Item.category == category.lower())

    return query.order_by(Item.category, Item.id).all()

@router.get("/{item_id}", response_model=ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(item_in: ItemCreate, db: Session = Depends(get_db)):
    item = Item(
        name=item_in.name,
        category=item_in.category.lower(),
        unit=item_in.unit,
        unit_price=item_in.unit_price,
        barcode=item_in.barcode,
        is_active=item_in.is_active
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.patch("/{item_id}", response_model=ItemResponse)
def update_item(item_id: int, item_in: ItemUpdate, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    update_data = item_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "category" and value:
            setattr(item, key, value.lower())
        else:
            setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    # Soft delete
    item.is_active = False
    db.commit()
    return None
