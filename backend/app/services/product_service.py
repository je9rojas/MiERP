# /backend/app/services/product_service.py
# SERVICIO FINAL Y REFACTORIZADO CON ARQUITECTURA LIMPIA

from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from datetime import datetime, timezone
from app.models.product import ProductCreate, ProductInDB, ProductUpdate

# --- Funciones del Servicio de Productos (Lógica de Negocio) ---

async def create_product(db: AsyncIOMotorDatabase, product_data: ProductCreate) -> ProductInDB:
    """
    Crea un nuevo producto en la base de datos.

    Esta función implementa la lógica de negocio para la creación:
    1. Valida que no exista un producto con el mismo SKU.
    2. Utiliza el modelo `ProductInDB` para construir el documento final,
       asegurando que todos los valores por defecto (como `is_active`, `created_at`)
       se apliquen automáticamente.
    3. Inserta el documento en la colección 'products'.
    4. Devuelve el producto recién creado.
    
    Args:
        db: La instancia de la base de datos inyectada.
        product_data: Los datos del producto validados, provenientes del frontend.

    Returns:
        Una instancia del modelo `ProductInDB` del producto creado.

    Raises:
        ValueError: Si el SKU ya existe en la base de datos.
    """
    # 1. Lógica de negocio: Verificar si el SKU ya existe.
    existing_product = await db.products.find_one({"sku": product_data.sku})
    if existing_product:
        raise ValueError(f"El SKU '{product_data.sku}' ya está registrado.")

    # 2. Construir el documento para la DB usando el modelo ProductInDB como plantilla.
    #    Pydantic tomará los datos de `product_data` y rellenará el resto con los valores
    #    por defecto definidos en el modelo (is_active, created_at, updated_at, etc.).
    #    Esta es la "fuente de la verdad".
    product_to_db = ProductInDB(**product_data.model_dump(exclude_unset=True))

    # 3. Convertir el modelo Pydantic a un diccionario para la inserción.
    #    `by_alias=True` asegura que el campo `id` se guarde como `_id`.
    product_doc = product_to_db.model_dump(by_alias=True)
    
    # 4. Insertar el documento completo y bien formado en la base de datos.
    result = await db.products.insert_one(product_doc)
    
    # 5. Obtener y devolver el producto recién creado para confirmar.
    created_product_doc = await db.products.find_one({"_id": result.inserted_id})
    return ProductInDB(**created_product_doc)


async def get_all_products(db: AsyncIOMotorDatabase) -> List[ProductInDB]:
    """
    Obtiene una lista de todos los productos que están marcados como activos.
    """
    products_list = []
    # La consulta busca explícitamente los productos activos.
    # Esto funcionará correctamente porque el modelo ProductInDB asegura que el campo 'is_active' siempre exista.
    products_cursor = db.products.find({"is_active": True})
    
    async for product_doc in products_cursor:
        products_list.append(ProductInDB(**product_doc))
        
    return products_list


async def get_product_by_sku(db: AsyncIOMotorDatabase, sku: str) -> Optional[ProductInDB]:
    """
    Busca y devuelve un único producto por su SKU.
    """
    product_doc = await db.products.find_one({"sku": sku})
    if product_doc:
        return ProductInDB(**product_doc)
    return None


async def update_product_by_sku(db: AsyncIOMotorDatabase, sku: str, product_update_data: ProductUpdate) -> Optional[ProductInDB]:
    """
    Actualiza un producto existente por su SKU.
    También actualiza automáticamente el campo `updated_at`.
    """
    # Exclude_unset=True asegura que solo se actualicen los campos que se enviaron en la petición.
    update_data = product_update_data.model_dump(exclude_unset=True)
    
    if not update_data:
        # Si no se envió ningún dato para actualizar, no hacemos nada.
        return await get_product_by_sku(db, sku)

    # Añadimos la actualización del campo `updated_at` a la operación.
    update_data["updated_at"] = datetime.now(timezone.utc)

    result = await db.products.update_one(
        {"sku": sku},
        {"$set": update_data}
    )

    if result.matched_count > 0:
        return await get_product_by_sku(db, sku)
    
    return None