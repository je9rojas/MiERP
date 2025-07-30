# /backend/app/modules/inventory/product_routes.py

"""
Define los endpoints de la API para la gestión de Productos del Inventario.

Este router expone las operaciones CRUD (Crear, Leer, Actualizar, Borrar)
para los productos, delega la lógica de negocio a la capa de servicio
y aplica la protección de rutas basada en roles de usuario.
"""

# --- SECCIÓN 1: IMPORTACIONES ---

from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from typing import List, Optional
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase

# Importaciones de la aplicación
from app.core.database import get_db
from app.dependencies.roles import role_checker
from app.modules.users.user_models import UserRole
from . import product_service
from .product_models import ProductCreate, ProductOut, ProductUpdate, CatalogFilterPayload


# --- SECCIÓN 2: DEFINICIÓN DEL ROUTER Y MODELOS DE RESPUESTA ---

router = APIRouter(
    prefix="/products",
    tags=["Inventario - Productos"]
)

class PaginatedProductsResponse(BaseModel):
    """
    Modelo de respuesta para una lista paginada de productos.
    Alineado con la respuesta del servicio y las expectativas del frontend.
    """
    # Se define 'total_count' para mantener la consistencia en toda la aplicación.
    total_count: int
    items: List[ProductOut]


# --- SECCIÓN 3: ENDPOINTS DE LA API ---

@router.post(
    "/",
    response_model=ProductOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un nuevo producto",
    description="Registra un nuevo producto en la base de datos."
)
async def create_new_product(
    product: ProductCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: dict = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER]))
):
    """
    Endpoint para crear un nuevo producto.

    La lógica de negocio, como la verificación de SKUs duplicados, se maneja
    en la capa de servicio. Si el servicio levanta un HTTPException, FastAPI
    lo procesará y devolverá la respuesta de error HTTP adecuada.
    """
    return await product_service.create_product(db, product)


@router.get(
    "/",
    response_model=PaginatedProductsResponse,
    summary="Obtener lista de productos",
    description="Recupera una lista paginada de productos activos, con opción de búsqueda y filtrado."
)
async def get_products_paginated(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: dict = Depends(role_checker(UserRole.all_roles())),
    search: Optional[str] = None,
    brand: Optional[str] = None,
    product_category: Optional[str] = None, # Se añade para que coincida con la llamada del frontend
    product_type: Optional[str] = None,
    shape: Optional[str] = None, # Se añade para que coincida con la llamada del frontend
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(10, ge=1, le=100, alias="pageSize", description="Tamaño de la página")
):
    """
    Endpoint para obtener una lista paginada y filtrada de productos.
    Utiliza `Query` para una mejor validación y documentación de los parámetros.
    """
    print(f"--- [PRODUCTS] Solicitud de lista de productos. Página: {page}, Tamaño: {page_size}, Búsqueda: '{search}' ---")
    
    result = await product_service.get_products_with_filters_and_pagination(
        db=db, search=search, brand=brand, product_type=product_type, page=page, page_size=page_size
    )

    # Se usa .get() como una capa extra de seguridad para los logs.
    total = result.get("total_count", 0)
    items_count = len(result.get("items", []))
    print(f"✅ Devolviendo {items_count} productos de un total de {total}.")

    # El 'return result' funciona porque el servicio ya devuelve un diccionario
    # con las claves 'total_count' y 'items', que coinciden con nuestro response_model.
    return result


@router.get(
    "/{sku}",
    response_model=ProductOut,
    summary="Obtener un producto por SKU"
)
async def get_product_by_sku_route(
    sku: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: dict = Depends(role_checker(UserRole.all_roles()))
):
    """
    Obtiene un producto específico. El servicio maneja el caso de no encontrarlo.
    """
    product = await product_service.get_product_by_sku(db, sku)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con SKU '{sku}' no encontrado."
        )
    return product


@router.put(
    "/{sku}",
    response_model=ProductOut,
    summary="Actualizar un producto"
)
async def update_product_route(
    sku: str,
    product_data: ProductUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: dict = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER]))
):
    """
    Actualiza un producto. El servicio maneja el caso de no encontrarlo.
    """
    updated_product = await product_service.update_product_by_sku(db, sku, product_data)
    if not updated_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con SKU '{sku}' no encontrado para actualizar."
        )
    return updated_product


@router.delete(
    "/{sku}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Desactivar un producto (soft delete)"
)
async def deactivate_product_route(
    sku: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: dict = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN]))
):
    """
    Desactiva un producto. El servicio maneja el caso de no encontrarlo.
    """
    success = await product_service.deactivate_product_by_sku(db, sku)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con SKU '{sku}' no encontrado para desactivar."
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/catalog",
    summary="Generar Catálogo de Productos en PDF",
    response_class=Response
)
async def generate_product_catalog(
    filters: CatalogFilterPayload,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: dict = Depends(role_checker(UserRole.all_roles()))
):
    """
    Genera un catálogo en PDF basado en filtros.
    """
    pdf_bytes = await product_service.generate_catalog_pdf(db, filters)
    if not pdf_bytes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontraron productos para los filtros seleccionados."
        )
    return Response(content=pdf_bytes, media_type="application/pdf")