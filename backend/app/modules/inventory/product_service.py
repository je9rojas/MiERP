# /backend/app/modules/inventory/product_service.py
# SERVICIO REFACTORIZADO PARA USAR EL PATRÓN REPOSITORIO

from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

from .product_models import ProductCreate, ProductInDB, ProductUpdate
from .repositories.product_repository import ProductRepository


# --- Funciones del Servicio de Productos ---

async def create_product(db: AsyncIOMotorDatabase, product_data: ProductCreate) -> ProductInDB:
    repo = ProductRepository(db)
    
    # Lógica de negocio
    if await repo.find_by_sku(product_data.sku):
        raise ValueError(f"El SKU '{product_data.sku}' ya está registrado.")
    
    product_to_db = ProductInDB(**product_data.model_dump(exclude_unset=True))
    product_doc = product_to_db.model_dump(by_alias=True)
    
    # El servicio le dice al repositorio que inserte
    inserted_id = await repo.insert_one(product_doc)
    
    created_product_doc = await repo.find_by_id(str(inserted_id))
    return ProductInDB(**created_product_doc)


async def get_products_with_filters_and_pagination(
    db: AsyncIOMotorDatabase,
    search: Optional[str], brand: Optional[str], product_type: Optional[str], page: int, page_size: int,
) -> Dict[str, Any]:
    repo = ProductRepository(db)
    query = {"is_active": True}
    if search:
        query["$or"] = [{"name": {"$regex": search, "$options": "i"}}, {"sku": {"$regex": search, "$options": "i"}}]
    if brand:
        query["brand"] = brand
    if product_type:
        query["product_type"] = product_type
        
    total_count = await repo.count_documents(query)
    skip = (page - 1) * page_size
    product_docs = await repo.find_paginated(query, skip, page_size)
    
    items = [ProductInDB(**doc) for doc in product_docs]
    return {"total": total_count, "items": items}


async def get_product_by_sku(db: AsyncIOMotorDatabase, sku: str) -> Optional[ProductInDB]:
    repo = ProductRepository(db)
    product_doc = await repo.find_by_sku(sku)
    if product_doc:
        return ProductInDB(**product_doc)
    return None


async def update_product_by_sku(db: AsyncIOMotorDatabase, sku: str, product_update_data: ProductUpdate) -> Optional[ProductInDB]:
    repo = ProductRepository(db)
    update_data = product_update_data.model_dump(exclude_unset=True)
    if not update_data:
        return await get_product_by_sku(db, sku)

    update_data["updated_at"] = datetime.now(timezone.utc)
    matched_count = await repo.update_one(sku, update_data)

    if matched_count > 0:
        return await get_product_by_sku(db, sku)
    return None


async def deactivate_product_by_sku(db: AsyncIOMotorDatabase, sku: str) -> bool:
    repo = ProductRepository(db)
    update_data = {"is_active": False, "updated_at": datetime.now(timezone.utc)}
    modified_count = await repo.deactivate_one(sku, update_data)
    return modified_count > 0