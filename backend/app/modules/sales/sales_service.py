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

# --- Importaciones de la Librería Estándar y Terceros ---
import logging
from datetime import datetime, timezone, date
from typing import Any, Dict, List, Optional, Type

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorClientSession, AsyncIOMotorDatabase
from pydantic import BaseModel
from pymongo import DESCENDING

# --- Importaciones de la Aplicación ---
from app.models.shared import PyObjectId
from app.modules.crm.customer_models import CustomerOut
from app.modules.crm.repositories.customer_repository import CustomerRepository
from app.modules.inventory import inventory_service
from app.modules.inventory.repositories.product_repository import ProductRepository
from app.modules.users.repositories.user_repository import UserRepository
from app.modules.users.user_models import UserOut

# --- Importaciones del Módulo Local ---
from .sales_models import (
    SalesInvoiceCreate, SalesOrderCreate, SalesOrderInDB, SalesOrderItem,
    SalesOrderOut, SalesOrderStatus, ShipmentCreate, ShipmentInDB, ShipmentOut
)
from .repositories.sales_invoice_repository import SalesInvoiceRepository
from .repositories.sales_repository import SalesOrderRepository
from .repositories.shipment_repository import ShipmentRepository

# ==============================================================================
# SECCIÓN 2: CONFIGURACIÓN DEL LOGGER
# ==============================================================================

logger = logging.getLogger(__name__)

# ==============================================================================
# SECCIÓN 3: FUNCIONES DE AYUDA PRIVADAS
# ==============================================================================

async def _generate_sequential_number(
    repository: Any, 
    prefix: str,
    session: Optional[AsyncIOMotorClientSession] = None
) -> str:
    """Genera un número secuencial para un documento (ej: OV-2025-00001)."""
    field_map = {"OV": "order_number", "DS": "shipment_number", "FV": "invoice_number"}
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

async def _populate_document_details(
    database: AsyncIOMotorDatabase,
    doc: Dict[str, Any],
    ModelOut: Type[BaseModel]
) -> BaseModel:
    """Puebla un documento con datos de Cliente y Usuario para las respuestas de la API."""
    if not doc:
        raise ValueError("Se intentó poblar un documento nulo.")

    customer_repo = CustomerRepository(database)
    user_repo = UserRepository(database)
    
    customer_id = doc.get("customer_id")
    if customer_id:
        customer_doc = await customer_repo.find_one_by_id(str(customer_id))
        doc["customer"] = CustomerOut.model_validate(customer_doc) if customer_doc else None
    else:
        doc["customer"] = None

    created_by_id = doc.get("created_by_id")
    if created_by_id:
        user_doc = await user_repo.find_one_by_id(str(created_by_id))
        doc["created_by"] = UserOut.model_validate(user_doc) if user_doc else None
    else:
        doc["created_by"] = None

    if not doc.get("customer"):
        logger.warning(f"No se encontró el cliente con ID '{customer_id}' para el documento '{doc.get('_id')}'.")
    if not doc.get("created_by"):
        logger.warning(f"No se encontró el usuario con ID '{created_by_id}' para el documento '{doc.get('_id')}'.")

    return ModelOut.model_validate(doc)

# ==============================================================================
# SECCIÓN 4: SERVICIO PARA ÓRDENES DE VENTA (SALES ORDER)
# ==============================================================================

async def create_sales_order(database: AsyncIOMotorDatabase, order_data: SalesOrderCreate, current_user: UserOut) -> SalesOrderOut:
    """
    Crea una nueva orden de venta, validando cliente, productos y convirtiendo la fecha.
    """
    so_repo = SalesOrderRepository(database)
    customer_repo = CustomerRepository(database)
    product_repo = ProductRepository(database)
    
    if not await customer_repo.find_one_by_id(str(order_data.customer_id)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El cliente especificado no existe.")

    product_ids = [str(item.product_id) for item in order_data.items]
    products = await product_repo.find_by_ids(product_ids)
    product_map = {str(p["_id"]): p for p in products}

    enriched_items = []
    total_amount = 0.0

    for item_in in order_data.items:
        product_doc = product_map.get(str(item_in.product_id))
        if not product_doc or not product_doc.get("is_active"):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"El producto con ID '{item_in.product_id}' no existe o está inactivo.")
        
        item_subtotal = item_in.quantity * item_in.unit_price
        total_amount += item_subtotal
        
        enriched_items.append(SalesOrderItem(**item_in.model_dump(), sku=product_doc.get("sku", "N/A"), name=product_doc.get("name", "Producto no encontrado"), subtotal=round(item_subtotal, 2)))
    
    order_number = await _generate_sequential_number(so_repo, "OV")
    
    order_datetime = datetime.combine(order_data.order_date, datetime.min.time(), tzinfo=timezone.utc)

    order_to_db = SalesOrderInDB(
        **order_data.model_dump(exclude={"items", "order_date"}),
        order_number=order_number,
        order_date=order_datetime,
        created_by_id=current_user.id,
        items=enriched_items,
        total_amount=round(total_amount, 2)
    )

    document_to_insert = order_to_db.model_dump(by_alias=True, exclude={'id'})
    document_to_insert['_id'] = order_to_db.id
    
    inserted_id = await so_repo.insert_one(document_to_insert)
    return await get_sales_order_by_id(database, str(inserted_id))

async def get_sales_order_by_id(database: AsyncIOMotorDatabase, order_id: str) -> SalesOrderOut:
    """Obtiene una orden de venta por su ID, poblando la información relacionada."""
    so_repo = SalesOrderRepository(database)
    order_doc = await so_repo.find_one_by_id(order_id)
    if not order_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Orden de Venta con ID '{order_id}' no encontrada.")

    return await _populate_document_details(database, order_doc, SalesOrderOut)

async def get_sales_orders_paginated(
    database: AsyncIOMotorDatabase, 
    page: int, 
    page_size: int, 
    search: Optional[str], 
    status_filter: Optional[SalesOrderStatus]
) -> Dict[str, Any]:
    """Obtiene una lista paginada de órdenes de venta con filtros."""
    so_repo = SalesOrderRepository(database)
    query_filter: Dict[str, Any] = {}
    if search: query_filter["order_number"] = {"$regex": search, "$options": "i"}
    if status_filter: query_filter["status"] = status_filter.value
    
    total_count = await so_repo.count_documents(query_filter)
    order_docs = await so_repo.find_all_paginated(query_filter, (page - 1) * page_size, page_size, [("order_date", DESCENDING)])
    
    populated_items = [await _populate_document_details(database, doc, SalesOrderOut) for doc in order_docs]
        
    return {"total_count": total_count, "items": populated_items}

async def update_sales_order_status(
    database: AsyncIOMotorDatabase, 
    order_id: str, 
    new_status: SalesOrderStatus
) -> SalesOrderOut:
    """Actualiza el estado de una orden de venta, validando la transición."""
    so_repo = SalesOrderRepository(database)
    order_doc = await so_repo.find_one_by_id(order_id)
    if not order_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Venta no existe.")
    
    current_status = SalesOrderStatus(order_doc.get('status'))
    valid_transitions = {
        SalesOrderStatus.DRAFT: [SalesOrderStatus.CONFIRMED, SalesOrderStatus.CANCELLED],
        SalesOrderStatus.CONFIRMED: [SalesOrderStatus.CANCELLED, SalesOrderStatus.PARTIALLY_SHIPPED],
        SalesOrderStatus.PARTIALLY_SHIPPED: [SalesOrderStatus.CANCELLED, SalesOrderStatus.SHIPPED],
    }

    if new_status not in valid_transitions.get(current_status, []):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"No se puede cambiar el estado de '{current_status.value}' a '{new_status.value}'.")

    update_operation = {"$set": {"status": new_status.value, "updated_at": datetime.now(timezone.utc)}}
    
    if await so_repo.execute_update_one_by_id(order_id, update_operation) == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Venta no pudo ser actualizada.")

    return await get_sales_order_by_id(database, order_id)

# ==============================================================================
# SECCIÓN 5: SERVICIO PARA DESPACHOS (SHIPMENT)
# ==============================================================================

async def create_shipment_from_sales_order(
    database: AsyncIOMotorDatabase, 
    order_id: str, 
    shipment_data: ShipmentCreate, 
    current_user: UserOut
) -> ShipmentOut:
    """Crea un despacho a partir de una orden de venta de forma transaccional."""
    so_repo = SalesOrderRepository(database)
    shipment_repo = ShipmentRepository(database)
    inserted_id = None
    
    async with await database.client.start_session() as session:
        try:
            async with session.start_transaction():
                order_doc = await so_repo.find_one_by_id(order_id, session=session)
                if not order_doc:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Venta no existe.")

                order_status = SalesOrderStatus(order_doc.get("status"))
                if order_status not in [SalesOrderStatus.CONFIRMED, SalesOrderStatus.PARTIALLY_SHIPPED]:
                    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"No se puede despachar una orden en estado '{order_status.value}'.")
                
                customer_id_from_order = order_doc.get("customer_id")
                if not customer_id_from_order:
                    raise ValueError("La orden de venta no tiene un cliente asociado.")

                shipment_number = await _generate_sequential_number(shipment_repo, "DS", session=session)
                shipping_datetime = datetime.combine(shipment_data.shipping_date, datetime.min.time(), tzinfo=timezone.utc)

                shipment_to_db = ShipmentInDB(
                    **shipment_data.model_dump(exclude={'shipping_date'}), 
                    shipment_number=shipment_number, 
                    sales_order_id=PyObjectId(order_id), 
                    customer_id=customer_id_from_order, 
                    created_by_id=current_user.id,
                    shipping_date=shipping_datetime
                )

                shipment_doc_to_insert = shipment_to_db.model_dump(by_alias=True, exclude={'id'})
                shipment_doc_to_insert['_id'] = shipment_to_db.id
                
                inserted_id = await shipment_repo.insert_one(shipment_doc_to_insert, session=session)
                
                for item in shipment_to_db.items:
                    await inventory_service.decrease_stock(database, product_id=str(item.product_id), quantity_to_decrease=item.quantity_shipped, session=session)
                
        except Exception as e:
            logger.error(f"Error durante la transacción de creación de despacho para la OV ID {order_id}. Revirtiendo cambios. Error: {e}", exc_info=True)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ocurrió un error inesperado al procesar el despacho. La operación ha sido revertida.")

    if not inserted_id:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No se pudo obtener el ID del despacho creado después de la transacción.")

    return await get_shipment_by_id(database, str(inserted_id))

async def get_shipment_by_id(database: AsyncIOMotorDatabase, shipment_id: str) -> ShipmentOut:
    """Obtiene un único despacho por su ID, poblando todos sus detalles."""
    shipment_repo = ShipmentRepository(database)
    shipment_doc = await shipment_repo.find_one_by_id(shipment_id)
    if not shipment_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Despacho con ID '{shipment_id}' no encontrado.")
    
    return await _populate_document_details(database, shipment_doc, ShipmentOut)

async def get_shipments_paginated(
    database: AsyncIOMotorDatabase, 
    page: int, 
    page_size: int, 
    search: Optional[str]
) -> Dict[str, Any]:
    """Obtiene una lista paginada de despachos con filtros."""
    shipment_repo = ShipmentRepository(database)
    query_filter: Dict[str, Any] = {}
    if search: 
        query_filter["shipment_number"] = {"$regex": search, "$options": "i"}
    
    total_count = await shipment_repo.count_documents(query_filter)
    shipment_docs = await shipment_repo.find_all_paginated(
        query_filter, 
        (page - 1) * page_size, 
        page_size, 
        [("shipping_date", DESCENDING)]
    )
    
    populated_items = [await _populate_document_details(database, doc, ShipmentOut) for doc in shipment_docs]
        
    return {"total_count": total_count, "items": populated_items}

# ==============================================================================
# SECCIÓN 6: SERVICIO PARA FACTURAS DE VENTA (SALES INVOICE)
# ==============================================================================

async def create_invoice_from_shipments(
    database: AsyncIOMotorDatabase, 
    invoice_data: SalesInvoiceCreate, 
    current_user: UserOut
) -> Any:
    """Crea una factura a partir de uno o más despachos, consolidando los ítems."""
    raise NotImplementedError("La creación de facturas aún no está implementada.")