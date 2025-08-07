# /backend/app/modules/inventory/product_routes.py

"""
Define los endpoints de la API para la gestión del Catálogo de Productos.

Este router expone las operaciones CRUD (Crear, Leer, Actualizar, Borrar)
para los productos maestros, delega la lógica de negocio a la capa de servicio
y aplica la protección de rutas basada en roles de usuario.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from typing import List, Optional
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.dependencies.roles import role_checker
from app.modules.users.user_models import UserRole, UserOut
from . import product_service
from .product_models import (
    ProductCreate,
    ProductOut,
    ProductOutDetail,
    ProductUpdate,
    ProductCategory,
    FilterType,
    ProductShape
)

# ==============================================================================
# SECCIÓN 2: DEFINICIÓN DEL ROUTER Y MODELOS DE RESPUESTA
# ==============================================================================

router = APIRouter(
    prefix="/products",
    tags=["Inventario - Productos"]
)

class PaginatedProductsResponse(BaseModel):
    """Modelo de respuesta para una lista paginada de productos."""
    total_count: int
    items: List[ProductOut]

# ==============================================================================
# SECCIÓN 3: ENDPOINTS DE LA API
# ==============================================================================

@router.post(
    "",
    response_model=ProductOutDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un nuevo producto",
    description="Registra un nuevo producto maestro en la base de datos."
)
async def create_new_product(
    product_data: ProductCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER]))
):
    """Endpoint para crear un nuevo producto."""
    return await product_service.create_product(db, product_data)


@router.get(
    "",
    response_model=PaginatedProductsResponse,
    summary="Obtener lista paginada de productos",
    description="Recupera una lista paginada de productos activos, con opciones de búsqueda y filtrado."
)
async def get_products_paginated(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(role_checker(UserRole.all_roles())),
    search: Optional[str] = Query(None, description="Término de búsqueda por SKU, nombre o descripción."),
    brand: Optional[str] = Query(None, description="Filtrar por marca exacta."),
    product_category: Optional[ProductCategory] = Query(None, description="Filtrar por categoría."),
    product_type: Optional[FilterType] = Query(None, description="Filtrar por tipo de filtro."),
    shape: Optional[ProductShape] = Query(None, description="Filtrar por forma."),
    page: int = Query(1, ge=1, description="Número de página a recuperar."),
    page_size: int = Query(25, ge=1, le=1000, description="Número de productos por página.")
):
    """Endpoint para obtener una lista paginada y filtrada de productos."""
    result = await product_service.get_products_paginated(
        db=db, search=search, brand=brand, category=product_category,
        product_type=product_type, shape=shape, page=page, page_size=page_size
    )
    return result


@router.get(
    "/{sku:path}",
    response_model=ProductOutDetail,
    summary="Obtener un producto por SKU",
    description="Obtiene los detalles completos de un producto por su SKU.",
    responses={404: {"description": "Producto no encontrado"}}
)
async def get_product_by_sku_route(
    sku: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(role_checker(UserRole.all_roles()))
):
    """Obtiene los detalles completos de un producto específico por su SKU."""
    product = await product_service.get_product_by_sku(db, sku)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con SKU '{sku}' no encontrado."
        )
    return product


@router.patch(
    "/{sku:path}",
    response_model=ProductOutDetail,
    summary="Actualizar un producto (parcial)",
    description="Actualiza la información de catálogo de un producto. No afecta al stock.",
    responses={404: {"description": "Producto no encontrado para actualizar"}}
)
async def update_product_route(
    sku: str,
    product_data: ProductUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER]))
):
    """Actualiza la información de un producto y devuelve el objeto completo y actualizado."""
    updated_product = await product_service.update_product_by_sku(db, sku, product_data)
    if not updated_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con SKU '{sku}' no encontrado para actualizar."
        )
    return updated_product


@router.delete(
    "/{sku:path}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Desactivar un producto (borrado lógico)",
    description="Realiza un borrado lógico de un producto marcándolo como inactivo.",
    responses={404: {"description": "Producto no encontrado para desactivar"}}
)
async def deactivate_product_route(
    sku: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN]))
):
    """Desactiva un producto (soft delete)."""
    success = await product_service.deactivate_product_by_sku(db, sku)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con SKU '{sku}' no encontrado para desactivar."
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)