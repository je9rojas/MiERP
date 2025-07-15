# /backend/app/modules/crm/crm_service.py
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

from .supplier_models import SupplierCreate, SupplierInDB, SupplierUpdate
from .repositories.supplier_repository import SupplierRepository

# --- Funciones del Servicio para Proveedores ---

async def create_supplier(db: AsyncIOMotorDatabase, supplier_data: SupplierCreate) -> SupplierInDB:
    repo = SupplierRepository(db)
    
    # Lógica de negocio: No permitir RUCs duplicados
    if await repo.find_by_ruc(supplier_data.ruc):
        raise ValueError(f"El RUC '{supplier_data.ruc}' ya está registrado.")
    
    supplier_to_db = SupplierInDB(**supplier_data.model_dump())
    supplier_doc = supplier_to_db.model_dump(by_alias=True)
    
    inserted_id = await repo.insert_one(supplier_doc)
    created_supplier_doc = await repo.find_by_id(str(inserted_id))
    
    return SupplierInDB(**created_supplier_doc)


async def get_suppliers_with_filters(db: AsyncIOMotorDatabase, search: Optional[str], page: int, page_size: int) -> Dict[str, Any]:
    repo = SupplierRepository(db)
    query = {"is_active": True}
    if search:
        query["$or"] = [
            {"business_name": {"$regex": search, "$options": "i"}},
            {"trade_name": {"$regex": search, "$options": "i"}},
            {"ruc": {"$regex": search, "$options": "i"}},
        ]
        
    total_count = await repo.count_documents(query)
    skip = (page - 1) * page_size
    supplier_docs = await repo.find_all_paginated(query, skip, page_size)
    
    items = [SupplierInDB(**doc) for doc in supplier_docs]
    return {"total": total_count, "items": items}

# (Aquí añadirías las funciones para update, delete, etc., que llaman a los métodos correspondientes del repositorio)