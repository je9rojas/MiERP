# /backend/app/modules/inventory/product_service.py

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
import json

# Modelos
from .product_models import (
    ProductCreate, ProductInDB, ProductUpdate, ProductOut,
    ProductCategory, FilterType, ProductShape
)

# Repositorios
from .repositories.product_repository import ProductRepository

# ==============================================================================
# SECCIÓN 2: FUNCIONES DEL SERVICIO
# ==============================================================================

async def create_product(database: AsyncIOMotorDatabase, product_data: ProductCreate) -> ProductOut:
    """
    Crea un nuevo producto maestro en el catálogo.

    Valida la unicidad del SKU y crea el documento del producto. El stock y costo
    se inicializan en cero; la creación de lotes iniciales se gestiona externamente.
    """
    product_repo = ProductRepository(database)
    
    if await product_repo.find_by_sku(product_data.sku):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El SKU '{product_data.sku}' ya está registrado."
        )
    
    product_to_db = ProductInDB(**product_data.model_dump())
    
    document_to_insert = product_to_db.model_dump(by_alias=True, exclude={'id'})
    document_to_insert['_id'] = product_to_db.id
    
    inserted_id = await product_repo.insert_one(document_to_insert)
    created_product_doc = await product_repo.find_by_id(str(inserted_id))
    
    if not created_product_doc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error crítico: No se pudo recuperar el producto después de su creación."
        )

    return ProductOut.model_validate(created_product_doc)

async def get_product_by_id(database: AsyncIOMotorDatabase, product_id: str) -> ProductOut:
    """Obtiene un único producto por su ID de base de datos."""
    repo = ProductRepository(database)
    product_doc = await repo.find_by_id(product_id)
    if not product_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con ID '{product_id}' no encontrado.")
    return ProductOut.model_validate(product_doc)

async def get_product_by_sku(database: AsyncIOMotorDatabase, sku: str) -> ProductOut:
    """Obtiene un único producto por su SKU."""
    repo = ProductRepository(database)
    product_doc = await repo.find_by_sku(sku)
    if not product_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con SKU '{sku}' no encontrado.")
    return ProductOut.model_validate(product_doc)

async def update_product_by_sku(database: AsyncIOMotorDatabase, sku: str, product_update_data: ProductUpdate) -> ProductOut:
    """
    Actualiza la información de catálogo de un producto de forma robusta.
    """
    repo = ProductRepository(database)
    update_data = product_update_data.model_dump(exclude_unset=True)
    if not update_data:
        return await get_product_by_sku(database, sku)

    update_payload = {"$set": update_data}
    update_payload["$set"]["updated_at"] = datetime.now(timezone.utc)
    
    updated_doc = await repo.update_and_find_by_sku(sku, update_payload)
    if not updated_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con SKU '{sku}' no encontrado para actualizar.")

    return ProductOut.model_validate(updated_doc)

async def get_products_paginated(
    database: AsyncIOMotorDatabase, page: int, page_size: int, search: Optional[str], brand: Optional[str],
    category: Optional[ProductCategory], product_type: Optional[FilterType], shape: Optional[ProductShape]
) -> Dict[str, Any]:
    """Obtiene una lista paginada y filtrada de productos activos."""
    repo = ProductRepository(database)
    query: Dict[str, Any] = {"is_active": True}
    
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        query["$or"] = [{"sku": search_regex}, {"name": search_regex}, {"brand": search_regex}]
    if brand: query["brand"] = brand
    if category: query["category"] = category.value
    if product_type: query["product_type"] = product_type.value
    if shape: query["shape"] = shape.value
        
    skip = (page - 1) * page_size
    product_docs = await repo.find_paginated(query, skip, page_size)
    total_count = await repo.count_documents(query)
    
    items = [ProductOut.model_validate(doc) for doc in product_docs]
    
    paginated_response = {"total_count": total_count, "items": items}
    
    # --- BLOQUE DE DEPURACIÓN ---
    print("\n[DEBUG-PRODUCT-LIST] Documentos a punto de ser enviados a la API:")
    serializable_items = [item.model_dump() for item in paginated_response["items"]]
    print(json.dumps({"total_count": paginated_response["total_count"], "items": serializable_items}, indent=2, default=str))
    print("-" * 50)
    # --- FIN DEL BLOQUE DE DEPURACIÓN ---

    return paginated_response

async def deactivate_product_by_sku(database: AsyncIOMotorDatabase, sku: str) -> bool:
    """Desactiva un producto (borrado lógico)."""
    repo = ProductRepository(database)
    update_data = {"is_active": False, "updated_at": datetime.now(timezone.utc)}
    modified_count = await repo.deactivate_one(sku, update_data)
    return modified_count > 0