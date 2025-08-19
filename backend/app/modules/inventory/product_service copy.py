# backend/app/modules/inventory/product_service.py

"""
Capa de Servicio para la gestión del Catálogo de Productos.

Contiene la lógica de negocio para las operaciones CRUD (Crear, Leer, Actualizar,
Borrar) de los productos maestros. Este servicio es agnóstico a la lógica de
stock transaccional, la cual es responsabilidad del 'inventory_service'.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import HTTPException, status

# Modelos
from .product_models import (
    ProductCreate, ProductInDB, ProductUpdate, ProductOut, ProductOutDetail,
    ProductCategory, FilterType, ProductShape
)

# Repositorios
from .repositories.product_repository import ProductRepository

# ==============================================================================
# SECCIÓN 2: FUNCIONES DEL SERVICIO
# ==============================================================================

async def create_product(db: AsyncIOMotorDatabase, product_data: ProductCreate) -> ProductOutDetail:
    """
    Crea un nuevo producto maestro en el catálogo.

    Esta función valida la unicidad del SKU y crea el documento del producto
    con valores de stock y costo inicializados en cero. La creación del lote
    de inventario inicial es gestionada por un orquestador externo (la capa de rutas).
    """
    product_repo = ProductRepository(db)
    
    if await product_repo.find_by_sku(product_data.sku):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El SKU '{product_data.sku}' ya está registrado."
        )
    
    # Se extraen los datos del lote inicial para que el orquestador los maneje.
    # El producto maestro siempre se crea con stock y valor cero.
    product_data_for_db = product_data.model_copy(
        update={
            "stock_quantity": 0,
            "average_cost": 0.0,
            "total_value": 0.0
        }
    )
    
    product_to_db = ProductInDB(**product_data_for_db.model_dump())
    inserted_id = await product_repo.insert_one(product_to_db.model_dump(by_alias=True))
    
    created_product_doc = await product_repo.find_by_id(str(inserted_id))
    if not created_product_doc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error crítico: No se pudo recuperar el producto inmediatamente después de su creación."
        )

    return ProductOutDetail.model_validate(created_product_doc)


async def get_product_by_id(db: AsyncIOMotorDatabase, product_id: str) -> ProductOutDetail:
    """Obtiene un único producto por su ID de base de datos."""
    repo = ProductRepository(db)
    product_doc = await repo.find_by_id(product_id)
    if not product_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con ID '{product_id}' no encontrado.")
    return ProductOutDetail.model_validate(product_doc)


async def get_product_by_sku(db: AsyncIOMotorDatabase, sku: str) -> ProductOutDetail:
    """Obtiene un único producto por su SKU."""
    repo = ProductRepository(db)
    product_doc = await repo.find_by_sku(sku)
    if not product_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con SKU '{sku}' no encontrado.")
    return ProductOutDetail.model_validate(product_doc)


async def update_product_by_sku(
    db: AsyncIOMotorDatabase, sku: str, product_update_data: ProductUpdate
) -> ProductOutDetail:
    """

    Actualiza la información de catálogo de un producto de forma robusta.
    Maneja correctamente los campos anidados y opcionales para operaciones PATCH.
    """
    repo = ProductRepository(db)
    
    update_data = product_update_data.model_dump(exclude_unset=True)
    
    if not update_data:
        return await get_product_by_sku(db, sku)

    update_payload = {"$set": {}}

    nested_fields = ["dimensions", "oem_codes", "cross_references", "applications"]
    for field in nested_fields:
        if field in update_data:
            update_payload["$set"][field] = update_data.pop(field)

    update_payload["$set"].update(update_data)
    update_payload["$set"]["updated_at"] = datetime.now(timezone.utc)
    
    updated_doc = await repo.update_and_find_by_sku(sku, update_payload)
    
    if not updated_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Producto con SKU '{sku}' no encontrado para actualizar."
        )

    return ProductOutDetail.model_validate(updated_doc)


async def get_products_paginated(
    db: AsyncIOMotorDatabase, page: int, page_size: int, search: Optional[str], brand: Optional[str],
    category: Optional[ProductCategory], product_type: Optional[FilterType], shape: Optional[ProductShape]
) -> Dict[str, Any]:
    """Obtiene una lista paginada y filtrada de productos activos."""
    repo = ProductRepository(db)
    query: Dict[str, Any] = {"is_active": True}
    
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        query["$or"] = [{"sku": search_regex}, {"name": search_regex}, {"brand": search_regex}]
    if brand:
        query["brand"] = brand
    if category:
        query["category"] = category.value
    if product_type:
        query["product_type"] = product_type.value
    if shape:
        query["shape"] = shape.value
        
    skip = (page - 1) * page_size
    product_docs = await repo.find_paginated(query, skip, page_size)
    total_count = await repo.count_documents(query)
    
    items = [ProductOut.model_validate(doc) for doc in product_docs]
    return {"total_count": total_count, "items": items}


async def deactivate_product_by_sku(db: AsyncIOMotorDatabase, sku: str) -> bool:
    """Desactiva un producto (borrado lógico)."""
    repo = ProductRepository(db)
    update_data = {"is_active": False, "updated_at": datetime.now(timezone.utc)}
    modified_count = await repo.deactivate_one(sku, update_data)
    return modified_count > 0