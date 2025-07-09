# /backend/app/services/product_service.py
# CÓDIGO CORREGIDO PARA AÑADIR VALORES POR DEFECTO

from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from bson import ObjectId

from app.models.product import ProductCreate, ProductDB

async def create_product(db: AsyncIOMotorDatabase, product_data: ProductCreate) -> ProductDB:
    """
    Crea un nuevo producto en la base de datos.
    Asegura que los valores por defecto del servidor se apliquen.
    """
    # Verificar si el SKU ya existe
    existing_product = await db.products.find_one({"sku": product_data.sku})
    if existing_product:
        raise ValueError(f"El SKU '{product_data.sku}' ya está registrado.")

    # Convierte el modelo Pydantic del formulario a un diccionario
    product_doc = product_data.model_dump()
    
    # --- ¡LA SOLUCIÓN! ---
    # Añadimos explícitamente los valores por defecto del servidor antes de insertar.
    product_doc['is_active'] = True 
    
    # Inserta el nuevo producto con todos los campos necesarios
    result = await db.products.insert_one(product_doc)
    
    # Obtiene y devuelve el producto recién creado
    created_product_doc = await db.products.find_one({"_id": result.inserted_id})
    return ProductDB(**created_product_doc)

async def get_product_by_sku(db: AsyncIOMotorDatabase, sku: str) -> Optional[ProductDB]:
    """Busca un producto por su SKU."""
    product_doc = await db.products.find_one({"sku": sku})
    if product_doc:
        return ProductDB(**product_doc)
    return None

async def get_all_products(db: AsyncIOMotorDatabase) -> List[ProductDB]:
    """Obtiene todos los productos activos de la base de datos."""
    products = []
    # Esta consulta ahora funcionará porque los nuevos productos tendrán 'is_active: True'
    cursor = db.products.find({"is_active": True})
    async for product_doc in cursor:
        products.append(ProductDB(**product_doc))
    return products