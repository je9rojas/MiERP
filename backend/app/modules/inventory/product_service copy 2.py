# /backend/app/modules/inventory/product_service.py

"""
Capa de Servicio para el módulo de Inventario.

Contiene la lógica de negocio para las operaciones con productos, actuando como
intermediario entre las rutas de la API y el repositorio de la base de datos.
"""

# --- SECCIÓN DE IMPORTACIONES ---
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from io import BytesIO
from fastapi import HTTPException, status

# Importaciones de la propia aplicación
from .product_models import ProductCreate, ProductInDB, ProductUpdate, CatalogFilterPayload
from .repositories.product_repository import ProductRepository
from .catalog_generator import CatalogPDFGenerator


# --- Funciones del Servicio de Productos ---

async def create_product(db: AsyncIOMotorDatabase, product_data: ProductCreate) -> ProductInDB:
    """
    Crea un nuevo producto, asegurando que el SKU no esté duplicado.
    """
    repo = ProductRepository(db)
    
    existing_product = await repo.find_by_sku(product_data.sku)
    if existing_product:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El SKU '{product_data.sku}' ya está registrado."
        )
    
    product_doc = product_data.model_dump()
    
    now = datetime.now(timezone.utc)
    product_doc["created_at"] = now
    product_doc["updated_at"] = now
    product_doc["is_active"] = True
    
    # Asegura la existencia de campos de lista para consistencia en la BD.
    product_doc.setdefault("specifications", {})
    product_doc.setdefault("oem_codes", [])
    product_doc.setdefault("cross_references", [])
    product_doc.setdefault("applications", [])
    product_doc.setdefault("image_urls", [])

    inserted_id = await repo.insert_one(product_doc)
    created_product_doc = await repo.find_by_id(str(inserted_id))
    
    if not created_product_doc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al recuperar el producto después de la creación."
        )

    return ProductInDB(**created_product_doc)


async def get_products_with_filters_and_pagination(
    db: AsyncIOMotorDatabase,
    search: Optional[str], brand: Optional[str], product_type: Optional[str], page: int, page_size: int,
) -> Dict[str, Any]:
    """
    Obtiene una lista paginada y filtrada de productos activos.
    """
    repo = ProductRepository(db)
    
    query: Dict[str, Any] = {"is_active": True}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"sku": {"$regex": search, "$options": "i"}}
        ]
    if brand:
        query["brand"] = brand
    if product_type:
        query["product_type"] = product_type
        
    total_count = await repo.count_documents(query)
    skip = (page - 1) * page_size
    
    product_docs_cursor = repo.collection.find(query).sort("sku", 1).skip(skip).limit(page_size)
    product_docs = await product_docs_cursor.to_list(length=page_size)
    
    items = [ProductInDB(**doc) for doc in product_docs]

    # --- ¡LA CORRECCIÓN ESTÁ AQUÍ! ---
    # Se cambia la clave de 'total' a 'total_count' para que coincida con lo que
    # el frontend (ProductListPage.js) y el modelo de respuesta (PaginatedProductsResponse) esperan.
    return {"total_count": total_count, "items": items}


async def get_product_by_sku(db: AsyncIOMotorDatabase, sku: str) -> Optional[ProductInDB]:
    """
    Obtiene un único producto por su SKU.
    """
    repo = ProductRepository(db)
    product_doc = await repo.find_by_sku(sku)
    if product_doc:
        return ProductInDB(**product_doc)
    return None


async def update_product_by_sku(db: AsyncIOMotorDatabase, sku: str, product_update_data: ProductUpdate) -> Optional[ProductInDB]:
    """
    Actualiza un producto existente.
    """
    repo = ProductRepository(db)
    update_data = product_update_data.model_dump(exclude_unset=True)
    
    # Si no hay datos para actualizar, no hacemos nada y devolvemos el producto actual.
    if not update_data:
        return await get_product_by_sku(db, sku)

    update_data["updated_at"] = datetime.now(timezone.utc)
    matched_count = await repo.update_one(sku, update_data)

    if matched_count > 0:
        return await get_product_by_sku(db, sku)
    return None # Ocurre si el SKU no se encontró para actualizar.


async def deactivate_product_by_sku(db: AsyncIOMotorDatabase, sku: str) -> bool:
    """
    Desactiva un producto (soft delete).
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
        query["$or"] = [
            {"name": {"$regex": filters.search_term, "$options": "i"}},
            {"sku": {"$regex": filters.search_term, "$options": "i"}}
        ]
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