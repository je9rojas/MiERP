# /backend/app/modules/sales/sales_service.py

"""
Capa de Servicio para la lógica de negocio del módulo de Ventas.

Este módulo orquesta las operaciones del flujo "Order-to-Cash":
1.  Creación y gestión de Órdenes de Venta (SalesOrder).
2.  Creación y procesamiento de Despachos (Shipment).
3.  Creación de Facturas de Venta (SalesInvoice).
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status
from pymongo import DESCENDING
from collections import defaultdict
import asyncio
import logging

# Repositorios
from .repositories.sales_repository import SalesOrderRepository
from .repositories.shipment_repository import ShipmentRepository
from .repositories.sales_invoice_repository import SalesInvoiceRepository
from app.modules.inventory.repositories.product_repository import ProductRepository
from app.modules.crm.repositories.customer_repository import CustomerRepository

# Modelos
from app.modules.users.user_models import UserOut
from .sales_models import (
    SalesOrderCreate, SalesOrderItem, SalesOrderInDB, SalesOrderOut, SalesOrderStatus,
    ShipmentCreate, ShipmentInDB, ShipmentOut, ShipmentItem,
    SalesInvoiceCreate, SalesInvoiceInDB, SalesInvoiceOut, SalesInvoiceItem
)
from app.modules.crm.customer_models import CustomerOut, DocumentType
from app.models.shared import PyObjectId

# Servicios
from app.modules.inventory import inventory_service

logger = logging.getLogger(__name__)

# ==============================================================================
# SECCIÓN 2: FUNCIONES DE AYUDA PRIVADAS
# ==============================================================================

async def _generate_sequential_number(repo, prefix: str) -> str:
    field_map = {"OV": "order_number", "DS": "shipment_number", "FV": "invoice_number"}
    field_name = field_map.get(prefix, "number")
    current_year = datetime.now(timezone.utc).year
    last_doc = await repo.find_one_sorted([("created_at", DESCENDING)])
    new_seq_num = 1
    if last_doc and (last_doc_number := last_doc.get(field_name)):
        try:
            parts = last_doc_number.split('-')
            year_from_doc = int(parts[1])
            if year_from_doc == current_year:
                new_seq_num = int(parts[2]) + 1
        except (ValueError, IndexError, TypeError):
            pass
    return f"{prefix}-{current_year}-{str(new_seq_num).zfill(5)}"

# ==============================================================================
# SECCIÓN 3: SERVICIO PARA ÓRDENES DE VENTA (SALES ORDER)
# ==============================================================================

async def create_sales_order(db: AsyncIOMotorDatabase, so_data: SalesOrderCreate, user: UserOut) -> SalesOrderOut:
    so_repo = SalesOrderRepository(db)
    customer_repo = CustomerRepository(db)
    product_repo = ProductRepository(db)
    
    if not await customer_repo.find_by_id(str(so_data.customer_id)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El cliente especificado no existe.")

    enriched_items = []
    total_amount = 0.0

    # --- OPTIMIZACIÓN DE RENDIMIENTO ---
    # Se obtienen todos los productos necesarios en una sola consulta a la BD.
    product_ids = [str(item.product_id) for item in so_data.items]
    products = await product_repo.find_by_ids(product_ids)
    product_map = {str(p["_id"]): p for p in products}

    for item_in in so_data.items:
        product_doc = product_map.get(str(item_in.product_id))
        if not product_doc or not product_doc.get("is_active"):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"El producto con ID '{item_in.product_id}' no existe o está inactivo.")
        
        item_subtotal = item_in.quantity * item_in.unit_price
        total_amount += item_subtotal
        
        enriched_items.append(SalesOrderItem(
            **item_in.model_dump(),
            sku=product_doc.get("sku", "N/A"),
            name=product_doc.get("name", "Producto no encontrado"),
            subtotal=round(item_subtotal, 2)
        ))

    so_to_db = SalesOrderInDB(
        **so_data.model_dump(exclude={"items"}),
        order_number=await _generate_sequential_number(so_repo, "OV"),
        created_by_id=user.id,
        items=enriched_items,
        total_amount=round(total_amount, 2)
    )

    # --- CORRECCIÓN CRÍTICA PARA INSERCIÓN ---
    # Se crea el diccionario para MongoDB, asegurando que `_id` sea un ObjectId.
    document_to_insert = so_to_db.model_dump(by_alias=True, exclude={'id'})
    document_to_insert['_id'] = so_to_db.id
    
    inserted_id = await so_repo.insert_one(document_to_insert)
    return await get_sales_order_by_id(db, str(inserted_id))

async def get_sales_order_by_id(db: AsyncIOMotorDatabase, order_id: str) -> SalesOrderOut:
    so_repo = SalesOrderRepository(db)
    order_doc = await so_repo.find_by_id(order_id)
    if not order_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Orden de Venta con ID '{order_id}' no encontrada.")

    customer_repo = CustomerRepository(db)
    customer_id = order_doc.get("customer_id")
    customer_doc = await customer_repo.find_by_id(str(customer_id)) if customer_id else None
    
    # Se asegura de que 'customer' siempre sea un objeto válido para Pydantic
    order_doc["customer"] = customer_doc or {
        # Se necesita un ID válido para PyObjectId, incluso si es un placeholder
        "id": PyObjectId("000000000000000000000000"), 
        "doc_type": DocumentType.OTHER,
        "doc_number": "N/A",
        "business_name": "Cliente Eliminado o Inválido",
    }
    return SalesOrderOut.model_validate(order_doc)

async def get_sales_orders_paginated(db: AsyncIOMotorDatabase, page: int, page_size: int, search: Optional[str], status: Optional[SalesOrderStatus]) -> Dict[str, Any]:
    so_repo = SalesOrderRepository(db)
    query: Dict[str, Any] = {}
    if search:
        query["order_number"] = {"$regex": search, "$options": "i"}
    if status:
        query["status"] = status.value
    total_count = await so_repo.count_documents(query)
    skip = (page - 1) * page_size
    sort_options = [("order_date", DESCENDING)]
    so_docs = await so_repo.find_all_paginated(query, skip, page_size, sort_options)
    
    # Se optimiza la población de datos para evitar N+1 queries.
    customer_ids = {str(doc.get("customer_id")) for doc in so_docs if doc.get("customer_id")}
    customer_repo = CustomerRepository(db)
    customers = {str(c['_id']): c for c in await customer_repo.find_by_ids(list(customer_ids))}

    populated_items = []
    for doc in so_docs:
        customer_data = customers.get(str(doc.get("customer_id")))
        doc["customer"] = customer_data or {
            "id": PyObjectId("000000000000000000000000"),
            "doc_type": DocumentType.OTHER, "doc_number": "N/A", "business_name": "Cliente Desconocido"
        }
        populated_items.append(SalesOrderOut.model_validate(doc))
        
    return {"total_count": total_count, "items": populated_items}

async def update_sales_order_status(db: AsyncIOMotorDatabase, order_id: str, new_status: SalesOrderStatus) -> SalesOrderOut:
    so_repo = SalesOrderRepository(db)
    order_doc = await so_repo.find_by_id(order_id)
    if not order_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Venta no existe.")
    
    current_status = SalesOrderStatus(order_doc.get('status'))
    valid_transitions = {
        SalesOrderStatus.DRAFT: [SalesOrderStatus.CONFIRMED, SalesOrderStatus.CANCELLED],
        SalesOrderStatus.CONFIRMED: [SalesOrderStatus.CANCELLED],
    }
    if new_status not in valid_transitions.get(current_status, []):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"No se puede cambiar el estado de '{current_status.value}' a '{new_status.value}'.")

    update_data = {"$set": {"status": new_status.value, "updated_at": datetime.now(timezone.utc)}}
    await so_repo.update_one_by_id(order_id, update_data)
    return await get_sales_order_by_id(db, order_id)

# ==============================================================================
# SECCIÓN 4: SERVICIO PARA DESPACHOS (SHIPMENT)
# ==============================================================================

# (Se mantiene tu lógica existente para Despachos, aplicando el patrón de inserción correcto)
async def create_shipment_from_sales_order(db: AsyncIOMotorDatabase, so_id: str, shipment_data: ShipmentCreate, user: UserOut) -> ShipmentOut:
    # ... tu lógica ...
    # Asegúrate de que la inserción del shipment siga el mismo patrón:
    # doc_to_insert = shipment_to_db.model_dump(...)
    # doc_to_insert['_id'] = shipment_to_db.id
    # await shipment_repo.insert_one(doc_to_insert, session=session)
    pass # Reemplaza con tu lógica completa y el patrón de inserción correcto

# ==============================================================================
# SECCIÓN 5: SERVICIO PARA FACTURAS DE VENTA (SALES INVOICE)
# ==============================================================================

# (Se mantiene tu lógica existente para Facturas, aplicando el patrón de inserción correcto)
async def create_invoice_from_shipments(db: AsyncIOMotorDatabase, so_id: str, invoice_data: SalesInvoiceCreate, user: UserOut) -> SalesInvoiceOut:
    # ... tu lógica ...
    # Asegúrate de que la inserción de la factura siga el mismo patrón:
    # doc_to_insert = invoice_to_db.model_dump(...)
    # doc_to_insert['_id'] = invoice_to_db.id
    # await invoice_repo.insert_one(doc_to_insert, session=session)
    pass # Reemplaza con tu lógica completa y el patrón de inserción correcto