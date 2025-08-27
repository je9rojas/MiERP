# /backend/app/modules/purchasing/purchase_order_service.py

"""
Capa de Servicio para la Lógica de Negocio de las Órdenes de Compra.

Este módulo se adhiere al Principio de Responsabilidad Única (SRP), centrando
exclusivamente su funcionalidad en la gestión de las Órdenes de Compra (Purchase Orders).
Orquesta las interacciones con los repositorios de datos (órdenes, productos,
proveedores) y encapsula todas las reglas de negocio, validaciones y
transformaciones de datos específicas de esta entidad.

Responsabilidades Clave:
- Creación y validación de nuevas órdenes de compra.
- Enriquecimiento de los ítems de la orden con datos del catálogo de productos.
- Actualización de órdenes existentes, restringida a estados permisibles (ej. 'borrador').
- Gestión de las transiciones de estado de la orden (ej. de 'borrador' a 'confirmada').
- Consulta de órdenes de compra con paginación, búsqueda y poblado de datos del proveedor.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

import logging
from datetime import datetime, timezone, date, time
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import DESCENDING

from app.core.services.document_numbering_service import generate_sequential_number
from app.models.shared import PyObjectId
from app.modules.crm.repositories.supplier_repository import SupplierRepository
from app.modules.inventory.repositories.product_repository import ProductRepository
from app.modules.purchasing.repositories.purchase_order_repository import PurchaseOrderRepository
from app.modules.shared.utils.population_utils import populate_documents_with_supplier_info
from app.modules.users.user_models import UserOut
# --- CORRECCIÓN ---
# La importación de modelos ahora apunta al nuevo archivo específico para Órdenes de Compra,
# mejorando la cohesión y claridad del módulo.
from .purchase_order_models import (
    PurchaseOrderCreate,
    PurchaseOrderItem,
    PurchaseOrderInDB,
    PurchaseOrderOut,
    PurchaseOrderStatus,
    PurchaseOrderUpdate
)

# ==============================================================================
# SECCIÓN 2: CONFIGURACIÓN DEL LOGGER
# ==============================================================================

logger = logging.getLogger(__name__)


# ==============================================================================
# SECCIÓN 3: SERVICIOS PARA ÓRDENES DE COMPRA (PURCHASE ORDER)
# ==============================================================================

async def create_purchase_order(
    db: AsyncIOMotorDatabase,
    order_data: PurchaseOrderCreate,
    current_user: UserOut
) -> PurchaseOrderOut:
    """
    Crea una nueva Orden de Compra.

    Orquesta la validación del proveedor, el enriquecimiento de los ítems de la
    orden con información de los productos y el cálculo del total, antes de
    persistir la orden en la base de datos.

    Args:
        db: Conexión a la base de datos.
        order_data: Datos de la nueva orden de compra.
        current_user: Usuario autenticado que realiza la operación.

    Returns:
        La orden de compra creada y poblada con los datos del proveedor.

    Raises:
        HTTPException 404: Si el proveedor o alguno de los productos no existen.
    """
    purchase_order_repo = PurchaseOrderRepository(db)
    supplier_repo = SupplierRepository(db)
    product_repo = ProductRepository(db)

    # 1. Validar la existencia del proveedor
    if not await supplier_repo.find_by_id(str(order_data.supplier_id)):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El proveedor con ID '{order_data.supplier_id}' no existe."
        )

    # 2. Enriquecer ítems y calcular el total
    enriched_items, total_amount = await _enrich_order_items_and_calculate_total(
        product_repo=product_repo,
        items=order_data.items
    )

    # 3. Preparar el documento para la base de datos
    order_datetime = datetime.combine(order_data.order_date, time.min, tzinfo=timezone.utc)
    delivery_datetime = (
        datetime.combine(order_data.expected_delivery_date, time.min, tzinfo=timezone.utc)
        if order_data.expected_delivery_date
        else None
    )
    
    sequential_number = await generate_sequential_number(purchase_order_repo, "OC", "order_number")

    order_to_db = PurchaseOrderInDB(
        **order_data.model_dump(exclude={"items", "order_date", "expected_delivery_date"}),
        order_number=sequential_number,
        created_by_id=current_user.id,
        items=enriched_items,
        total_amount=round(total_amount, 2),
        order_date=order_datetime,
        expected_delivery_date=delivery_datetime
    )

    # 4. Insertar en la base de datos
    document_to_insert = order_to_db.model_dump(by_alias=True, exclude={'id'})
    inserted_id = await purchase_order_repo.insert_one(document_to_insert)

    # 5. Devolver el documento recién creado y poblado
    return await get_purchase_order_by_id(db, str(inserted_id))


async def update_purchase_order(
    db: AsyncIOMotorDatabase,
    order_id: str,
    update_data: PurchaseOrderUpdate
) -> PurchaseOrderOut:
    """
    Actualiza una Orden de Compra existente.

    Valida que la orden esté en un estado editable ('borrador'). Si se modifican
    los ítems, recalcula la información enriquecida y el monto total.

    Args:
        db: Conexión a la base de datos.
        order_id: ID de la orden de compra a actualizar.
        update_data: Datos para actualizar.

    Returns:
        La orden de compra actualizada y poblada.

    Raises:
        HTTPException 404: Si la orden no existe.
        HTTPException 409: Si la orden no está en estado 'borrador'.
    """
    purchase_order_repo = PurchaseOrderRepository(db)
    product_repo = ProductRepository(db)

    # 1. Verificar la existencia y el estado de la orden
    order_doc = await purchase_order_repo.find_one_by_id(order_id)
    if not order_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Compra no existe.")

    if order_doc.get("status") != PurchaseOrderStatus.DRAFT.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Solo se pueden editar Órdenes de Compra en estado 'borrador'."
        )

    # 2. Preparar el payload de actualización
    update_payload = update_data.model_dump(exclude_unset=True)

    # 3. Procesar ítems si han sido modificados
    if "items" in update_payload and update_payload["items"] is not None:
        # Aquí asumimos que update_payload["items"] es una lista de dicts
        item_objects = [PurchaseOrderItem(**item) for item in update_payload["items"]]
        enriched_items, total_amount = await _enrich_order_items_and_calculate_total(
            product_repo=product_repo,
            items=item_objects
        )
        update_payload["items"] = [item.model_dump() for item in enriched_items]
        update_payload["total_amount"] = round(total_amount, 2)

    # 4. Formatear fechas
    if "expected_delivery_date" in update_payload:
        update_payload["expected_delivery_date"] = _normalize_date_to_datetime(
            update_payload["expected_delivery_date"]
        )

    update_payload["updated_at"] = datetime.now(timezone.utc)

    # 5. Ejecutar la actualización
    await purchase_order_repo.update_one_by_id(order_id, update_payload)
    return await get_purchase_order_by_id(db, order_id)


async def get_purchase_order_by_id(db: AsyncIOMotorDatabase, order_id: str) -> PurchaseOrderOut:
    """
    Obtiene una única Orden de Compra por su ID, con datos del proveedor poblados.

    Args:
        db: Conexión a la base de datos.
        order_id: ID de la orden de compra.

    Returns:
        La orden de compra encontrada.

    Raises:
        HTTPException 404: Si la orden de compra no se encuentra.
    """
    po_repo = PurchaseOrderRepository(db)
    order_doc = await po_repo.find_one_by_id(order_id)
    if not order_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Orden de Compra con ID '{order_id}' no encontrada."
        )
    
    supplier_repo = SupplierRepository(db)
    populated_list = await populate_documents_with_supplier_info(
        db, [order_doc], supplier_repo, PurchaseOrderOut
    )
    return populated_list[0]


async def get_purchase_orders_paginated(
    db: AsyncIOMotorDatabase,
    page: int,
    page_size: int,
    search: Optional[str]
) -> Dict[str, Any]:
    """
    Obtiene una lista paginada de Órdenes de Compra.

    Permite la búsqueda por número de orden o por nombre del proveedor.

    Args:
        db: Conexión a la base de datos.
        page: Número de página a obtener.
        page_size: Tamaño de la página.
        search: Término de búsqueda opcional.

    Returns:
        Un diccionario con el conteo total de documentos y la lista de órdenes.
    """
    po_repo = PurchaseOrderRepository(db)
    query: Dict[str, Any] = {}

    if search:
        supplier_repo = SupplierRepository(db)
        supplier_ids = await supplier_repo.find_ids_by_name(search)
        query["$or"] = [
            {"order_number": {"$regex": search, "$options": "i"}},
            {"supplier_id": {"$in": supplier_ids}}
        ]

    total_count = await po_repo.count_documents(query)
    order_docs = await po_repo.find_all_paginated(
        query=query,
        skip=(page - 1) * page_size,
        limit=page_size,
        sort=[("order_date", DESCENDING)]
    )
    
    supplier_repo = SupplierRepository(db)
    populated_items = await populate_documents_with_supplier_info(
        db, order_docs, supplier_repo, PurchaseOrderOut
    )
    
    return {"total_count": total_count, "items": populated_items}


async def update_purchase_order_status(
    db: AsyncIOMotorDatabase,
    order_id: str,
    new_status: PurchaseOrderStatus,
    receipt_id: Optional[PyObjectId] = None
) -> PurchaseOrderOut:
    """
    Actualiza el estado de una Orden de Compra.

    Define las transiciones de estado válidas para evitar inconsistencias en el
    flujo de negocio. También permite asociar el ID de una recepción de mercancía.

    Args:
        db: Conexión a la base de datos.
        order_id: ID de la orden de compra.
        new_status: El nuevo estado a aplicar.
        receipt_id: ID opcional de la recepción que motiva el cambio de estado.

    Returns:
        La orden de compra con el estado actualizado.

    Raises:
        HTTPException 404: Si la orden no existe.
        HTTPException 409: Si la transición de estado no es válida.
    """
    po_repo = PurchaseOrderRepository(db)
    po_doc = await po_repo.find_one_by_id(order_id)
    if not po_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Compra no existe.")

    current_status = PurchaseOrderStatus(po_doc.get('status'))
    _validate_status_transition(current_status, new_status)

    update_payload: Dict[str, Any] = {
        "status": new_status.value,
        "updated_at": datetime.now(timezone.utc)
    }
    
    update_operations: Dict[str, Any] = {"$set": update_payload}

    if receipt_id:
        update_operations["$push"] = {"receipt_ids": receipt_id}

    await po_repo.execute_update_one_by_id(order_id, update_operations)
    return await get_purchase_order_by_id(db, order_id)


# ==============================================================================
# SECCIÓN 4: FUNCIONES AUXILIARES PRIVADAS
# ==============================================================================

async def _enrich_order_items_and_calculate_total(
    product_repo: ProductRepository,
    items: List[PurchaseOrderItem]
) -> tuple[List[PurchaseOrderItem], float]:
    """
    Enriquece los ítems de una orden con datos del producto y calcula el total.
    """
    total_amount = 0.0
    enriched_items = []
    product_ids = [str(item.product_id) for item in items]
    
    products_from_db = await product_repo.find_by_ids(product_ids)
    product_map = {str(p["_id"]): p for p in products_from_db}

    for item_data in items:
        product_doc = product_map.get(str(item_data.product_id))
        if not product_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto con ID '{item_data.product_id}' no encontrado."
            )

        total_amount += item_data.quantity_ordered * item_data.unit_cost
        
        # Se crea un nuevo objeto para asegurar la inmutabilidad y la validación
        enriched_item = PurchaseOrderItem(
            **item_data.model_dump(),
            sku=product_doc.get("sku", "N/A"),
            name=product_doc.get("name", "N/A")
        )
        enriched_items.append(enriched_item)

    return enriched_items, total_amount


def _normalize_date_to_datetime(value: Any) -> Optional[datetime]:
    """Convierte un objeto date a datetime con UTC timezone."""
    if value is None:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return datetime.combine(value, time.min, tzinfo=timezone.utc)
    if isinstance(value, datetime) and value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _validate_status_transition(
    current_status: PurchaseOrderStatus,
    new_status: PurchaseOrderStatus
) -> None:
    """

    Valida si una transición de estado de una orden de compra es permitida.
    
    Externaliza la lógica de validación para mantener el servicio principal más limpio.
    Estas reglas son críticas para la integridad del flujo de negocio.
    """
    # Define las transiciones de estado permitidas
    valid_transitions: Dict[PurchaseOrderStatus, List[PurchaseOrderStatus]] = {
        PurchaseOrderStatus.DRAFT: [
            PurchaseOrderStatus.CONFIRMED,
            PurchaseOrderStatus.CANCELLED
        ],
        PurchaseOrderStatus.CONFIRMED: [
            PurchaseOrderStatus.PARTIALLY_RECEIVED,
            PurchaseOrderStatus.FULLY_RECEIVED,
            PurchaseOrderStatus.CANCELLED
        ],
        PurchaseOrderStatus.PARTIALLY_RECEIVED: [
            PurchaseOrderStatus.FULLY_RECEIVED,
            PurchaseOrderStatus.CANCELLED
        ],
        # Los estados 'FULLY_RECEIVED' y 'CANCELLED' son estados terminales.
        PurchaseOrderStatus.FULLY_RECEIVED: [],
        PurchaseOrderStatus.CANCELLED: [],
    }

    if new_status not in valid_transitions.get(current_status, []):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Transición de estado no válida de '{current_status.value}' a '{new_status.value}'."
        )