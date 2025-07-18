# /backend/app/modules/inventory/product_service.py

# --- SECCIÓN DE IMPORTACIONES (CORREGIDA Y COMPLETA) ---
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from io import BytesIO

# Importaciones de la propia aplicación
from .product_models import ProductCreate, ProductInDB, ProductUpdate, CatalogFilterPayload
from .repositories.product_repository import ProductRepository
from .catalog_generator import CatalogPDFGenerator

# --- Funciones del Servicio de Productos ---

async def create_product(db: AsyncIOMotorDatabase, product_data: ProductCreate) -> ProductInDB:
    repo = ProductRepository(db)
    
    # 1. La lógica de negocio no cambia
    if await repo.find_by_sku(product_data.sku):
        raise ValueError(f"El SKU '{product_data.sku}' ya está registrado.")
    
    # 2. Construye el diccionario para la base de datos de forma explícita
    #    Usa .model_dump() sin `exclude_unset` para incluir los valores por defecto.
    product_doc = product_data.model_dump()
    
    # 3. Añade los campos que genera el servidor y que no vienen del cliente.
    #    Esto hace tu lógica más clara y segura.
    now = datetime.now(timezone.utc)
    product_doc["created_at"] = now
    product_doc["updated_at"] = now
    product_doc["is_active"] = True
    
    #    Asegura que los campos de lista existan, incluso si están vacíos
    product_doc.setdefault("specifications", {})
    product_doc.setdefault("oem_codes", [])
    product_doc.setdefault("cross_references", [])
    product_doc.setdefault("applications", [])
    product_doc.setdefault("image_urls", [])

    # 4. El servicio le dice al repositorio que inserte el diccionario preparado
    inserted_id = await repo.insert_one(product_doc)
    
    # 5. Recupera el documento recién creado para devolverlo completo
    created_product_doc = await repo.find_by_id(str(inserted_id))
    if not created_product_doc:
        # Este caso es improbable pero es una buena práctica manejarlo
        raise Exception("Error al recuperar el producto después de la creación.")

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


# --- Función Principal del Servicio (Ahora usa el generador) ---
async def generate_catalog_pdf(db: AsyncIOMotorDatabase, filters: CatalogFilterPayload) -> Optional[bytes]:
    repo = ProductRepository(db)
    
    query = {"is_active": True}
    if filters.search_term:
        query["$or"] = [
            {"name": {"$regex": filters.search_term, "$options": "i"}},
            {"sku": {"$regex": filters.search_term, "$options": "i"}}
        ]
    if filters.product_types:
        query["product_type"] = {"$in": filters.product_types}

    product_docs = await repo.find_all(query)

    if not product_docs:
        return None

    buffer = BytesIO()
    generator = CatalogPDFGenerator(product_docs, buffer, filters.view_type)
    generator.build()
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes
