# /backend/app/routes/products.py
# ARCHIVO FINAL, COMPLETO Y OPTIMIZADO CON PAGINACIÓN Y FILTRADO

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from app.core.database import get_db
from . import product_service
from .product_models import ProductCreate, ProductOut, ProductUpdate

from app.dependencies.roles import role_checker
from app.modules.users.user_models import UserRole

router = APIRouter(prefix="/products", tags=["Products"])

# --- Modelos de Respuesta Específicos para este Router ---

class PaginatedProductResponse(BaseModel):
    """
    Define la estructura de la respuesta para las peticiones paginadas.
    Incluye el conteo total de items y la lista de items de la página actual.
    """
    total: int
    items: List[ProductOut]

# --- Definiciones de Listas de Roles para Claridad ---

ROLES_ALLOWED_TO_CREATE = [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE]
ROLES_ALLOWED_TO_UPDATE = [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE]
ROLES_ALLOWED_TO_DELETE = [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER]

# --- Endpoints del CRUD de Productos ---

@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_new_product(
    product: ProductCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: dict = Depends(role_checker(ROLES_ALLOWED_TO_CREATE))
):
    """
    Crea un nuevo producto en el inventario.
    """
    print(f"--- [PRODUCTS] Petición para crear nuevo producto (SKU: {product.sku}) ---")
    try:
        created_product = await product_service.create_product(db, product)
        print(f"✅ Producto '{created_product.sku}' creado exitosamente.")
        return created_product
    except ValueError as ve:
        print(f"❌ Error de validación al crear: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        print(f"❌ ERROR INESPERADO al crear producto: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno al crear el producto.")

@router.get("/", response_model=PaginatedProductResponse)
async def get_products_paginated(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: dict = Depends(role_checker(UserRole.all_roles())),
    search: Optional[str] = None,
    brand: Optional[str] = None,
    product_type: Optional[str] = None,
    page: int = 1,
    pageSize: int = 10
):
    """
    Obtiene una lista paginada de productos con opciones de búsqueda y filtrado.
    """
    print(f"--- [PRODUCTS] Solicitud de lista de productos. Página: {page}, Tamaño: {pageSize}, Búsqueda: '{search}' ---")
    result = await product_service.get_products_with_filters_and_pagination(
        db=db, search=search, brand=brand, product_type=product_type, page=page, page_size=pageSize
    )
    print(f"✅ Devolviendo {len(result['items'])} productos de un total de {result['total']}.")
    return result

@router.get("/{sku}", response_model=ProductOut)
async def get_product_by_sku_route(
    sku: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: dict = Depends(role_checker(UserRole.all_roles()))
):
    """
    Obtiene los detalles de un producto específico por su SKU.
    """
    print(f"--- [PRODUCTS] Solicitud para obtener producto con SKU: {sku} ---")
    product = await product_service.get_product_by_sku(db, sku)
    if not product:
        print(f"❌ Producto con SKU '{sku}' no encontrado.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con SKU '{sku}' no encontrado.")
    print(f"✅ Producto '{sku}' encontrado y devuelto.")
    return product

@router.put("/{sku}", response_model=ProductOut)
async def update_product_route(
    sku: str,
    product_data: ProductUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: dict = Depends(role_checker(ROLES_ALLOWED_TO_UPDATE))
):
    """
    Actualiza la información de un producto existente.
    """
    print(f"--- [PRODUCTS] Petición para actualizar producto con SKU: {sku} ---")
    updated_product = await product_service.update_product_by_sku(db, sku, product_data)
    if not updated_product:
        print(f"❌ Intento de actualizar un producto no existente con SKU '{sku}'.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con SKU '{sku}' no encontrado.")
    print(f"✅ Producto '{sku}' actualizado exitosamente.")
    return updated_product

@router.delete("/{sku}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_product_route(
    sku: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: dict = Depends(role_checker(ROLES_ALLOWED_TO_DELETE))
):
    """
    Desactiva un producto en el sistema (soft delete).
    """
    print(f"--- [PRODUCTS] Petición para DESACTIVAR producto con SKU: {sku} ---")
    success = await product_service.deactivate_product_by_sku(db, sku)
    if not success:
        print(f"❌ Intento de desactivar un producto no existente o ya inactivo con SKU '{sku}'.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con SKU '{sku}' no encontrado.")
    print(f"✅ Producto '{sku}' desactivado exitosamente.")
    return None

# La ruta del catálogo se puede añadir aquí en el futuro si se necesita,
# pero se mantiene fuera por ahora para enfocarnos en el CRUD principal.