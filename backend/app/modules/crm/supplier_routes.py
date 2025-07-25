# /backend/app/modules/crm/supplier_routes.py

"""
Define los endpoints de la API para la gestión de Proveedores (Suppliers).

Este router expone las operaciones CRUD (Crear, Leer, Actualizar, Borrar)
para los proveedores, delegando la lógica de negocio a la capa de servicio
y aplicando la protección de rutas basada en roles de usuario.
"""

# --- SECCIÓN 1: IMPORTACIONES ---

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase

# Importaciones de la aplicación
from app.core.database import get_db
from app.dependencies.roles import role_checker
from app.modules.users.user_models import UserRole
from . import crm_service  # Importamos el servicio
from .supplier_models import SupplierCreate, SupplierOut, SupplierUpdate


# --- SECCIÓN 2: DEFINICIÓN DEL ROUTER Y MODELOS DE RESPUESTA ---

router = APIRouter(
    prefix="/suppliers",
    tags=["CRM - Proveedores"]
)

class PaginatedSuppliersResponse(BaseModel):
    """Modelo de respuesta para una lista paginada de proveedores."""
    total_count: int
    items: List[SupplierOut]


# --- SECCIÓN 3: ENDPOINTS DE LA API ---

@router.post(
    "/",
    response_model=SupplierOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un nuevo proveedor",
    description="Registra un nuevo proveedor en la base de datos."
)
async def create_new_supplier(
    supplier_data: SupplierCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    # Solo los roles con permisos de gestión pueden crear proveedores.
    _user: dict = Depends(role_checker([
        UserRole.SUPERADMIN,
        UserRole.ADMIN,
        UserRole.MANAGER
    ]))
):
    """
    Endpoint para crear un nuevo proveedor.

    La lógica de negocio, como la verificación de RUCs duplicados, se maneja
    en la capa de servicio. Si el servicio levanta un HTTPException, FastAPI
    lo procesará y devolverá la respuesta de error HTTP adecuada.
    """
    # El bloque try/except ya no es necesario aquí gracias a que el servicio
    # maneja los errores con HTTPException.
    return await crm_service.create_supplier(db, supplier_data)


@router.get(
    "/",
    response_model=PaginatedSuppliersResponse,
    summary="Obtener lista de proveedores",
    description="Recupera una lista paginada de todos los proveedores activos, con opción de búsqueda."
)
async def get_all_suppliers(
    db: AsyncIOMotorDatabase = Depends(get_db),
    # Cualquier usuario logueado puede ver la lista de proveedores.
    _user: dict = Depends(role_checker(UserRole.all_roles())),
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(10, ge=1, le=100, alias="pageSize", description="Tamaño de la página")
):
    """
    Endpoint para obtener una lista paginada de proveedores.

    Utiliza `Query` para una mejor validación y documentación de los parámetros.
    El alias "pageSize" permite que el frontend envíe el parámetro en camelCase.
    """
    result = await crm_service.get_all_suppliers_paginated(
        db=db, search=search, page=page, page_size=page_size
    )
    return result

# --- PRÓXIMOS PASOS ---
# Aquí puedes añadir los endpoints para actualizar (PUT), obtener uno por ID (GET /{id}),
# y desactivar (DELETE o PATCH) un proveedor, siguiendo este mismo patrón.

# Ejemplo de esqueleto para obtener un proveedor por su ID:
# @router.get("/{supplier_id}", response_model=SupplierOut)
# async def get_supplier_by_id(...): ...

# Ejemplo de esqueleto para actualizar un proveedor:
# @router.put("/{supplier_id}", response_model=SupplierOut)
# async def update_existing_supplier(...): ...