# /backend/app/modules/purchasing/purchasing_service.py

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

from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Dict, Any, List, Optional, Type
from datetime import datetime, timezone
from fastapi import HTTPException, status
from pymongo import DESCENDING
from collections import defaultdict
import logging

# Repositorios
from .repositories.purchase_order_repository import PurchaseOrderRepository
from .repositories.goods_receipt_repository import GoodsReceiptRepository
from .repositories.purchase_bill_repository import PurchaseBillRepository
from app.modules.inventory.repositories.product_repository import ProductRepository
from app.modules.crm.repositories.supplier_repository import SupplierRepository

# Modelos
from .purchasing_models import (
    PurchaseOrderCreate, PurchaseOrderItem, PurchaseOrderInDB, PurchaseOrderOut,
    PurchaseOrderStatus, GoodsReceiptCreate, GoodsReceiptInDB, GoodsReceiptOut,
    PurchaseBillCreate, PurchaseBillInDB, PurchaseBillOut
)
from app.modules.users.user_models import UserOut
from app.modules.crm.supplier_models import SupplierOut
from app.models.shared import PyObjectId
from pydantic import BaseModel

# Servicios
from app.modules.inventory import inventory_service

# ==============================================================================
# SECCIÓN 2: CONFIGURACIÓN DEL LOGGER
# ==============================================================================

logger = logging.getLogger(__name__)

# ==============================================================================
# SECCIÓN 3: FUNCIONES DE AYUDA PRIVADAS
# ==============================================================================

async def _generate_sequential_number(repository: Any, prefix: str) -> str:
    """
    Genera un número secuencial para un documento (OC, RM, FC).
    Formato: {PREFIX}-{AÑO}-{NÚMERO_INCREMENTAL}
    """
    field_map = {"OC": "order_number", "RM": "receipt_number", "FC": "bill_number"}
    field_name = field_map.get(prefix, "number")
    current_year = datetime.now(timezone.utc).year

    last_doc = await repository.find_one_sorted([("created_at", DESCENDING)])
    new_seq_num = 1

    if last_doc and (last_doc_number := last_doc.get(field_name)):
        try:
            parts = last_doc_number.split('-')
            year_from_doc = int(parts[1])
            if year_from_doc == current_year:
                new_seq_num = int(parts[2]) + 1
        except (ValueError, IndexError, TypeError):
            logger.warning(f"No se pudo parsear el número secuencial: '{last_doc_number}'. Se reiniciará la secuencia.")
    
    return f"{prefix}-{current_year}-{str(new_seq_num).zfill(5)}"

async def _populate_documents_with_suppliers(database: AsyncIOMotorDatabase, documents: List[Dict[str, Any]], PydanticOutModel: Type[BaseModel]) -> List[BaseModel]:
    """
    Enriquece una lista de documentos con la información completa de sus proveedores.
    """
    supplier_ids = {str(doc.get("supplier_id")) for doc in documents if doc.get("supplier_id")}
    if not supplier_ids:
        for doc in documents:
            doc["supplier"] = None
        return [PydanticOutModel.model_validate(doc) for doc in documents]

    supplier_repo = SupplierRepository(database)
    suppliers_cursor = await supplier_repo.find_by_ids(list(supplier_ids))
    suppliers_map = {str(s['_id']): SupplierOut.model_validate(s) for s in suppliers_cursor}

    populated_items = []
    for doc in documents:
        supplier = suppliers_map.get(str(doc.get("supplier_id")))
        doc["supplier"] = supplier
        populated_items.append(PydanticOutModel.model_validate(doc))
            
    return populated_items

# ==============================================================================
# SECCIÓN 4: SERVICIO PARA ÓRDENES DE COMPRA (PURCHASE ORDER)
# ==============================================================================

async def create_purchase_order(database: AsyncIOMotorDatabase, order_data: PurchaseOrderCreate, current_user: UserOut) -> PurchaseOrderOut:
    """Crea una nueva Orden de Compra."""
    po_repo = PurchaseOrderRepository(database)
    supplier_repo = SupplierRepository(database)
    product_repo = ProductRepository(database)

    if not await supplier_repo.find_by_id(str(order_data.supplier_id)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El proveedor especificado no existe.")

    enriched_items, total_amount = [], 0.0
    product_ids = [str(item.product_id) for item in order_data.items]
    products = await product_repo.find_by_ids(product_ids)
    product_map = {str(p["_id"]): p for p in products}

    for item_in in order_data.items:
        product_doc = product_map.get(str(item_in.product_id))
        if not product_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con ID '{item_in.product_id}' no encontrado.")
        
        total_amount += item_in.quantity_ordered * item_in.unit_cost
        enriched_items.append(PurchaseOrderItem(**item_in.model_dump(), sku=product_doc.get("sku", "N/A"), name=product_doc.get("name", "N/A")))

    po_to_db = PurchaseOrderInDB(**order_data.model_dump(exclude={"items"}), order_number=await _generate_sequential_number(po_repo, "OC"), created_by_id=current_user.id, items=enriched_items, total_amount=round(total_amount, 2))
    document_to_insert = po_to_db.model_dump(by_alias=True, exclude={'id'})
    document_to_insert['_id'] = po_to_db.id

    inserted_id = await po_repo.insert_one(document_to_insert)
    return await get_purchase_order_by_id(database, str(inserted_id))

async def get_purchase_order_by_id(database: AsyncIOMotorDatabase, order_id: str) -> PurchaseOrderOut:
    """Obtiene una única OC por su ID, enriqueciendo los datos del proveedor."""
    po_repo = PurchaseOrderRepository(database)
    order_doc = await po_repo.find_by_id(order_id)
    if not order_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Orden de Compra con ID '{order_id}' no encontrada.")
    
    populated_list = await _populate_documents_with_suppliers(database, [order_doc], PurchaseOrderOut)
    return populated_list[0]

async def get_purchase_orders_paginated(database: AsyncIOMotorDatabase, page: int, page_size: int, search: Optional[str]) -> Dict[str, Any]:
    """Recupera una lista paginada de Órdenes de Compra, con búsqueda y población."""
    po_repo = PurchaseOrderRepository(database)
    query: Dict[str, Any] = {}
    if search:
        supplier_repo = SupplierRepository(database)
        supplier_ids = await supplier_repo.find_ids_by_name(search)
        query["$or"] = [{"order_number": {"$regex": search, "$options": "i"}}, {"supplier_id": {"$in": supplier_ids}}]
        
    total_count = await po_repo.count_documents(query)
    skip = (page - 1) * page_size
    order_docs = await po_repo.find_all_paginated(query, skip, page_size, [("order_date", DESCENDING)])
    populated_items = await _populate_documents_with_suppliers(database, order_docs, PurchaseOrderOut)
    return {"total_count": total_count, "items": populated_items}

async def update_purchase_order_status(database: AsyncIOMotorDatabase, order_id: str, new_status: PurchaseOrderStatus) -> PurchaseOrderOut:
    """Actualiza el estado de una Orden de Compra, validando la transición de estado."""
    po_repo = PurchaseOrderRepository(database)
    po_doc = await po_repo.find_by_id(order_id)
    if not po_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Compra no existe.")
    current_status = PurchaseOrderStatus(po_doc.get('status'))
    valid_transitions: Dict[PurchaseOrderStatus, List[PurchaseOrderStatus]] = {
        PurchaseOrderStatus.DRAFT: [PurchaseOrderStatus.CONFIRMED, PurchaseOrderStatus.CANCELLED],
        PurchaseOrderStatus.CONFIRMED: [PurchaseOrderStatus.CANCELLED],
    }
    if new_status not in valid_transitions.get(current_status, []):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"No se puede cambiar el estado de '{current_status.value}' a '{new_status.value}'.")
    update_payload = {"status": new_status.value, "updated_at": datetime.now(timezone.utc)}
    await po_repo.update_one_by_id(order_id, update_payload)
    return await get_purchase_order_by_id(database, order_id)

# ==============================================================================
# SECCIÓN 5: SERVICIO PARA RECEPCIÓN DE MERCANCÍA (GOODS RECEIPT)
# ==============================================================================

async def _get_new_po_status_after_receipt(database: AsyncIOMotorDatabase, po_id: PyObjectId, session=None) -> PurchaseOrderStatus:
    """Calcula el nuevo estado de una OC tras una recepción."""
    po_repo = PurchaseOrderRepository(database)
    receipt_repo = GoodsReceiptRepository(database)
    po_doc = await po_repo.find_by_id(str(po_id), session=session)
    if not po_doc:
        raise ValueError(f"Orden de Compra con ID {po_id} no encontrada durante recálculo de estado.")
    all_receipts = await receipt_repo.find_all_by_purchase_order_id(str(po_id), session=session)
    total_received = defaultdict(int)
    for receipt in all_receipts:
        for item in receipt.get("items", []):
            total_received[str(item.get("product_id"))] += item.get("quantity_received", 0)
    is_fully_received = all(total_received.get(str(po_item["product_id"]), 0) >= po_item["quantity_ordered"] for po_item in po_doc["items"])
    return PurchaseOrderStatus.FULLY_RECEIVED if is_fully_received else PurchaseOrderStatus.PARTIALLY_RECEIVED

async def create_goods_receipt(database: AsyncIOMotorDatabase, receipt_data: GoodsReceiptCreate, current_user: UserOut) -> GoodsReceiptOut:
    """Crea una Recepción de Mercancía. Operación atómica y transaccional."""
    po_repo = PurchaseOrderRepository(database)
    receipt_repo = GoodsReceiptRepository(database)
    async with await database.client.start_session() as session:
        async with session.start_transaction():
            po_doc = await po_repo.find_by_id(str(receipt_data.purchase_order_id), session=session)
            if not po_doc:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Compra de origen no existe.")
            po_status = PurchaseOrderStatus(po_doc.get("status"))
            if po_status not in [PurchaseOrderStatus.CONFIRMED, PurchaseOrderStatus.PARTIALLY_RECEIVED]:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Solo se pueden recibir órdenes en estado 'Confirmado' o 'Parcialmente Recibido'.")
            receipt_to_db = GoodsReceiptInDB(**receipt_data.model_dump(), receipt_number=await _generate_sequential_number(receipt_repo, "RM"), supplier_id=po_doc["supplier_id"], created_by_id=current_user.id)
            doc_to_insert = receipt_to_db.model_dump(by_alias=True, exclude={'id'})
            doc_to_insert['_id'] = receipt_to_db.id
            inserted_id = await receipt_repo.insert_one(doc_to_insert, session=session)
            await inventory_service.add_stock_from_goods_receipt(database, receipt_to_db, session=session)
            new_po_status = await _get_new_po_status_after_receipt(database, po_doc["_id"], session=session)
            update_po_operation = {"$set": {"status": new_po_status.value, "updated_at": datetime.now(timezone.utc)}, "$push": {"receipt_ids": inserted_id}}
            await po_repo.execute_update_one_by_id(str(po_doc["_id"]), update_po_operation, session=session)
    return await get_goods_receipt_by_id(database, str(inserted_id))

async def get_goods_receipt_by_id(database: AsyncIOMotorDatabase, receipt_id: str) -> GoodsReceiptOut:
    """Obtiene una única Recepción de Mercancía por su ID, enriqueciendo datos."""
    receipt_repo = GoodsReceiptRepository(database)
    receipt_doc = await receipt_repo.find_by_id(receipt_id)
    if not receipt_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Recepción con ID '{receipt_id}' no encontrada.")
    populated_list = await _populate_documents_with_suppliers(database, [receipt_doc], GoodsReceiptOut)
    return populated_list[0]

async def get_goods_receipts_paginated(database: AsyncIOMotorDatabase, page: int, page_size: int, search: Optional[str]) -> Dict[str, Any]:
    """Recupera una lista paginada de Recepciones de Mercancía."""
    receipt_repo = GoodsReceiptRepository(database)
    query: Dict[str, Any] = {"receipt_number": {"$regex": search, "$options": "i"}} if search else {}
    total_count = await receipt_repo.count_documents(query)
    receipt_docs = await receipt_repo.find_all_paginated(query, (page - 1) * page_size, page_size, [("received_date", DESCENDING)])
    populated_items = await _populate_documents_with_suppliers(database, receipt_docs, GoodsReceiptOut)
    return {"total_count": total_count, "items": populated_items}

# ==============================================================================
# SECCIÓN 6: SERVICIO PARA FACTURA DE COMPRA (PURCHASE BILL)
# ==============================================================================

async def create_purchase_bill(database: AsyncIOMotorDatabase, bill_data: PurchaseBillCreate, current_user: UserOut) -> PurchaseBillOut:
    """Crea una Factura de Compra, registrando una cuenta por pagar."""
    bill_repo = PurchaseBillRepository(database)
    po_repo = PurchaseOrderRepository(database)
    po_doc = await po_repo.find_by_id(str(bill_data.purchase_order_id))
    if not po_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Compra asociada no existe.")
    total_amount = sum(item.subtotal for item in bill_data.items)
    bill_to_db = PurchaseBillInDB(**bill_data.model_dump(), bill_number=await _generate_sequential_number(bill_repo, "FC"), supplier_id=po_doc.get("supplier_id"), created_by_id=current_user.id, total_amount=round(total_amount, 2))
    doc_to_insert = bill_to_db.model_dump(by_alias=True, exclude={'id'})
    doc_to_insert['_id'] = bill_to_db.id
    inserted_id = await bill_repo.insert_one(doc_to_insert)
    return await get_purchase_bill_by_id(database, str(inserted_id))

async def get_purchase_bill_by_id(database: AsyncIOMotorDatabase, bill_id: str) -> PurchaseBillOut:
    """Obtiene una única Factura de Compra por su ID, enriqueciendo datos."""
    bill_repo = PurchaseBillRepository(database)
    bill_doc = await bill_repo.find_by_id(bill_id)
    if not bill_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Factura con ID '{bill_id}' no encontrada.")
    populated_list = await _populate_documents_with_suppliers(database, [bill_doc], PurchaseBillOut)
    return populated_list[0]

async def get_purchase_bills_paginated(database: AsyncIOMotorDatabase, page: int, page_size: int, search: Optional[str]) -> Dict[str, Any]:
    """Recupera una lista paginada de Facturas de Compra."""
    bill_repo = PurchaseBillRepository(database)
    query: Dict[str, Any] = {}
    if search:
        query["$or"] = [{"bill_number": {"$regex": search, "$options": "i"}}, {"supplier_invoice_number": {"$regex": search, "$options": "i"}}]
    total_count = await bill_repo.count_documents(query)
    bill_docs = await bill_repo.find_all_paginated(query, (page - 1) * page_size, page_size, [("invoice_date", DESCENDING)])
    populated_items = await _populate_documents_with_suppliers(database, bill_docs, PurchaseBillOut)
    return {"total_count": total_count, "items": populated_items}