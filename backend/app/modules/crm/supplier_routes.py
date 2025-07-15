# /backend/app/modules/crm/supplier_routes.py
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.core.database import get_db
from app.dependencies.roles import role_checker
from app.modules.users.user_models import UserRole
from . import crm_service # Importamos el servicio
from .supplier_models import SupplierCreate, SupplierOut, SupplierUpdate

router = APIRouter(prefix="/suppliers", tags=["CRM - Suppliers"])

class PaginatedSupplierResponse(BaseModel):
    total: int
    items: List[SupplierOut]

@router.get("/", response_model=PaginatedSupplierResponse)
async def get_all_suppliers_route(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: dict = Depends(role_checker(UserRole.all_roles())),
    search: Optional[str] = None,
    page: int = 1,
    pageSize: int = 10,
):
    result = await crm_service.get_suppliers_with_filters(
        db=db, search=search, page=page, page_size=pageSize
    )
    return result

@router.post("/", response_model=SupplierOut, status_code=status.HTTP_201_CREATED)
async def create_new_supplier_route(
    supplier_data: SupplierCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: dict = Depends(role_checker([UserRole.ADMIN, UserRole.MANAGER]))
):
    try:
        created_supplier = await crm_service.create_supplier(db, supplier_data)
        return created_supplier
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

# (Aquí añadirías los endpoints PUT, DELETE, GET /{ruc}, etc.)