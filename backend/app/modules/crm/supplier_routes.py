# /backend/app/modules/crm/supplier_routes.py

"""
Define los endpoints de la API para la gestión de Proveedores (Suppliers).

Este router expone las operaciones CRUD (Crear, Leer, Actualizar, Borrar)
para los proveedores, delegando la lógica de negocio a la capa de servicio
y aplicando la protección de rutas basada en roles de usuario.
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
from . import crm_service
from .supplier_models import SupplierCreate, SupplierOut, SupplierUpdate

# ==============================================================================
# SECCIÓN 2: DEFINICIÓN DEL ROUTER Y MODELOS DE RESPUESTA
# ==============================================================================

router = APIRouter(
    prefix="/suppliers",
    tags=["CRM - Proveedores"]
)

class PaginatedSuppliersResponse(BaseModel):
    """Modelo de respuesta para una lista paginada de proveedores."""
    total_count: int
    items: List[SupplierOut]

# ==============================================================================
# SECCIÓN 3: ENDPOINTS DE LA API
# ==============================================================================

@router.post(
    "",
    response_model=SupplierOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un nuevo proveedor",
    description="Registra un nuevo proveedor en la base de datos."
)
async def create_new_supplier(
    supplier_data: SupplierCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER]))
):
    """
    Endpoint para crear un nuevo proveedor.
    """
    return await crm_service.create_supplier(db, supplier_data)


@router.get(
    "",
    response_model=PaginatedSuppliersResponse,
    summary="Obtener lista paginada de proveedores",
    description="Recupera una lista paginada de proveedores, con opción de búsqueda."
)
async def get_all_suppliers(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(role_checker(UserRole.all_roles())),
    search: Optional[str] = Query(None, description="Término de búsqueda por ID Fiscal o Razón Social."),
    page: int = Query(1, ge=1, description="Número de página."),
    page_size: int = Query(10, ge=1, le=1000, description="Tamaño de la página.")
):
    """
    Endpoint para obtener una lista paginada de proveedores. El nombre del parámetro
    'page_size' sigue la convención de Python (snake_case).
    """
    result = await crm_service.get_all_suppliers_paginated(
        db=db, search=search, page=page, page_size=page_size
    )
    return result


@router.get(
    "/{supplier_id}",
    response_model=SupplierOut,
    summary="Obtener un proveedor por ID",
    description="Obtiene los detalles completos de un proveedor por su ID de base de datos.",
    responses={404: {"description": "Proveedor no encontrado"}}
)
async def get_supplier_by_id_route(
    supplier_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(role_checker(UserRole.all_roles()))
):
    """Endpoint para obtener los detalles de un único proveedor."""
    supplier = await crm_service.get_supplier_by_id(db, supplier_id)
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Proveedor con ID '{supplier_id}' no encontrado."
        )
    return supplier


@router.patch(
    "/{supplier_id}",
    response_model=SupplierOut,
    summary="Actualizar un proveedor (parcial)",
    description="Actualiza uno o más campos de un proveedor existente utilizando su ID.",
    responses={404: {"description": "Proveedor no encontrado para actualizar"}}
)
async def update_supplier_route(
    supplier_id: str,
    supplier_data: SupplierUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER]))
):
    """
    Endpoint para actualizar un proveedor. Utiliza PATCH para actualizaciones parciales.
    """
    updated_supplier = await crm_service.update_supplier_by_id(db, supplier_id, supplier_data)
    if not updated_supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Proveedor con ID '{supplier_id}' no encontrado para actualizar."
        )
    return updated_supplier


@router.delete(
    "/{supplier_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Desactivar un proveedor (borrado lógico)",
    description="Realiza un borrado lógico de un proveedor marcándolo como inactivo.",
    responses={404: {"description": "Proveedor no encontrado para desactivar"}}
)
async def deactivate_supplier_route(
    supplier_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(role_checker([UserRole.SUPERADMIN, UserRole.ADMIN]))
):
    """Endpoint para desactivar (soft delete) un proveedor."""
    success = await crm_service.deactivate_supplier_by_id(db, supplier_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Proveedor con ID '{supplier_id}' no encontrado para desactivar."
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)