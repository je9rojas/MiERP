# backend/app/modules/inventory/product_service.py

"""
Capa de Servicio para la gestión del Catálogo de Productos.

Contiene la lógica de negocio para las operaciones CRUD (Crear, Leer, Actualizar,
Borrar) de los productos maestros. No maneja la lógica de stock transaccional,
la cual es responsabilidad exclusiva del 'inventory_service'.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException, status

# Modelos
from .product_models import (
    ProductCreate, ProductInDB, ProductUpdate, ProductOut, ProductOutDetail,
    ProductCategory, FilterType, ProductShape
)
from .inventory_models import InventoryLotInDB

# Repositorios
from .repositories.product_repository import ProductRepository
from .repositories.inventory_lot_repository import InventoryLotRepository

# Servicios
from . import inventory_service

# ==============================================================================
# SECCIÓN 2: FUNCIONES DEL SERVICIO
# ==============================================================================

async def create_product(db: AsyncIOMotorDatabase, product_data: ProductCreate) -> ProductOutDetail:
    """
    Crea un nuevo producto maestro. Si se proporciona un stock inicial, delega
    la creación del lote inicial y el recálculo de stock al servicio de inventario.
    """
    product_repo = ProductRepository(db)
    
    if await product_repo.find_by_sku(product_data.sku):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El SKU '{product_data.sku}' ya está registrado."
        )
    
    initial_stock = product_data.stock_quantity
    initial_cost = product_data.average_cost
    
    # El producto maestro siempre se crea con stock y valor cero.
    # El stock real será determinado por la suma de sus lotes de inventario.
    product_data.stock_quantity = 0
    product_data.average_cost = 0.0
    product_data.total_value = 0.0
    
    product_to_db = ProductInDB(**product_data.model_dump())
    inserted_id = await product_repo.insert_one(product_to_db.model_dump(by_alias=True))
    
    # Si se especificó un stock inicial, se crea el primer lote.
    if initial_stock > 0:
        lot_repo = InventoryLotRepository(db)
        # NOTA: El ID del almacén debería ser dinámico o configurable.
        warehouse_id_placeholder = ObjectId("60d5ec49e7e2d2001e4a0000")
        
        initial_lot = InventoryLotInDB(
            product_id=inserted_id,
            warehouse_id=warehouse_id_placeholder,
            lot_number=f"INICIAL-{product_data.sku}",
            acquisition_cost=initial_cost,
            initial_quantity=initial_stock,
            current_quantity=initial_stock,
        )
        await lot_repo.insert_one(initial_lot.model_dump(by_alias=True))
        
        # Se le pide al servicio de inventario que actualice los totales del producto.
        await inventory_service.update_product_summary_from_lots(db, str(inserted_id))

    created_product_doc = await product_repo.find_by_id(str(inserted_id))
    if not created_product_doc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al recuperar el producto después de la creación."
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
    Maneja correctamente los campos anidados y opcionales.
    """
    repo = ProductRepository(db)
    
    # Convierte el modelo Pydantic a un diccionario, excluyendo campos no enviados.
    # Esto es clave para las actualizaciones parciales (PATCH).
    update_data = product_update_data.model_dump(exclude_unset=True)
    
    if not update_data:
        # Si no se envió ningún dato para actualizar, devuelve el producto actual.
        return await get_product_by_sku(db, sku)

    # --- CORRECCIÓN: Construcción segura del payload para MongoDB ---
    # Se crea un objeto para el operador '$set' de MongoDB.
    update_payload = {"$set": {}}

    # Se procesan los campos anidados (diccionarios y listas) por separado.
    nested_fields = ["dimensions", "oem_codes", "cross_references", "applications"]
    for field in nested_fields:
        if field in update_data:
            # Si el campo anidado está en los datos de entrada, se añade al $set.
            # El valor puede ser un diccionario, una lista o `None` (para borrarlo).
            update_payload["$set"][field] = update_data.pop(field)

    # El resto de los datos (campos de nivel superior) se añaden al $set.
    update_payload["$set"].update(update_data)
    
    # Se añade siempre la fecha de actualización.
    update_payload["$set"]["updated_at"] = datetime.now(timezone.utc)
    
    # Se realiza la actualización en la base de datos y se obtiene el documento actualizado.
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