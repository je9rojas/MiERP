# /backend/app/modules/inventory/product_service.py

"""
Capa de Servicio para la gestión del Catálogo de Productos.

Este módulo contiene la lógica de negocio para las operaciones CRUD (Crear, Leer,
Actualizar, Borrar) de los productos como entidades de catálogo. Es responsable
de mantener la integridad de la información estática del producto.

Para operaciones que involucran movimientos de stock (como la creación de lotes
iniciales), este servicio actúa como un orquestador, delegando la responsabilidad
al `inventory_service` para mantener una clara Separación de Concerns.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

# --- Importaciones de la Librería Estándar y Terceros ---
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

# --- Importaciones de la Aplicación ---
from app.modules.inventory import inventory_service
from .models import (
    ProductCategory, ProductCreate, ProductInDB, ProductOut, ProductShape,
    ProductUpdate, FilterType
)
from .repositories.product_repository import ProductRepository

# ==============================================================================
# SECCIÓN 2: CONFIGURACIÓN DEL LOGGER
# ==============================================================================

logger = logging.getLogger(__name__)

# ==============================================================================
# SECCIÓN 3: OPERACIONES DE CREACIÓN (CREATE)
# ==============================================================================

async def create_product(
    database: AsyncIOMotorDatabase,
    product_data: ProductCreate,
    initial_quantity: int = 0,
    initial_cost: float = 0.0
) -> ProductOut:
    """
    Crea un nuevo producto en el catálogo y orquesta la creación de su lote de inventario inicial.
    """
    product_repository = ProductRepository(database)

    if await product_repository.find_by_sku(product_data.sku):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El SKU '{product_data.sku}' ya está registrado."
        )

    product_to_db = ProductInDB(**product_data.model_dump())
    document_to_insert = product_to_db.model_dump(by_alias=True, exclude={'id'})

    try:
        inserted_id = await product_repository.insert_one(document_to_insert)
        logger.info(f"Producto de catálogo creado con SKU '{product_data.sku}' e ID '{inserted_id}'.")
    except Exception as e:
        logger.error(f"Error al insertar el producto SKU '{product_data.sku}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error al intentar crear el producto."
        )

    if initial_quantity > 0:
        logger.info(f"Delegando creación de lote inicial para SKU '{product_data.sku}'.")
        await inventory_service.create_initial_lot_for_product(
            database=database,
            product_id=str(inserted_id),
            product_sku=product_data.sku,
            quantity=initial_quantity,
            cost=initial_cost
        )

    created_product_doc = await product_repository.find_one_by_id(str(inserted_id))
    if not created_product_doc:
        logger.critical(f"CRÍTICO: No se encontró el producto ID '{inserted_id}' tras su creación.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error crítico al recuperar el producto después de su creación."
        )

    return ProductOut.model_validate(created_product_doc)

# ==============================================================================
# SECCIÓN 4: OPERACIONES DE LECTURA (READ)
# ==============================================================================

async def get_product_by_id(database: AsyncIOMotorDatabase, product_id: str) -> ProductOut:
    """Obtiene un único producto por su ID de base de datos."""
    product_repository = ProductRepository(database)
    product_doc = await product_repository.find_one_by_id(product_id)
    if not product_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con ID '{product_id}' no encontrado.")
    return ProductOut.model_validate(product_doc)

async def get_product_by_sku(database: AsyncIOMotorDatabase, sku: str) -> ProductOut:
    """Obtiene un único producto por su SKU."""
    product_repository = ProductRepository(database)
    product_doc = await product_repository.find_by_sku(sku)
    if not product_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con SKU '{sku}' no encontrado.")
    return ProductOut.model_validate(product_doc)

async def get_products_paginated(
    database: AsyncIOMotorDatabase, page: int, page_size: int, search: Optional[str], brand: Optional[str],
    category: Optional[ProductCategory], product_type: Optional[FilterType], shape: Optional[ProductShape]
) -> Dict[str, Any]:
    """Obtiene una lista paginada y filtrada de productos activos del catálogo."""
    product_repository = ProductRepository(database)
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
        
    skip_amount = (page - 1) * page_size
    
    # --- CORRECCIÓN ---
    # Se utiliza el nombre correcto del método heredado de BaseRepository.
    product_docs = await product_repository.find_all_paginated(
        query=query, 
        skip=skip_amount, 
        limit=page_size, 
        sort=[("sku", 1)]  # Añadimos un ordenamiento por defecto
    )
    
    total_count = await product_repository.count_documents(query)
    
    items = [ProductOut.model_validate(doc) for doc in product_docs]
    
    return {"total_count": total_count, "items": items}

# ==============================================================================
# SECCIÓN 5: OPERACIONES DE ACTUALIZACIÓN (UPDATE)
# ==============================================================================

async def update_product_by_sku(database: AsyncIOMotorDatabase, sku: str, update_dto: ProductUpdate) -> ProductOut:
    """Actualiza la información de catálogo de un producto existente por su SKU."""
    product_repository = ProductRepository(database)
    
    update_data = update_dto.model_dump(exclude_unset=True)
    if not update_data:
        logger.warning(f"Solicitud de actualización para SKU '{sku}' sin datos para cambiar.")
        return await get_product_by_sku(database, sku)

    # --- CORRECCIÓN Y ESTANDARIZACIÓN ---
    # Primero, se localiza el documento para asegurar su existencia y obtener su ID.
    product_to_update = await product_repository.find_by_sku(sku)
    if not product_to_update:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con SKU '{sku}' no encontrado para actualizar.")

    product_id = str(product_to_update["_id"])
    update_payload = {
        "$set": {
            **update_data,
            "updated_at": datetime.now(timezone.utc)
        }
    }
    
    await product_repository.execute_update_one_by_id(product_id, update_payload)
    
    return await get_product_by_id(database, product_id)

async def deactivate_product_by_sku(database: AsyncIOMotorDatabase, sku: str) -> Dict[str, str]:
    """Desactiva un producto (borrado lógico) por su SKU."""
    product_repository = ProductRepository(database)

    # --- CORRECCIÓN Y ESTANDARIZACIÓN ---
    # Se sigue el mismo patrón: buscar primero, luego actuar.
    product_to_deactivate = await product_repository.find_by_sku(sku)
    if not product_to_deactivate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con SKU '{sku}' no encontrado para desactivar.")
    
    product_id = str(product_to_deactivate["_id"])
    update_payload = {
        "$set": {
            "is_active": False,
            "updated_at": datetime.now(timezone.utc)
        }
    }
    
    await product_repository.execute_update_one_by_id(product_id, update_payload)
        
    return {"message": f"Producto con SKU '{sku}' ha sido desactivado exitosamente."}