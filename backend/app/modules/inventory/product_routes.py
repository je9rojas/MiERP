# /backend/app/modules/inventory/product_routes.py

"""
Define los endpoints de la API para la gestión de Productos del Inventario.

Este router expone las operaciones CRUD (Crear, Leer, Actualizar, Borrar)
para los productos, delega la lógica de negocio a la capa de servicio
y aplica la protección de rutas basada en roles de usuario.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from typing import List, Optional
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.dependencies.roles import role_checker
from app.modules.users.user_models import UserRole
from . import product_service
from .product_models import (
    ProductCreate,
    ProductOut,
    ProductUpdate,
    CatalogFilterPayload,
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
    """
    Modelo de respuesta para una lista paginada de productos.
    Alineado con la respuesta del servicio y las expectativas del frontend.
    """
    total_count: int
    items: List[ProductOut]

# ==============================================================================
# SECCIÓN 3: ENDPOINTS DE LA API
# ==============================================================================

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
    """Endpoint para crear un nuevo producto."""
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
    search: Optional[str] = Query(None, description="Término de búsqueda por SKU o nombre."),
    brand: Optional[str] = Query(None, description="Filtrar por marca."),
    product_category: Optional[ProductCategory] = Query(None, description="Filtrar por categoría de producto."),
    product_type: Optional[FilterType] = Query(None, description="Filtrar por tipo de filtro."),
    shape: Optional[ProductShape] = Query(None, description="Filtrar por forma de filtro."),
    page: int = Query(1, ge=1, description="Número de página."),
    page_size: int = Query(25, ge=1, le=100, alias="pageSize", description="Tamaño de la página.")
):
    """
    Endpoint para obtener una lista paginada y filtrada de productos.
    Utiliza Enums para una validación de parámetros de filtro más estricta.
    """
    # --- INICIO DE LA CORRECCIÓN ---
    # Se pasan TODOS los parámetros de filtro recibidos a la capa de servicio.
    result = await product_service.get_products_with_filters_and_pagination(
        db=db,
        search=search,
        brand=brand,
        category=product_category,
        product_type=product_type,
        shape=shape,
        page=page,
        page_size=page_size
    )
    # --- FIN DE LA CORRECCIÓN ---
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
    """Obtiene los detalles completos de un producto específico por su SKU."""
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
    """Actualiza la información de un producto existente por su SKU."""
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
    """Realiza un borrado lógico de un producto, marcándolo como inactivo."""
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
    response_class=Response,
    # Opcional: define las respuestas de error para la documentación.
    responses={
        200: {"description": "Catálogo PDF generado exitosamente."},
        404: {"description": "No se encontraron productos para los filtros seleccionados."}
    }
)
async def generate_product_catalog(
    filters: CatalogFilterPayload,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: dict = Depends(role_checker(UserRole.all_roles()))
):
    """Genera un catálogo de productos en formato PDF basado en los filtros proporcionados."""
    pdf_bytes = await product_service.generate_catalog_pdf(db, filters)
    if not pdf_bytes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontraron productos para los filtros seleccionados."
        )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=catalogo_productos.pdf"}
    )