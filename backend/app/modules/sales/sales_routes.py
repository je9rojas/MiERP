# /backend/app/modules/sales/sales_routes.py

"""
Define los endpoints de la API para el Módulo de Ventas.

Este módulo gestiona todas las operaciones CRUD (Crear, Leer, Actualizar, Eliminar)
para las entidades del flujo "Order-to-Cash", incluyendo Órdenes de Venta,
Despachos y Facturas de Venta.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

# --- Importaciones de la Librería Estándar y Terceros ---
import logging
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

# --- Importaciones de la Aplicación ---
from app.core.database import get_db
from app.dependencies.roles import role_checker
from app.modules.auth.dependencies import get_current_active_user
from app.modules.users.user_models import UserRole, UserOut

# --- Importaciones del Módulo Local ---
from . import sales_service
from .sales_models import (
    SalesOrderCreate, SalesOrderOut, SalesOrderStatus,
    ShipmentCreate, ShipmentOut,
    SalesInvoiceCreate, SalesInvoiceOut
)

# ==============================================================================
# SECCIÓN 2: CONFIGURACIÓN INICIAL
# ==============================================================================

# Configuración del logger para este módulo específico
logger = logging.getLogger(__name__)

# Creación del router para los endpoints de ventas
router = APIRouter(
    prefix="/sales",
    tags=["Ventas"]
)

# ==============================================================================
# SECCIÓN 3: MODELOS DE RESPUESTA DE LA API
# ==============================================================================

class PaginatedSalesOrdersResponse(BaseModel):
    """Modelo de respuesta estandarizado para listas paginadas de órdenes de venta."""
    total_count: int
    items: List[SalesOrderOut]

# ==============================================================================
# SECCIÓN 4: ENDPOINTS PARA ÓRDENES DE VENTA (SALES ORDERS)
# ==============================================================================

@router.post(
    "/orders",
    response_model=SalesOrderOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una nueva Orden de Venta",
    description="Registra una nueva orden de venta en el sistema, validando los datos de entrada y asignando al usuario actual como el creador."
)
async def create_new_sales_order(
    order_payload: SalesOrderCreate,
    database: AsyncIOMotorDatabase = Depends(get_db),
    # [RESTAURADO] Se vuelve a utilizar el 'role_checker' con la lógica ya corregida.
    current_user: UserOut = Depends(role_checker([
        UserRole.SUPERADMIN,
        UserRole.ADMIN,
        UserRole.MANAGER,
        UserRole.SALES
    ]))
):
    """
    Gestiona la petición para crear una orden de venta.

    Delega la lógica de negocio a la capa de servicio y retorna la orden creada.
    """
    logger.info(f"Petición recibida para crear Orden de Venta por el usuario '{current_user.username}'.")
    logger.debug(f"Payload recibido: {order_payload.model_dump_json(indent=2)}")
    
    created_order = await sales_service.create_sales_order(database, order_payload, current_user)
    
    logger.info(f"Orden de Venta #{created_order.order_number} creada exitosamente.")
    return created_order


@router.patch(
    "/orders/{order_id}/confirm",
    response_model=SalesOrderOut,
    summary="Confirmar una Orden de Venta",
    description="Cambia el estado de una orden de venta de 'Borrador' a 'Confirmado', lo que permite su posterior procesamiento (despacho)."
)
async def confirm_sales_order(
    order_id: str,
    database: AsyncIOMotorDatabase = Depends(get_db),
    # El '_' indica que la variable es necesaria para la validación de roles pero no se usa en el cuerpo de la función.
    _user: UserOut = Depends(role_checker([
        UserRole.SUPERADMIN,
        UserRole.ADMIN,
        UserRole.MANAGER,
        UserRole.SALES
    ]))
):
    """
    Gestiona la petición para confirmar una orden de venta.
    """
    logger.info(f"Petición recibida para confirmar la Orden de Venta con ID: {order_id}")
    confirmed_order = await sales_service.update_sales_order_status(database, order_id, SalesOrderStatus.CONFIRMED)
    logger.info(f"Orden de Venta #{confirmed_order.order_number} confirmada exitosamente.")
    return confirmed_order


@router.get(
    "/orders",
    response_model=PaginatedSalesOrdersResponse,
    summary="Listar todas las Órdenes de Venta",
    description="Obtiene una lista paginada de todas las órdenes de venta, con opciones para buscar y filtrar por estado."
)
async def get_all_sales_orders(
    database: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(get_current_active_user),
    search_term: Optional[str] = Query(None, description="Término para buscar por número de orden.", alias="search"),
    order_status: Optional[SalesOrderStatus] = Query(None, description="Filtrar órdenes por su estado.", alias="status"),
    page: int = Query(1, ge=1, description="Número de la página a obtener."),
    page_size: int = Query(25, ge=1, le=100, description="Número de resultados por página.")
) -> Dict[str, Any]:
    """
    Gestiona la petición para obtener una lista paginada de órdenes de venta.
    """
    return await sales_service.get_sales_orders_paginated(database, page, page_size, search_term, order_status)


@router.get(
    "/orders/{order_id}",
    response_model=SalesOrderOut,
    summary="Obtener una Orden de Venta por ID",
    description="Recupera todos los detalles de una orden de venta específica utilizando su identificador único."
)
async def get_sales_order_by_id(
    order_id: str,
    database: AsyncIOMotorDatabase = Depends(get_db),
    _user: UserOut = Depends(get_current_active_user)
):
    """
    Gestiona la petición para recuperar una orden de venta por su ID.
    """
    return await sales_service.get_sales_order_by_id(database, order_id)

# ==============================================================================
# SECCIÓN 5: ENDPOINTS PARA DESPACHOS (SHIPMENTS)
# ==============================================================================

@router.post(
    "/orders/{order_id}/shipments",
    response_model=ShipmentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un Despacho desde una Orden de Venta",
    description="Genera un nuevo registro de despacho asociado a una orden de venta confirmada."
)
async def create_shipment_from_order(
    order_id: str,
    shipment_payload: ShipmentCreate,
    database: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(role_checker([
        UserRole.SUPERADMIN,
        UserRole.ADMIN,
        UserRole.WAREHOUSE
    ]))
):
    """
    Gestiona la petición para crear un despacho a partir de una orden de venta.
    """
    logger.info(f"Petición recibida para crear un despacho para la Orden de Venta ID: {order_id}")
    created_shipment = await sales_service.create_shipment_from_sales_order(database, order_id, shipment_payload, current_user)
    logger.info(f"Despacho #{created_shipment.shipment_number} creado exitosamente.")
    return created_shipment

# ==============================================================================
# SECCIÓN 6: ENDPOINTS PARA FACTURAS DE VENTA (SALES INVOICES)
# ==============================================================================

@router.post(
    "/orders/{order_id}/invoice",
    response_model=SalesInvoiceOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una Factura desde una Orden de Venta",
    description="Genera una factura financiera a partir de los despachos asociados a una orden de venta."
)
async def create_invoice_for_order(
    order_id: str, # Aunque no se use directamente aquí, es semánticamente correcto en la URL
    invoice_payload: SalesInvoiceCreate,
    database: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserOut = Depends(role_checker([
        UserRole.SUPERADMIN,
        UserRole.ADMIN,
        UserRole.ACCOUNTANT
    ]))
):
    """
    Gestiona la petición para crear una factura.
    """
    logger.info(f"Petición recibida para crear una factura para la Orden de Venta ID: {order_id}")
    # Nota: El servicio podría necesitar el 'order_id' en el futuro para validaciones.
    created_invoice = await sales_service.create_invoice_from_shipments(database, invoice_payload, current_user)
    logger.info(f"Factura #{created_invoice.invoice_number} creada exitosamente.")
    return created_invoice