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
# Modelos
from .product_models import (
    ProductCategory, ProductCreate, ProductInDB, ProductOut, ProductShape,
    ProductUpdate, FilterType
)
# Repositorios
from .repositories.product_repository import ProductRepository
# Otros Servicios (para orquestación)
from app.modules.inventory import inventory_service

# ==============================================================================
# SECCIÓN 2: CONFIGURACIÓN DEL LOGGER
# ==============================================================================

logger = logging.getLogger(__name__)

# ==============================================================================
# SECCIÓN 3: SERVICIOS DEL CATÁLOGO DE PRODUCTOS
# ==============================================================================

async def create_product(
    database: AsyncIOMotorDatabase,
    product_data: ProductCreate,
    initial_quantity: int = 0,
    initial_cost: float = 0.0
) -> ProductOut:
    """
    Crea un nuevo producto maestro en el catálogo y, opcionalmente, su lote de inventario inicial.

    Args:
        database: La instancia de la base de datos.
        product_data: El DTO con la información de catálogo del producto.
        initial_quantity: La cantidad de stock inicial a registrar (opcional).
        initial_cost: El costo de adquisición para el lote inicial (opcional).

    Returns:
        El producto creado, con su estado de inventario final.
    """
    product_repository = ProductRepository(database)

    # Paso 1: Validar que el SKU no exista para mantener la unicidad.
    if await product_repository.find_by_sku(product_data.sku):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El SKU '{product_data.sku}' ya está registrado."
        )

    # Paso 2: Crear la entidad de catálogo del producto.
    # Los campos de inventario (`stock_quantity`, etc.) se inicializarán con sus
    # valores por defecto (0) según el modelo `ProductInDB`.
    product_to_db = ProductInDB(**product_data.model_dump())
    
    document_to_insert = product_to_db.model_dump(by_alias=True, exclude={'id'})
    document_to_insert['_id'] = product_to_db.id
    
    try:
        inserted_id = await product_repository.insert_one(document_to_insert)
        logger.info(f"Producto de catálogo creado con SKU '{product_data.sku}' e ID '{inserted_id}'.")
    except Exception as e:
        logger.error(f"Error al insertar el producto con SKU '{product_data.sku}' en la base de datos: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error al intentar crear el producto."
        )

    # Paso 3: Orquestación. Si se proporcionó stock inicial, delegar a inventory_service.
    if initial_quantity > 0:
        logger.info(f"Se proporcionó stock inicial ({initial_quantity} unidades al costo de {initial_cost}). "
                    f"Delegando la creación del lote al servicio de inventario.")
        await inventory_service.create_initial_lot_for_product(
            database=database,
            product_id=str(inserted_id),
            product_sku=product_data.sku,
            quantity=initial_quantity,
            cost=initial_cost
        )

    # Paso 4: Recuperar y devolver el estado final del producto.
    # Es crucial recuperarlo de nuevo para reflejar las actualizaciones de stock
    # que pudo haber realizado `inventory_service`.
    created_product_doc = await product_repository.find_by_id(str(inserted_id))
    if not created_product_doc:
        # Este es un estado inconsistente y debe ser reportado como un error crítico.
        logger.critical(f"CRÍTICO: No se pudo encontrar el producto con ID '{inserted_id}' inmediatamente después de su creación.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error crítico: No se pudo recuperar el producto después de su creación."
        )

    return ProductOut.model_validate(created_product_doc)

async def get_product_by_id(database: AsyncIOMotorDatabase, product_id: str) -> ProductOut:
    """Obtiene un único producto por su ID de base de datos."""
    product_repository = ProductRepository(database)
    product_doc = await product_repository.find_by_id(product_id)
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

async def update_product_by_sku(database: AsyncIOMotorDatabase, sku: str, update_dto: ProductUpdate) -> ProductOut:
    """Actualiza la información de catálogo de un producto existente por su SKU."""
    product_repository = ProductRepository(database)
    
    # Solo se incluyen los campos que el cliente realmente envió en el payload.
    update_data = update_dto.model_dump(exclude_unset=True)
    if not update_data:
        logger.warning(f"Se recibió una solicitud de actualización para el SKU '{sku}' sin datos para cambiar.")
        return await get_product_by_sku(database, sku)

    update_payload = {
        "$set": {
            **update_data,
            "updated_at": datetime.now(timezone.utc)
        }
    }
    
    modified_count = await product_repository.execute_update_one_by_sku(sku, update_payload)
    if modified_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con SKU '{sku}' no encontrado para actualizar.")

    return await get_product_by_sku(database, sku)

async def get_products_paginated(
    database: AsyncIOMotorDatabase, page: int, page_size: int, search: Optional[str], brand: Optional[str],
    category: Optional[ProductCategory], product_type: Optional[FilterType], shape: Optional[ProductShape]
) -> Dict[str, Any]:
    """Obtiene una lista paginada y filtrada de productos activos del catálogo."""
    product_repository = ProductRepository(database)
    query: Dict[str, Any] = {"is_active": True}
    
    # Construcción dinámica de la consulta de filtrado
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
    product_docs = await product_repository.find_paginated(query, skip_amount, page_size)
    total_count = await product_repository.count_documents(query)
    
    items = [ProductOut.model_validate(doc) for doc in product_docs]
    
    return {"total_count": total_count, "items": items}

async def deactivate_product_by_sku(database: AsyncIOMotorDatabase, sku: str) -> Dict[str, str]:
    """Desactiva un producto (borrado lógico) para que no aparezca en listados generales."""
    product_repository = ProductRepository(database)
    update_data = {"is_active": False, "updated_at": datetime.now(timezone.utc)}
    
    modified_count = await product_repository.update_one_by_sku(sku, update_data)
    
    if modified_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con SKU '{sku}' no encontrado para desactivar.")
        
    return {"message": f"Producto con SKU '{sku}' ha sido desactivado exitosamente."}