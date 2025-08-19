# /backend/app/modules/crm/customer_routes.py

"""
Define los endpoints de la API REST para la entidad 'Cliente' (Customer).

Este archivo expone un conjunto completo de operaciones CRUD para la gestión
de clientes, validando entradas y salidas, y delegando toda la lógica de
negocio a la capa de servicio (`crm_service`).
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================
from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.core.database import get_db
from app.dependencies.roles import role_checker
from app.modules.users.user_models import UserRole, UserOut
from app.modules.auth.dependencies import get_current_active_user

from . import crm_service
from .customer_models import CustomerCreate, CustomerUpdate, CustomerOut

# ==============================================================================
# SECCIÓN 2: CONFIGURACIÓN DEL ROUTER
# ==============================================================================

router = APIRouter(prefix="/customers", tags=["CRM - Clientes"])

# Lista de roles con permisos para gestionar la información de clientes.
ROLES_ALLOWED_TO_MANAGE_CUSTOMERS = [
    UserRole.SUPERADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SALES,
]

# ==============================================================================
# SECCIÓN 3: MODELO DE RESPUESTA PAGINADA
# ==============================================================================

class PaginatedCustomersResponse(BaseModel):
    """Define la estructura de la respuesta para las peticiones paginadas de clientes."""
    total_count: int
    items: List[CustomerOut]

# ==============================================================================
# SECCIÓN 4: ENDPOINTS DEL CRUD DE CLIENTES
# ==============================================================================

@router.post(
    "/",
    response_model=CustomerOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un nuevo Cliente",
    dependencies=[Depends(role_checker(ROLES_ALLOWED_TO_MANAGE_CUSTOMERS))]
)
async def create_new_customer(
    customer_data: CustomerCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(get_current_active_user)
):
    """
    Crea un nuevo cliente en el sistema tras validar que no exista un
    duplicado por número de documento.
    """
    return await crm_service.create_customer(db, customer_data)

@router.get(
    "/",
    response_model=PaginatedCustomersResponse,
    summary="Listar y buscar Clientes paginados"
)
async def get_all_customers_paginated(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(get_current_active_user),
    search: Optional[str] = Query(None, description="Término para buscar por nombre o N° de documento."),
    page: int = Query(1, ge=1, description="Número de página."),
    page_size: int = Query(10, ge=1, le=100, description="Tamaño de la página.")
) -> Dict[str, Any]:
    """
    Obtiene una lista paginada de clientes. Permite la búsqueda para
    implementar funcionalidades como autocompletado en el frontend.
    """
    return await crm_service.get_all_customers_paginated(
        db=db, search=search, page=page, page_size=page_size
    )

@router.get(
    "/{customer_id}",
    response_model=CustomerOut,
    summary="Obtener un Cliente por su ID"
)
async def get_customer_by_id_route(
    customer_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(get_current_active_user)
):
    """Recupera los detalles completos de un cliente específico por su ID."""
    return await crm_service.get_customer_by_id(db, customer_id)

@router.put(
    "/{customer_id}",
    response_model=CustomerOut,
    summary="Actualizar un Cliente",
    dependencies=[Depends(role_checker(ROLES_ALLOWED_TO_MANAGE_CUSTOMERS))]
)
async def update_customer_route(
    customer_id: str,
    customer_data: CustomerUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(get_current_active_user)
):
    """
    Actualiza la información de un cliente existente.
    Permite actualizaciones parciales.
    """
    # La lógica de actualización se encuentra en el servicio, aquí solo se pasa la data.
    return await crm_service.update_customer(db, customer_id, customer_data)