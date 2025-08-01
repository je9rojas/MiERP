# /backend/app/modules/inventory/product_service.py

"""
Capa de Servicio para el módulo de Inventario.

Contiene la lógica de negocio para las operaciones con productos, actuando como
intermediario entre las rutas de la API y el repositorio de la base de datos.
Su responsabilidad es aplicar validaciones, orquestar operaciones y transformar
los datos del formato de la base de datos al formato de salida de la API (DTO).
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from io import BytesIO
from fastapi import HTTPException, status
import pprint # Módulo para imprimir diccionarios de forma legible

from .product_models import (
    ProductCreate,
    ProductInDB,
    ProductUpdate,
    ProductOut,
    ProductOutDetail,
    CatalogFilterPayload,
    ProductCategory,
    FilterType,
    ProductShape
)
from .repositories.product_repository import ProductRepository
from .catalog_generator import CatalogPDFGenerator

# ==============================================================================
# SECCIÓN 2: FUNCIONES DEL SERVICIO DE PRODUCTOS
# ==============================================================================

async def create_product(db: AsyncIOMotorDatabase, product_data: ProductCreate) -> ProductOutDetail:
    """
    Crea un nuevo producto, asegurando que el SKU no esté duplicado.
    Devuelve el producto completo y detallado.
    """
    repo = ProductRepository(db)
    
    if await repo.find_by_sku(product_data.sku):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El SKU '{product_data.sku}' ya está registrado."
        )
    
    product_to_db = ProductInDB(**product_data.model_dump())
    product_doc = product_to_db.model_dump(by_alias=True)
    
    inserted_id = await repo.insert_one(product_doc)
    created_product_doc = await repo.find_by_id(str(inserted_id))
    
    if not created_product_doc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al recuperar el producto después de la creación."
        )

    return ProductOutDetail.model_validate(created_product_doc)


async def get_products_with_filters_and_pagination(
    db: AsyncIOMotorDatabase,
    page: int,
    page_size: int,
    search: Optional[str],
    brand: Optional[str],
    category: Optional[ProductCategory],
    product_type: Optional[FilterType],
    shape: Optional[ProductShape],
) -> Dict[str, Any]:
    """
    Obtiene una lista paginada y filtrada de productos activos.
    """
    repo = ProductRepository(db)
    
    query: Dict[str, Any] = {"is_active": True}
    
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        query["$or"] = [{"sku": search_regex}, {"name": search_regex}]
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

    # --- DETECTIVE #1: INSPECCIONAR DATOS CRUDOS DE MONGODB ---
    if product_docs:
        print("\n✅ --- [DETECTIVE #1] DATOS CRUDOS DEL PRIMER PRODUCTO (DESDE MONGO) --- ✅")
        pprint.pprint(product_docs[0])
        print("----------------------------------------------------------------------\n")
    
    # Esta es la línea donde ocurre la transformación
    items = [ProductOut.model_validate(doc) for doc in product_docs]

    # --- DETECTIVE #2: INSPECCIONAR DATOS TRANSFORMADOS POR PYDANTIC ---
    if items:
        print("\n✅ --- [DETECTIVE #2] DATOS TRANSFORMADOS DEL PRIMER PRODUCTO (PARA ENVIAR) --- ✅")
        # .model_dump() convierte el objeto Pydantic de nuevo a un diccionario para imprimirlo
        pprint.pprint(items[0].model_dump())
        print("--------------------------------------------------------------------------\n")

    return {"total_count": total_count, "items": items}


async def get_product_by_sku(db: AsyncIOMotorDatabase, sku: str) -> Optional[ProductOutDetail]:
    """
    Obtiene un único producto por su SKU y lo devuelve en formato de salida detallado.
    """
    repo = ProductRepository(db)
    product_doc = await repo.find_by_sku(sku)
    if product_doc:
        return ProductOutDetail.model_validate(product_doc)
    return None


async def update_product_by_sku(
    db: AsyncIOMotorDatabase, sku: str, product_update_data: ProductUpdate
) -> Optional[ProductOutDetail]:
    """
    Actualiza un producto existente y devuelve la versión completa y actualizada.
    """
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
    """
    Desactiva un producto (soft delete). Devuelve True si fue exitoso.
    """
    repo = ProductRepository(db)
    update_data = {"is_active": False, "updated_at": datetime.now(timezone.utc)}
    modified_count = await repo.deactivate_one(sku, update_data)
    return modified_count > 0


async def generate_catalog_pdf(db: AsyncIOMotorDatabase, filters: CatalogFilterPayload) -> Optional[bytes]:
    """
    Genera un catálogo de productos en PDF basado en los filtros proporcionados.
    """
    repo = ProductRepository(db)
    
    query: Dict[str, Any] = {"is_active": True}
    if filters.search_term:
        search_regex = {"$regex": filters.search_term, "$options": "i"}
        query["$or"] = [{"name": search_regex}, {"sku": search_regex}]
    if filters.product_types:
        query["product_type"] = {"$in": [pt.value for pt in filters.product_types]}

    product_docs = await repo.find_all(query)
    if not product_docs:
        return None

    product_docs.sort(key=lambda p: p.get('sku', ''))

    buffer = BytesIO()
    generator = CatalogPDFGenerator(product_docs, buffer, filters.view_type)
    generator.build()
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes