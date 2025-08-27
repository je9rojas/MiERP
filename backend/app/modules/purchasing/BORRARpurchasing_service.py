# File: /backend/app/modules/purchasing/purchasing_service.py

"""
Capa de Servicio para la lógica de negocio del módulo de Compras (Purchasing).

Este módulo actúa como orquestador del flujo "Procure-to-Pay", coordinando las
operaciones entre los repositorios y otros servicios. La lógica de negocio
compleja, como la validación de transiciones de estado, el enriquecimiento de
datos y las operaciones transaccionales, reside aquí.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

import logging
from collections import defaultdict
from datetime import datetime, timezone, date, time
from typing import Any, Dict, List, Optional, Type

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorClientSession, AsyncIOMotorDatabase
from pydantic import BaseModel
from pymongo import DESCENDING

from app.models.shared import PyObjectId
from app.modules.crm.repositories.supplier_repository import SupplierRepository
from app.modules.crm.supplier_models import SupplierOut
from app.modules.inventory import inventory_service
from app.modules.inventory.repositories.product_repository import ProductRepository
from app.modules.users.user_models import UserOut
from .purchasing_models import (
    GoodsReceiptCreate, GoodsReceiptInDB, GoodsReceiptOut, PurchaseBillCreate,
    PurchaseBillInDB, PurchaseBillOut, PurchaseOrderCreate, PurchaseOrderItem,
    PurchaseOrderInDB, PurchaseOrderOut, PurchaseOrderStatus, PurchaseOrderUpdate
)
from .repositories.goods_receipt_repository import GoodsReceiptRepository
from .repositories.purchase_bill_repository import PurchaseBillRepository
from .repositories.purchase_order_repository import PurchaseOrderRepository

# ==============================================================================
# SECCIÓN 2: CONFIGURACIÓN DEL LOGGER
# ==============================================================================

logger = logging.getLogger(__name__)

# ==============================================================================
# SECCIÓN 3: FUNCIONES DE AYUDA PRIVADAS
# ==============================================================================

async def _generate_sequential_number(repository: Any, prefix: str) -> str:
    field_map = {"OC": "order_number", "RM": "receipt_number", "FC": "bill_number"}
    field_name = field_map[prefix]
    current_year = datetime.now(timezone.utc).year
    last_document = await repository.find_one_sorted([("created_at", DESCENDING)])
    new_sequence_number = 1

    if last_document and (last_doc_num := last_document.get(field_name)):
        try:
            parts = last_doc_num.split('-')
            if int(parts[1]) == current_year:
                new_sequence_number = int(parts[2]) + 1
        except (ValueError, IndexError):
            logger.warning(f"No se pudo parsear '{last_doc_num}'. Se reinicia secuencia.")
            
    return f"{prefix}-{current_year}-{str(new_sequence_number).zfill(5)}"

async def _populate_documents_with_suppliers(
    database: AsyncIOMotorDatabase,
    documents: List[Dict[str, Any]],
    PydanticOutModel: Type[BaseModel]
) -> List[BaseModel]:
    """
    Enriquece una lista de documentos con los datos completos de sus proveedores.
    """
    supplier_ids = {str(doc["supplier_id"]) for doc in documents if doc.get("supplier_id")}
    if not supplier_ids:
        return [PydanticOutModel.model_validate(doc) for doc in documents]

    supplier_repository = SupplierRepository(database)
    suppliers_list = await supplier_repository.find_by_ids(list(supplier_ids))
    
    suppliers_map = {
        str(supplier['_id']): SupplierOut.model_validate(supplier)
        for supplier in suppliers_list
    }

    populated_items = []
    for doc in documents:
        supplier_object = suppliers_map.get(str(doc.get("supplier_id")))
        
        populated_doc = doc.copy()
        populated_doc["supplier"] = supplier_object
        
        populated_items.append(PydanticOutModel.model_validate(populated_doc))
            
    return populated_items

# ==============================================================================
# SECCIÓN 4: SERVICIOS PARA ÓRDENES DE COMPRA (PURCHASE ORDER)
# ==============================================================================

async def create_purchase_order(database: AsyncIOMotorDatabase, order_data: PurchaseOrderCreate, current_user: UserOut) -> PurchaseOrderOut:
    purchase_order_repo = PurchaseOrderRepository(database)
    supplier_repo = SupplierRepository(database)
    product_repo = ProductRepository(database)

    # --- INICIO DE LA CORRECCIÓN ---
    # Se corrige el nombre del método para que coincida con el del repositorio.
    if not await supplier_repo.find_by_id(str(order_data.supplier_id)):
    # --- FIN DE LA CORRECCIÓN ---
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El proveedor especificado no existe.")

    enriched_items, total_amount = [], 0.0
    product_ids = [str(item.product_id) for item in order_data.items]
    products_from_db = await product_repo.find_by_ids(product_ids)
    product_map = {str(p["_id"]): p for p in products_from_db}

    for item_data in order_data.items:
        product_doc = product_map.get(str(item_data.product_id))
        if not product_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con ID '{item_data.product_id}' no encontrado.")
        
        total_amount += item_data.quantity_ordered * item_data.unit_cost
        enriched_items.append(PurchaseOrderItem(
            **item_data.model_dump(),
            sku=product_doc.get("sku", "N/A"),
            name=product_doc.get("name", "N/A")
        ))
    
    order_datetime = datetime.combine(order_data.order_date, time.min, tzinfo=timezone.utc)
    delivery_datetime = None
    if order_data.expected_delivery_date:
        delivery_datetime = datetime.combine(order_data.expected_delivery_date, time.min, tzinfo=timezone.utc)

    order_to_db = PurchaseOrderInDB(
        **order_data.model_dump(exclude={"items", "order_date", "expected_delivery_date"}),
        order_number=await _generate_sequential_number(purchase_order_repo, "OC"),
        created_by_id=current_user.id,
        items=enriched_items,
        total_amount=round(total_amount, 2),
        order_date=order_datetime,
        expected_delivery_date=delivery_datetime
    )
    document_to_insert = order_to_db.model_dump(by_alias=True, exclude={'id'})
    
    inserted_id = await purchase_order_repo.insert_one(document_to_insert)
    return await get_purchase_order_by_id(database, str(inserted_id))

async def update_purchase_order(database: AsyncIOMotorDatabase, order_id: str, update_data: PurchaseOrderUpdate) -> PurchaseOrderOut:
    purchase_order_repo = PurchaseOrderRepository(database)
    product_repo = ProductRepository(database)

    order_doc = await purchase_order_repo.find_one_by_id(order_id)
    if not order_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Compra no existe.")
    
    if order_doc.get("status") != PurchaseOrderStatus.DRAFT.value:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Solo se pueden editar Órdenes de Compra en estado 'borrador'.")

    update_payload = update_data.model_dump(exclude_unset=True)

    delivery_date = update_payload.get("expected_delivery_date")
    if delivery_date is not None:
        if isinstance(delivery_date, date) and not isinstance(delivery_date, datetime):
            update_payload["expected_delivery_date"] = datetime.combine(delivery_date, time.min, tzinfo=timezone.utc)
        elif isinstance(delivery_date, datetime) and delivery_date.tzinfo is None:
            update_payload["expected_delivery_date"] = delivery_date.replace(tzinfo=timezone.utc)

    if "items" in update_payload:
        enriched_items, total_amount = [], 0.0
        product_ids = [str(item['product_id']) for item in update_payload.get("items", [])]
        products_from_db = await product_repo.find_by_ids(product_ids)
        product_map = {str(p["_id"]): p for p in products_from_db}

        for item_data in update_payload.get("items", []):
            product_doc = product_map.get(str(item_data['product_id']))
            if not product_doc:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con ID '{item_data['product_id']}' no encontrado.")
            
            total_amount += item_data['quantity_ordered'] * item_data['unit_cost']
            item_data['sku'] = product_doc.get("sku", "N/A")
            item_data['name'] = product_doc.get("name", "N/A")
            enriched_items.append(item_data)
        
        update_payload["items"] = enriched_items
        update_payload["total_amount"] = round(total_amount, 2)

    update_payload["updated_at"] = datetime.now(timezone.utc)
    
    update_operation = {"$set": update_payload}
    await purchase_order_repo.execute_update_one_by_id(order_id, update_operation)

    return await get_purchase_order_by_id(database, order_id)

async def get_purchase_order_by_id(database: AsyncIOMotorDatabase, order_id: str) -> PurchaseOrderOut:
    po_repo = PurchaseOrderRepository(database)
    order_doc = await po_repo.find_one_by_id(order_id)
    if not order_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Orden de Compra con ID '{order_id}' no encontrada.")
    
    populated_list = await _populate_documents_with_suppliers(database, [order_doc], PurchaseOrderOut)
    return populated_list[0]

async def get_purchase_orders_paginated(database: AsyncIOMotorDatabase, page: int, page_size: int, search: Optional[str]) -> Dict[str, Any]:
    po_repo = PurchaseOrderRepository(database)
    query: Dict[str, Any] = {}
    if search:
        supplier_repo = SupplierRepository(database)
        supplier_ids = await supplier_repo.find_ids_by_name(search)
        query["$or"] = [{"order_number": {"$regex": search, "$options": "i"}}, {"supplier_id": {"$in": supplier_ids}}]
        
    total_count = await po_repo.count_documents(query)
    order_docs = await po_repo.find_all_paginated(query, (page - 1) * page_size, page_size, [("order_date", DESCENDING)])
    populated_items = await _populate_documents_with_suppliers(database, order_docs, PurchaseOrderOut)
    return {"total_count": total_count, "items": populated_items}

async def update_purchase_order_status(database: AsyncIOMotorDatabase, order_id: str, new_status: PurchaseOrderStatus) -> PurchaseOrderOut:
    po_repo = PurchaseOrderRepository(database)
    po_doc = await po_repo.find_one_by_id(order_id)
    if not po_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Compra no existe.")
    
    current_status = PurchaseOrderStatus(po_doc.get('status'))
    valid_transitions: Dict[PurchaseOrderStatus, List[PurchaseOrderStatus]] = {
        PurchaseOrderStatus.DRAFT: [PurchaseOrderStatus.CONFIRMED, PurchaseOrderStatus.CANCELLED],
        PurchaseOrderStatus.CONFIRMED: [PurchaseOrderStatus.CANCELLED],
    }
    if new_status not in valid_transitions.get(current_status, []):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"No se puede cambiar el estado de '{current_status.value}' a '{new_status.value}'.")
    
    update_payload = {"$set": {"status": new_status.value, "updated_at": datetime.now(timezone.utc)}}
    await po_repo.execute_update_one_by_id(order_id, update_payload)
    return await get_purchase_order_by_id(database, order_id)

# ==============================================================================
# SECCIÓN 5: SERVICIOS PARA RECEPCIÓN DE MERCANCÍA (GOODS RECEIPT)
# ==============================================================================

async def _get_new_po_status_after_receipt(
    database: AsyncIOMotorDatabase,
    po_id: PyObjectId,
    session: Optional[AsyncIOMotorClientSession] = None
) -> PurchaseOrderStatus:
    po_repo = PurchaseOrderRepository(database)
    receipt_repo = GoodsReceiptRepository(database)
    
    po_doc = await po_repo.find_one_by_id(str(po_id), session=session)
    if not po_doc:
        raise ValueError(f"Orden de Compra con ID {po_id} no encontrada durante recálculo de estado.")
    
    all_receipts = await receipt_repo.find_all_by_purchase_order_id(str(po_id), session=session)
    
    total_received = defaultdict(int)
    for receipt in all_receipts:
        for item in receipt.get("items", []):
            total_received[str(item.get("product_id"))] += item.get("quantity_received", 0)
    
    is_fully_received = all(
        total_received.get(str(po_item["product_id"]), 0) >= po_item["quantity_ordered"]
        for po_item in po_doc["items"]
    )
    return PurchaseOrderStatus.FULLY_RECEIVED if is_fully_received else PurchaseOrderStatus.PARTIALLY_RECEIVED

async def create_goods_receipt(database: AsyncIOMotorDatabase, receipt_data: GoodsReceiptCreate, current_user: UserOut) -> GoodsReceiptOut:
    po_repo = PurchaseOrderRepository(database)
    receipt_repo = GoodsReceiptRepository(database)
    inserted_id = None

    async with await database.client.start_session() as session:
        async with session.start_transaction():
            po_doc = await po_repo.find_one_by_id(str(receipt_data.purchase_order_id), session=session)
            if not po_doc:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La OC de origen no existe.")
            
            po_status = PurchaseOrderStatus(po_doc.get("status"))
            if po_status not in [PurchaseOrderStatus.CONFIRMED, PurchaseOrderStatus.PARTIALLY_RECEIVED]:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Solo se pueden recibir órdenes 'Confirmadas' o 'Parcialmente Recibidas'.")

            receipt_to_db = GoodsReceiptInDB(
                **receipt_data.model_dump(),
                receipt_number=await _generate_sequential_number(receipt_repo, "RM"),
                supplier_id=po_doc["supplier_id"],
                created_by_id=current_user.id
            )
            doc_to_insert = receipt_to_db.model_dump(by_alias=True, exclude={'id'})
            inserted_id = await receipt_repo.insert_one(doc_to_insert, session=session)
            
            await inventory_service.add_stock_from_goods_receipt(
                database=database, receipt=receipt_to_db, purchase_order_doc=po_doc, session=session
            )
            
            new_po_status = await _get_new_po_status_after_receipt(database, po_doc["_id"], session=session)
            
            update_op = {
                "$set": {"status": new_po_status.value, "updated_at": datetime.now(timezone.utc)},
                "$push": {"receipt_ids": inserted_id}
            }
            await po_repo.execute_update_one_by_id(str(po_doc["_id"]), update_op, session=session)
    
    if not inserted_id:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No se pudo crear la recepción.")
        
    return await get_goods_receipt_by_id(database, str(inserted_id))

async def get_goods_receipt_by_id(database: AsyncIOMotorDatabase, receipt_id: str) -> GoodsReceiptOut:
    repo = GoodsReceiptRepository(database)
    doc = await repo.find_one_by_id(receipt_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Recepción ID '{receipt_id}' no encontrada.")
    
    populated_list = await _populate_documents_with_suppliers(database, [doc], GoodsReceiptOut)
    return populated_list[0]

async def get_goods_receipts_paginated(database: AsyncIOMotorDatabase, page: int, page_size: int, search: Optional[str]) -> Dict[str, Any]:
    repo = GoodsReceiptRepository(database)
    query = {"receipt_number": {"$regex": search, "$options": "i"}} if search else {}
    
    total_count = await repo.count_documents(query)
    docs = await repo.find_all_paginated(query, (page - 1) * page_size, page_size, [("received_date", DESCENDING)])
    items = await _populate_documents_with_suppliers(database, docs, GoodsReceiptOut)
    
    return {"total_count": total_count, "items": items}

# ==============================================================================
# SECCIÓN 6: SERVICIOS PARA FACTURAS DE COMPRA (PURCHASE BILL)
# ==============================================================================

async def create_purchase_bill(database: AsyncIOMotorDatabase, bill_data: PurchaseBillCreate, current_user: UserOut) -> PurchaseBillOut:
    bill_repo = PurchaseBillRepository(database)
    po_repo = PurchaseOrderRepository(database)
    
    po_doc = await po_repo.find_one_by_id(str(bill_data.purchase_order_id))
    if not po_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La OC asociada no existe.")
    
    total = sum(item.subtotal for item in bill_data.items)
    bill_to_db = PurchaseBillInDB(
        **bill_data.model_dump(),
        bill_number=await _generate_sequential_number(bill_repo, "FC"),
        supplier_id=po_doc.get("supplier_id"),
        created_by_id=current_user.id,
        total_amount=round(total, 2)
    )
    doc = bill_to_db.model_dump(by_alias=True, exclude={'id'})
    inserted_id = await bill_repo.insert_one(doc)
    
    return await get_purchase_bill_by_id(database, str(inserted_id))

async def get_purchase_bill_by_id(database: AsyncIOMotorDatabase, bill_id: str) -> PurchaseBillOut:
    repo = PurchaseBillRepository(database)
    doc = await repo.find_one_by_id(bill_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Factura ID '{bill_id}' no encontrada.")
    
    populated_list = await _populate_documents_with_suppliers(database, [doc], PurchaseBillOut)
    return populated_list[0]

async def get_purchase_bills_paginated(database: AsyncIOMotorDatabase, page: int, page_size: int, search: Optional[str]) -> Dict[str, Any]:
    repo = PurchaseBillRepository(database)
    query = {}
    if search:
        query["$or"] = [
            {"bill_number": {"$regex": search, "$options": "i"}},
            {"supplier_invoice_number": {"$regex": search, "$options": "i"}}
        ]
        
    total_count = await repo.count_documents(query)
    docs = await repo.find_all_paginated(query, (page - 1) * page_size, page_size, [("invoice_date", DESCENDING)])
    items = await _populate_documents_with_suppliers(database, docs, PurchaseBillOut)
    
    return {"total_count": total_count, "items": items}