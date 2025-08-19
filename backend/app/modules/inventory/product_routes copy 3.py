# /backend/app/modules/inventory/product_routes.py

"""
Define los endpoints de la API para la gestión del Catálogo de Productos.

Este router expone las operaciones CRUD (Crear, Leer, Actualizar, Borrar)
para los productos maestros. Delega la lógica de negocio a los servicios
apropiados y actúa como orquestador para flujos que involucran múltiples servicios.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from fastapi import APIRouter, Depends, Query, status, Response
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.dependencies.roles import role_checker
from app.modules.users.user_models import UserRole, UserOut
from app.modules.auth.dependencies import get_current_active_user  # <-- CORRECCIÓN: Importación añadida
from app.modules.inventory import product_service, inventory_service

from .product_models import (
    ProductCreate,
    ProductOut,
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
    response_model=ProductOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un nuevo producto y su lote inicial",
    dependencies=[Depends(role_checker([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def create_new_product(
    product_data: ProductCreate,
    database: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
):
    """
    Orquesta la creación de un producto maestro y, si aplica, su lote de inventario inicial.
    """
    initial_stock = product_data.stock_quantity
    initial_cost = product_data.average_cost

    created_product = await product_service.create_product(database, product_data)

    if initial_stock > 0:
        await inventory_service.create_initial_lot_for_product(
            database=database,
            product_id=str(created_product.id),
            product_sku=created_product.sku,
            quantity=initial_stock,
            cost=initial_cost
        )
        return await product_service.get_product_by_id(database, str(created_product.id))
    
    return created_product

@router.get(
    "",
    response_model=PaginatedProductsResponse,
    summary="Obtener lista paginada de productos"
)
async def get_products_paginated_route(
    search: Optional[str] = Query(None, description="Buscar por SKU, nombre o marca."),
    brand: Optional[str] = Query(None, description="Filtrar por marca."),
    category: Optional[ProductCategory] = Query(None, alias="productCategory"),
    product_type: Optional[FilterType] = Query(None, alias="productType"),
    shape: Optional[ProductShape] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=1000),
    database: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
):
    return await product_service.get_products_paginated(
        database, page, page_size, search, brand, category, product_type, shape
    )

@router.get(
    "/{sku:path}",
    response_model=ProductOut,
    summary="Obtener un producto por SKU"
)
async def get_product_by_sku_route(
    sku: str,
    database: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
):
    return await product_service.get_product_by_sku(database, sku)

@router.patch(
    "/{sku:path}",
    response_model=ProductOut,
    summary="Actualizar un producto (parcial)",
    dependencies=[Depends(role_checker([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def update_product_route(
    sku: str,
    product_data: ProductUpdate,
    database: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
):
    return await product_service.update_product_by_sku(database, sku, product_data)

@router.delete(
    "/{sku:path}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Desactivar un producto (borrado lógico)",
    dependencies=[Depends(role_checker([UserRole.ADMIN]))]
)
async def deactivate_product_route(
    sku: str,
    database: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
):
    success = await product_service.deactivate_product_by_sku(database, sku)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con SKU '{sku}' no encontrado.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)