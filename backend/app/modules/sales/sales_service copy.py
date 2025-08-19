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
    SalesOrderCreate, SalesOrderItemCreate, SalesOrderItem, SalesOrderInDB, SalesOrderOut, SalesOrderStatus,
    ShipmentCreate, ShipmentInDB, ShipmentOut, ShipmentItem,
    SalesInvoiceCreate, SalesInvoiceInDB, SalesInvoiceOut, SalesInvoiceItem
)
from app.modules.crm.customer_models import CustomerOut, DocumentType

# Servicios
from app.modules.inventory import inventory_service

logger = logging.getLogger(__name__)

# ==============================================================================
# SECCIÓN 2: FUNCIONES DE AYUDA PRIVADAS
# ==============================================================================
# ... (Sin cambios)
async def _generate_sequential_number(repo, prefix: str) -> str:
    field_map = {"OV": "order_number", "DS": "shipment_number", "FV": "invoice_number"}
    field_name = field_map.get(prefix, "number")
    last_doc = await repo.find_one_sorted([("created_at", DESCENDING)])
    if last_doc and last_doc.get(field_name, "").startswith(f"{prefix}-"):
        try:
            last_num = int(last_doc[field_name].split('-')[-1])
            return f"{prefix}-{datetime.now().year}-{str(last_num + 1).zfill(5)}"
        except (ValueError, IndexError):
            pass
    return f"{prefix}-{datetime.now().year}-{'1'.zfill(5)}"

# ==============================================================================
# SECCIÓN 3: SERVICIO PARA ÓRDENES DE VENTA (SALES ORDER)
# ==============================================================================
# ... (Sin cambios en create, get by id, get paginated, update status)
async def create_sales_order(db: AsyncIOMotorDatabase, so_data: SalesOrderCreate, user: UserOut) -> SalesOrderOut:
    so_repo = SalesOrderRepository(db)
    customer_repo = CustomerRepository(db)
    product_repo = ProductRepository(db)
    customer_doc = await customer_repo.find_by_id(str(so_data.customer_id))
    if not customer_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El cliente especificado no existe.")
    enriched_items = []
    total_amount = 0.0
    for item_in in so_data.items:
        product_doc = await product_repo.find_by_id(str(item_in.product_id))
        if not product_doc or not product_doc.get("is_active"):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"El producto con ID '{item_in.product_id}' no existe o está inactivo.")
        item_subtotal = item_in.quantity * item_in.unit_price
        total_amount += item_subtotal
        enriched_items.append(SalesOrderItem(**item_in.model_dump(), sku=product_doc.get("sku", "N/A"), name=product_doc.get("name", "Producto no encontrado"), subtotal=round(item_subtotal, 2)))
    so_to_db = SalesOrderInDB(**so_data.model_dump(exclude={"items"}), order_number=await _generate_sequential_number(so_repo, "OV"), created_by_id=user.id, items=enriched_items, total_amount=round(total_amount, 2))
    inserted_id = await so_repo.insert_one(so_to_db.model_dump(by_alias=True))
    return await get_sales_order_by_id(db, str(inserted_id))

async def get_sales_order_by_id(db: AsyncIOMotorDatabase, order_id: str) -> SalesOrderOut:
    so_repo = SalesOrderRepository(db)
    order_doc = await so_repo.find_by_id(order_id)
    if not order_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Orden de Venta con ID '{order_id}' no encontrada.")
    customer_repo = CustomerRepository(db)
    customer_id = order_doc.get("customer_id")
    customer_doc = await customer_repo.find_by_id(str(customer_id)) if customer_id else None
    customer_out = CustomerOut.model_validate(customer_doc) if customer_doc else CustomerOut(doc_type=DocumentType.OTHER, doc_number="N/A", business_name="Cliente Eliminado o Inválido")
    return SalesOrderOut.model_validate({**order_doc, "customer": customer_out})

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
    tasks = [get_sales_order_by_id(db, str(doc["_id"])) for doc in so_docs]
    populated_items = await asyncio.gather(*tasks)
    return {"total_count": total_count, "items": populated_items}

async def update_sales_order_status(db: AsyncIOMotorDatabase, order_id: str, new_status: SalesOrderStatus) -> SalesOrderOut:
    so_repo = SalesOrderRepository(db)
    order_doc = await so_repo.find_by_id(order_id)
    if not order_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Venta no existe.")
    current_status = order_doc.get('status')
    if current_status == SalesOrderStatus.DRAFT and new_status == SalesOrderStatus.CONFIRMED:
        update_data = {"status": new_status, "updated_at": datetime.now(timezone.utc)}
        await so_repo.update_one_by_id(order_id, update_data)
    else:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"No se puede cambiar el estado de '{current_status}' a '{new_status.value}'.")
    return await get_sales_order_by_id(db, order_id)

# ==============================================================================
# SECCIÓN 4: SERVICIO PARA DESPACHOS (SHIPMENT)
# ==============================================================================
# ... (Sin cambios en esta sección)
async def _get_new_so_status_after_shipment(db: AsyncIOMotorDatabase, so_id: str) -> SalesOrderStatus:
    so_repo = SalesOrderRepository(db)
    shipment_repo = ShipmentRepository(db)
    so_doc_raw = await so_repo.find_by_id(so_id)
    so_doc = SalesOrderInDB.model_validate(so_doc_raw)
    all_shipments_docs = await shipment_repo.find_all_by_sales_order_id(str(so_doc.id))
    total_shipped_per_product = defaultdict(int)
    for shipment in all_shipments_docs:
        for item in shipment.get("items", []):
            total_shipped_per_product[str(item.get("product_id"))] += item.get("quantity_shipped", 0)
    is_fully_shipped = True
    for so_item in so_doc.items:
        if total_shipped_per_product.get(str(so_item.product_id), 0) < so_item.quantity:
            is_fully_shipped = False
            break
    return SalesOrderStatus.FULLY_SHIPPED if is_fully_shipped else SalesOrderStatus.PARTIALLY_SHIPPED

async def create_shipment_from_sales_order(db: AsyncIOMotorDatabase, so_id: str, shipment_data: ShipmentCreate, user: UserOut) -> ShipmentOut:
    so_repo = SalesOrderRepository(db)
    shipment_repo = ShipmentRepository(db)
    client = db.client
    async with await client.start_session() as session:
        async with session.start_transaction():
            so_doc_raw = await so_repo.find_by_id(so_id, session=session)
            if not so_doc_raw:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Venta de origen no existe.")
            so_doc = SalesOrderInDB.model_validate(so_doc_raw)
            if so_doc.status not in [SalesOrderStatus.CONFIRMED, SalesOrderStatus.PARTIALLY_SHIPPED]:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Solo se pueden despachar órdenes en estado 'Confirmado' o 'Parcialmente Despachado'.")
            shipment_to_db = ShipmentInDB(**shipment_data.model_dump(), shipment_number=await _generate_sequential_number(shipment_repo, "DS"), sales_order_id=so_doc.id, customer_id=so_doc.customer_id, created_by_id=user.id)
            items_to_dispatch = [SalesOrderItem(**item.model_dump()) for item in shipment_data.items]
            await inventory_service.dispatch_stock_for_sale(db, items_to_dispatch, session=session)
            inserted_id = await shipment_repo.insert_one(shipment_to_db.model_dump(by_alias=True), session=session)
            new_so_status = await _get_new_so_status_after_shipment(db, so_id)
            update_so_data = {"status": new_so_status, "updated_at": datetime.now(timezone.utc), "shipment_ids": so_doc.shipment_ids + [inserted_id]}
            await so_repo.update_one_by_id(so_id, update_so_data, session=session)
    shipment_doc = await shipment_repo.find_by_id(str(inserted_id))
    customer_doc = await CustomerRepository(db).find_by_id(str(shipment_doc.get("customer_id")))
    shipment_doc["customer"] = customer_doc
    return ShipmentOut.model_validate(shipment_doc)

# ==============================================================================
# SECCIÓN 5: SERVICIO PARA FACTURAS DE VENTA (SALES INVOICE)
# ==============================================================================

async def create_invoice_from_shipments(db: AsyncIOMotorDatabase, so_id: str, invoice_data: SalesInvoiceCreate, user: UserOut) -> SalesInvoiceOut:
    """
    Crea una Factura de Venta a partir de los despachos de una Orden de Venta.
    Esta operación es transaccional.
    """
    so_repo = SalesOrderRepository(db)
    shipment_repo = ShipmentRepository(db)
    invoice_repo = SalesInvoiceRepository(db)
    client = db.client
    
    async with await client.start_session() as session:
        async with session.start_transaction():
            so_doc_raw = await so_repo.find_by_id(so_id, session=session)
            if not so_doc_raw:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Venta de origen no existe.")
            so_doc = SalesOrderInDB.model_validate(so_doc_raw)
            
            # TODO: Idealmente, se recibiría una lista de shipment_ids para facturar.
            # Por ahora, facturaremos todos los despachos asociados a la OV.
            shipments_to_invoice = await shipment_repo.find_all_by_sales_order_id(so_id, session=session)
            if not shipments_to_invoice:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontraron despachos para facturar para esta orden.")

            # TODO: Añadir lógica para evitar facturar despachos que ya han sido facturados.

            invoice_items = []
            total_invoice_amount = 0.0
            
            # Se busca el precio en la Orden de Venta original para "congelarlo"
            product_prices = {str(item.product_id): item.unit_price for item in so_doc.items}

            # Consolidar ítems de todos los despachos
            for shipment in shipments_to_invoice:
                for item in shipment.get("items", []):
                    unit_price = product_prices.get(str(item.get("product_id")), 0.0)
                    subtotal = item.get("quantity_shipped", 0) * unit_price
                    total_invoice_amount += subtotal
                    invoice_items.append(SalesInvoiceItem(
                        product_id=item.get("product_id"),
                        sku=item.get("sku"),
                        name=item.get("name"),
                        quantity=item.get("quantity_shipped"),
                        unit_price=unit_price,
                        subtotal=round(subtotal, 2)
                    ))

            if not invoice_items:
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No hay ítems con cantidad > 0 en los despachos para facturar.")

            invoice_to_db = SalesInvoiceInDB(
                **invoice_data.model_dump(),
                invoice_number=await _generate_sequential_number(invoice_repo, "FV"),
                sales_order_id=so_doc.id,
                customer_id=so_doc.customer_id,
                created_by_id=user.id,
                items=invoice_items,
                total_amount=round(total_invoice_amount, 2)
            )

            inserted_id = await invoice_repo.insert_one(invoice_to_db.model_dump(by_alias=True), session=session)
            
            # Actualizar la Orden de Venta con el ID de la factura y nuevo estado
            update_so_data = {
                "status": SalesOrderStatus.INVOICED,
                "updated_at": datetime.now(timezone.utc),
                "invoice_ids": so_doc.invoice_ids + [inserted_id]
            }
            await so_repo.update_one_by_id(so_id, update_so_data, session=session)
            
    # Devolver la factura recién creada, enriquecida
    invoice_doc = await invoice_repo.find_by_id(str(inserted_id))
    customer_doc = await CustomerRepository(db).find_by_id(str(invoice_doc.get("customer_id")))
    invoice_doc["customer"] = customer_doc
    
    return SalesInvoiceOut.model_validate(invoice_doc)