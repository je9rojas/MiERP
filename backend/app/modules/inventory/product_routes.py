# /backend/app/modules/inventory/product_routes.py

"""
Define los endpoints de la API REST para la gestión del Catálogo de Productos.

Este router es la interfaz pública para las operaciones CRUD sobre los productos.
Su responsabilidad es validar los datos de entrada a través de modelos Pydantic,
invocar a la capa de servicio apropiada para ejecutar la lógica de negocio, y
formatear las respuestas para el cliente. Mantiene una lógica mínima, delegando
todas las operaciones complejas al `product_service`.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

# --- Importaciones de la Librería Estándar y Terceros ---
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

# --- Importaciones de la Aplicación ---
from app.core.database import get_db
from app.dependencies.roles import role_checker
from app.modules.auth.dependencies import get_current_active_user
from app.modules.inventory import product_service
from app.modules.users.user_models import UserOut, UserRole

from .product_models import (
    FilterType, ProductCategory, ProductCreate, ProductOut, ProductShape,
    ProductUpdate
)

# ==============================================================================
# SECCIÓN 2: DEFINICIÓN DEL ROUTER Y MODELOS DE PAYLOAD/RESPUESTA
# ==============================================================================

router = APIRouter(
    prefix="/products",
    tags=["Inventario - Productos"]
)

class ProductCreatePayload(ProductCreate):
    """
    Define el cuerpo de la solicitud para crear un producto.
    Hereda todos los campos de catálogo de `ProductCreate` y añade campos opcionales
    para registrar el inventario inicial en la misma operación.
    """
    initial_quantity: int = Field(
        default=0,
        ge=0,
        description="Cantidad de stock inicial para el producto."
    )
    initial_cost: float = Field(
        default=0.0,
        ge=0,
        description="Costo de adquisición para el lote inicial."
    )

class PaginatedProductsResponse(BaseModel):
    """Modelo de respuesta para una lista paginada de productos."""
    total_count: int
    items: List[ProductOut]

# ==============================================================================
# SECCIÓN 3: ENDPOINTS DE LA API PARA PRODUCTOS
# ==============================================================================

@router.post(
    "",
    response_model=ProductOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un nuevo producto y su lote inicial opcional",
    dependencies=[Depends(role_checker([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def create_new_product(
    payload: ProductCreatePayload,
    database: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
) -> ProductOut:
    """
    Endpoint para crear un nuevo producto.

    Recibe un payload con datos de catálogo y, opcionalmente, de inventario inicial.
    Delega toda la lógica de creación y orquestación al `product_service`.
    """
    # Se extraen los datos de catálogo para pasarlos al servicio.
    # Esto respeta el contrato definido por la capa de servicio.
    catalog_data = ProductCreate.model_validate(payload)

    return await product_service.create_product(
        database=database,
        product_data=catalog_data,
        initial_quantity=payload.initial_quantity,
        initial_cost=payload.initial_cost
    )

@router.get(
    "",
    response_model=PaginatedProductsResponse,
    summary="Obtener lista paginada y filtrada de productos"
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
) -> Dict[str, Any]:
    """Obtiene una lista de productos con filtros y paginación."""
    return await product_service.get_products_paginated(
        database, page, page_size, search, brand, category, product_type, shape
    )

@router.get(
    "/{sku:path}",
    response_model=ProductOut,
    summary="Obtener un producto por su SKU"
)
async def get_product_by_sku_route(
    sku: str,
    database: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
) -> ProductOut:
    """Obtiene los detalles completos de un único producto identificado por su SKU."""
    return await product_service.get_product_by_sku(database, sku)

@router.patch(
    "/{sku:path}",
    response_model=ProductOut,
    summary="Actualizar la información de catálogo de un producto",
    dependencies=[Depends(role_checker([UserRole.ADMIN, UserRole.MANAGER]))]
)
async def update_product_route(
    sku: str,
    product_data: ProductUpdate,
    database: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(get_current_active_user)
) -> ProductOut:
    """Actualiza parcialmente los datos de catálogo de un producto."""
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
) -> Response:
    """Desactiva un producto, impidiendo que aparezca en listados y operaciones futuras."""
    await product_service.deactivate_product_by_sku(database, sku)
    return Response(status_code=status.HTTP_204_NO_CONTENT)