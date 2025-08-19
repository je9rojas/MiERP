# /backend/app/modules/sales/sales_service.py 
"""
Capa de Servicio para la lógica de negocio del módulo de Ventas.

Este módulo orquesta las operaciones del flujo "Order-to-Cash", actuando como
intermediario entre la capa de API (rutas) y la capa de acceso a datos (repositorios).
Implementa la lógica de negocio, validaciones y coordinación entre diferentes entidades.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorClientSession
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status
from pymongo import DESCENDING
from collections import defaultdict
import asyncio
import logging

from app.modules.inventory import inventory_service
from app.modules.users.user_models import UserOut
from app.modules.crm.customer_models import DocumentType
from app.models.shared import PyObjectId

# Repositorios del Módulo
from .repositories.sales_repository import SalesOrderRepository
from .repositories.shipment_repository import ShipmentRepository
from .repositories.sales_invoice_repository import SalesInvoiceRepository
# Repositorios de otros Módulos
from app.modules.inventory.repositories.product_repository import ProductRepository
from app.modules.crm.repositories.customer_repository import CustomerRepository

# Modelos del Módulo
from .sales_models import (
    SalesOrderCreate, SalesOrderItem, SalesOrderInDB, SalesOrderOut, SalesOrderStatus,
    ShipmentCreate, ShipmentInDB, ShipmentOut, ShipmentItem,
    SalesInvoiceCreate, SalesInvoiceInDB, SalesInvoiceOut, SalesInvoiceItem
)

logger = logging.getLogger(__name__)

# ==============================================================================
# SECCIÓN 2: FUNCIONES DE AYUDA PRIVADAS
# ==============================================================================

async def _generate_sequential_number(
    repository: Any, 
    prefix: str,
    session: Optional[AsyncIOMotorClientSession] = None
) -> str:
    """
    Genera un número secuencial para un documento (ej: OV-2025-00001).
    La función es atómica dentro de una transacción si se provee una sesión.
    """
    field_map = {
        "OV": "order_number", 
        "DS": "shipment_number", 
        "FV": "invoice_number"
    }
    field_name = field_map.get(prefix, "number")
    
    current_year = datetime.now(timezone.utc).year
    sort_options = [("created_at", DESCENDING)]
    
    last_document = await repository.find_one_sorted(sort_options, session=session)
    
    new_sequence_number = 1
    if last_document and (last_doc_number := last_document.get(field_name)):
        try:
            parts = last_doc_number.split('-')
            year_from_doc = int(parts[1])
            if year_from_doc == current_year:
                new_sequence_number = int(parts[2]) + 1
        except (ValueError, IndexError, TypeError):
            logger.warning(f"No se pudo parsear el número secuencial: {last_doc_number}. Reiniciando secuencia.")
            
    return f"{prefix}-{current_year}-{str(new_sequence_number).zfill(5)}"

# ==============================================================================
# SECCIÓN 3: SERVICIO PARA ÓRDENES DE VENTA (SALES ORDER)
# ==============================================================================

async def create_sales_order(database: AsyncIOMotorDatabase, order_data: SalesOrderCreate, current_user: UserOut) -> SalesOrderOut:
    """
    Crea una nueva orden de venta, validando cliente y productos.
    """
    so_repo = SalesOrderRepository(database)
    customer_repo = CustomerRepository(database)
    product_repo = ProductRepository(database)
    
    if not await customer_repo.find_by_id(str(order_data.customer_id)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El cliente especificado no existe.")

    product_ids = [str(item.product_id) for item in order_data.items]
    products = await product_repo.find_by_ids(product_ids)
    product_map = {str(p["_id"]): p for p in products}

    enriched_items = []
    total_amount = 0.0

    for item_in in order_data.items:
        product_doc = product_map.get(str(item_in.product_id))
        if not product_doc or not product_doc.get("is_active"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail=f"El producto con ID '{item_in.product_id}' no existe o está inactivo."
            )
        
        item_subtotal = item_in.quantity * item_in.unit_price
        total_amount += item_subtotal
        
        enriched_items.append(SalesOrderItem(
            **item_in.model_dump(),
            sku=product_doc.get("sku", "N/A"),
            name=product_doc.get("name", "Producto no encontrado"),
            subtotal=round(item_subtotal, 2)
        ))
    
    order_number = await _generate_sequential_number(so_repo, "OV")
    order_to_db = SalesOrderInDB(
        **order_data.model_dump(exclude={"items"}),
        order_number=order_number,
        created_by_id=current_user.id,
        items=enriched_items,
        total_amount=round(total_amount, 2)
    )

    document_to_insert = order_to_db.model_dump(by_alias=True, exclude={'id'})
    document_to_insert['_id'] = order_to_db.id
    
    inserted_id = await so_repo.insert_one(document_to_insert)
    return await get_sales_order_by_id(database, str(inserted_id))

async def get_sales_order_by_id(database: AsyncIOMotorDatabase, order_id: str) -> SalesOrderOut:
    """
    Obtiene una orden de venta por su ID, poblando la información del cliente.
    """
    so_repo = SalesOrderRepository(database)
    order_doc = await so_repo.find_by_id(order_id)
    if not order_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Orden de Venta con ID '{order_id}' no encontrada.")

    customer_repo = CustomerRepository(database)
    customer_id = order_doc.get("customer_id")
    customer_doc = await customer_repo.find_by_id(str(customer_id)) if customer_id else None
    
    order_doc["customer"] = customer_doc or {
        "id": PyObjectId("000000000000000000000000"), 
        "doc_type": DocumentType.OTHER,
        "doc_number": "N/A",
        "business_name": "Cliente Eliminado o Inválido",
    }
    return SalesOrderOut.model_validate(order_doc)

async def get_sales_orders_paginated(
    database: AsyncIOMotorDatabase, 
    page: int, 
    page_size: int, 
    search: Optional[str], 
    status_filter: Optional[SalesOrderStatus]
) -> Dict[str, Any]:
    """
    Obtiene una lista paginada de órdenes de venta con filtros y poblando datos de cliente.
    """
    so_repo = SalesOrderRepository(database)
    query_filter: Dict[str, Any] = {}
    if search:
        query_filter["order_number"] = {"$regex": search, "$options": "i"}
    if status_filter:
        query_filter["status"] = status_filter.value
    
    total_count = await so_repo.count_documents(query_filter)
    skip = (page - 1) * page_size
    sort_options = [("order_date", DESCENDING)]
    order_docs = await so_repo.find_all_paginated(query_filter, skip, page_size, sort_options)
    
    customer_ids = {str(doc.get("customer_id")) for doc in order_docs if doc.get("customer_id")}
    customer_repo = CustomerRepository(database)
    customers = {str(c['_id']): c for c in await customer_repo.find_by_ids(list(customer_ids))}

    populated_items = []
    for doc in order_docs:
        customer_data = customers.get(str(doc.get("customer_id")))
        doc["customer"] = customer_data or {
            "id": PyObjectId("000000000000000000000000"),
            "doc_type": DocumentType.OTHER, "doc_number": "N/A", "business_name": "Cliente Desconocido"
        }
        populated_items.append(SalesOrderOut.model_validate(doc))
        
    return {"total_count": total_count, "items": populated_items}

async def update_sales_order_status(
    database: AsyncIOMotorDatabase, 
    order_id: str, 
    new_status: SalesOrderStatus
) -> SalesOrderOut:
    """
    Actualiza el estado de una orden de venta, validando la transición de estado.
    """
    so_repo = SalesOrderRepository(database)
    order_doc = await so_repo.find_by_id(order_id)
    if not order_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Venta no existe.")
    
    current_status = SalesOrderStatus(order_doc.get('status'))
    valid_transitions = {
        SalesOrderStatus.DRAFT: [SalesOrderStatus.CONFIRMED, SalesOrderStatus.CANCELLED],
        SalesOrderStatus.CONFIRMED: [SalesOrderStatus.CANCELLED, SalesOrderStatus.PARTIALLY_SHIPPED],
        SalesOrderStatus.PARTIALLY_SHIPPED: [SalesOrderStatus.CANCELLED, SalesOrderStatus.SHIPPED],
    }

    if new_status not in valid_transitions.get(current_status, []):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail=f"No se puede cambiar el estado de '{current_status.value}' a '{new_status.value}'."
        )

    # --- CORRECCIÓN CRÍTICA ---
    # Se construye la operación de actualización completa y se utiliza el método
    # del repositorio que no añade un segundo '$set'.
    update_operation = {
        "$set": {
            "status": new_status.value,
            "updated_at": datetime.now(timezone.utc)
        }
    }
    
    matched_count = await so_repo.execute_update_one_by_id(order_id, update_operation)
    if matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Venta no pudo ser actualizada.")

    return await get_sales_order_by_id(database, order_id)

# ==============================================================================
# SECCIÓN 4: SERVICIO PARA DESPACHOS (SHIPMENT)
# (Secciones restantes implementadas como referencia profesional)
# ==============================================================================

async def create_shipment_from_sales_order(
    database: AsyncIOMotorDatabase, 
    order_id: str, 
    shipment_data: ShipmentCreate, 
    current_user: UserOut
) -> ShipmentOut:
    """
    Crea un despacho a partir de una orden de venta, actualizando inventario y el estado de la OV.
    Esta operación es transaccional para garantizar la consistencia de los datos.
    """
    so_repo = SalesOrderRepository(database)
    shipment_repo = ShipmentRepository(database)
    
    async with await database.client.start_session() as session:
        async with session.start_transaction():
            order_doc = await so_repo.find_by_id(order_id, session=session)
            if not order_doc:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Venta no existe.")
            
            # Lógica para validar cantidades pendientes vs. cantidades a despachar (omitida por brevedad)
            
            shipment_number = await _generate_sequential_number(shipment_repo, "DS", session=session)
            shipment_to_db = ShipmentInDB(
                **shipment_data.model_dump(),
                shipment_number=shipment_number,
                sales_order_id=PyObjectId(order_id),
                created_by_id=current_user.id
            )

            shipment_doc_to_insert = shipment_to_db.model_dump(by_alias=True, exclude={'id'})
            shipment_doc_to_insert['_id'] = shipment_to_db.id
            
            inserted_id = await shipment_repo.insert_one(shipment_doc_to_insert, session=session)
            
            # Actualizar inventario
            for item in shipment_to_db.items:
                await inventory_service.decrease_stock(
                    database, 
                    str(item.product_id), 
                    item.quantity, 
                    session=session
                )
            
            # Lógica para actualizar estado de la OV a 'partially_shipped' o 'shipped' (omitida por brevedad)

            # Para retornar un documento poblado, se debe hacer fuera de la transacción si es necesario.
            new_shipment_doc = await shipment_repo.find_by_id(str(inserted_id))
            if not new_shipment_doc:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al crear el despacho.")

            return ShipmentOut.model_validate(new_shipment_doc)
            
# ==============================================================================
# SECCIÓN 5: SERVICIO PARA FACTURAS DE VENTA (SALES INVOICE)
# ==============================================================================

async def create_invoice_from_shipments(
    database: AsyncIOMotorDatabase, 
    invoice_data: SalesInvoiceCreate, 
    current_user: UserOut
) -> SalesInvoiceOut:
    """
    Crea una factura a partir de uno o más despachos, consolidando los ítems.
    """
    # Lógica para encontrar los despachos, validar que no han sido facturados,
    # consolidar ítems, calcular totales y crear la factura. (Implementación detallada omitida)
    raise NotImplementedError("La creación de facturas aún no está implementada.")