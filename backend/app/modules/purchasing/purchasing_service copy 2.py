# backend/app/modules/purchasing/purchasing_service.py

"""
Capa de Servicio para la lógica de negocio del módulo de Compras (Purchasing).

Este módulo actúa como orquestador del flujo "Procure-to-Pay", coordinando las
operaciones entre los repositorios y otros servicios. La lógica de negocio
compleja, como la validación de transiciones de estado, el enriquecimiento de
datos y las operaciones transaccionales, reside aquí.

Responsabilidades principales:
1.  Orquestar la creación y gestión de Órdenes de Compra.
2.  Gestionar la creación y consulta de Recepciones de Mercancía, asegurando la
    actualización atómica del inventario y el estado de la OC.
3.  Manejar la creación y consulta de Facturas de Compra.
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
from pydantic import BaseModel # Importamos BaseModel

# Servicios
from app.modules.inventory import inventory_service

# ==============================================================================
# SECCIÓN 2: CONFIGURACIÓN DEL LOGGER
# ==============================================================================
logger = logging.getLogger(__name__)

# ==============================================================================
# SECCIÓN 3: FUNCIONES DE AYUDA PRIVADAS
# ==============================================================================

async def _generate_sequential_number(repo: Any, prefix: str) -> str:
    """
    Genera un número secuencial para un documento (OC, RM, FC).
    Formato: {PREFIX}-{AÑO}-{NÚMERO_INCREMENTAL}
    Ejemplo: OC-2025-00001
    """
    field_map = {
        "OC": "order_number",
        "RM": "receipt_number",
        "FC": "bill_number"
    }
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
            logger.warning(f"No se pudo parsear el número secuencial: '{last_doc_number}'. Se reiniciará la secuencia para el año {current_year}.")

    return f"{prefix}-{current_year}-{str(new_seq_num).zfill(5)}"


async def _populate_documents_with_suppliers(db: AsyncIOMotorDatabase, docs: List[Dict[str, Any]], PydanticOutModel: Type[BaseModel]) -> List[BaseModel]:
    """
    Enriquece una lista de documentos con la información completa de sus proveedores.

    Esta función optimiza las consultas a la base de datos al:
    1. Recopilar todos los IDs de proveedores únicos de la lista de documentos.
    2. Realizar una única consulta para obtener todos los proveedores necesarios.
    3. Mapear y adjuntar los datos del proveedor a cada documento.
    4. Validar cada documento enriquecido contra su modelo Pydantic de salida.
    """
    populated_items = []
    supplier_repo = SupplierRepository(db)
    
    supplier_ids = {str(doc.get("supplier_id")) for doc in docs if doc.get("supplier_id")}
    if not supplier_ids:
        # Si no hay IDs de proveedor, solo validamos los documentos tal cual
        for doc in docs:
            doc_dict = dict(doc)
            doc_dict["supplier"] = SupplierOut(id="000000000000000000000000", business_name="Proveedor No Especificado", tax_id="N/A")
            populated_items.append(PydanticOutModel.model_validate(doc_dict))
        return populated_items

    suppliers_cursor = await supplier_repo.find_by_ids(list(supplier_ids))
    suppliers_map = {str(s['_id']): s for s in suppliers_cursor}

    for doc in docs:
        try:
            doc_dict = dict(doc)
            supplier_data = suppliers_map.get(str(doc.get("supplier_id")))
            if supplier_data:
                doc_dict["supplier"] = SupplierOut.model_validate(supplier_data)
            else:
                doc_dict["supplier"] = SupplierOut(id="000000000000000000000000", business_name="Proveedor Desconocido o Eliminado", tax_id="N/A")
            
            populated_items.append(PydanticOutModel.model_validate(doc_dict))
        except Exception as e:
            logger.error(f"Error al procesar documento con ID '{doc.get('_id')}': {e}", exc_info=True)
            continue
            
    return populated_items

# ==============================================================================
# SECCIÓN 4: SERVICIO PARA ÓRDENES DE COMPRA (PURCHASE ORDER)
# ==============================================================================

async def create_purchase_order(db: AsyncIOMotorDatabase, po_data: PurchaseOrderCreate, user: UserOut) -> PurchaseOrderOut:
    """
    Crea una nueva Orden de Compra.
    1. Valida la existencia del proveedor y de los productos.
    2. Enriquece los ítems con datos de los productos (SKU, nombre).
    3. Calcula el monto total.
    4. Genera un número de orden secuencial y guarda en la BD.
    5. Devuelve la OC completa y validada.
    """
    po_repo = PurchaseOrderRepository(db)
    supplier_repo = SupplierRepository(db)
    product_repo = ProductRepository(db)

    if not await supplier_repo.find_by_id(str(po_data.supplier_id)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El proveedor especificado no existe.")

    enriched_items, total_amount = [], 0.0
    product_ids = [str(item.product_id) for item in po_data.items]
    products = await product_repo.find_by_ids(product_ids)
    product_map = {str(p["_id"]): p for p in products}

    for item_in in po_data.items:
        product_doc = product_map.get(str(item_in.product_id))
        if not product_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con ID '{item_in.product_id}' no encontrado.")
        
        total_amount += item_in.quantity_ordered * item_in.unit_cost
        enriched_items.append(PurchaseOrderItem(
            **item_in.model_dump(),
            sku=product_doc.get("sku", "N/A"),
            name=product_doc.get("name", "Producto sin nombre"),
        ))

    po_to_db = PurchaseOrderInDB(
        **po_data.model_dump(exclude={"items", "order_date", "expected_delivery_date"}),
        order_number=await _generate_sequential_number(po_repo, "OC"),
        created_by_id=user.id,
        items=enriched_items,
        total_amount=round(total_amount, 2),
        order_date=datetime.combine(po_data.order_date, datetime.min.time(), tzinfo=timezone.utc),
        expected_delivery_date=datetime.combine(po_data.expected_delivery_date, datetime.min.time(), tzinfo=timezone.utc) if po_data.expected_delivery_date else None,
    )

    inserted_id = await po_repo.insert_one(po_to_db.model_dump(by_alias=True))
    return await get_purchase_order_by_id(db, str(inserted_id))


async def get_purchase_order_by_id(db: AsyncIOMotorDatabase, order_id: str) -> PurchaseOrderOut:
    """Obtiene una única OC por su ID, enriqueciendo los datos del proveedor."""
    po_repo = PurchaseOrderRepository(db)
    order_doc = await po_repo.find_by_id(order_id)
    if not order_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Orden de Compra con ID '{order_id}' no encontrada.")

    populated_list = await _populate_documents_with_suppliers(db, [order_doc], PurchaseOrderOut)
    if not populated_list:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No se pudo procesar la orden de compra después de ser encontrada.")
    return populated_list[0]


async def get_purchase_orders_paginated(db: AsyncIOMotorDatabase, page: int, page_size: int, search: Optional[str]) -> Dict[str, Any]:
    """Recupera una lista paginada de Órdenes de Compra, con búsqueda y población."""
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
    skip = (page - 1) * page_size
    sort_options = [("order_date", DESCENDING)]
    order_docs = await po_repo.find_all_paginated(query, skip, page_size, sort_options)
    
    populated_items = await _populate_documents_with_suppliers(db, order_docs, PurchaseOrderOut)

    return {"total_count": total_count, "items": populated_items}

# ==============================================================================
# SECCIÓN 5: SERVICIO PARA RECEPCIÓN DE MERCANCÍA (GOODS RECEIPT)
# ==============================================================================

async def _get_new_po_status_after_receipt(db: AsyncIOMotorDatabase, po_id: PyObjectId, session=None) -> PurchaseOrderStatus:
    """Calcula el nuevo estado de una OC tras una recepción."""
    po_repo = PurchaseOrderRepository(db)
    receipt_repo = GoodsReceiptRepository(db)

    po_doc_raw = await po_repo.find_by_id(str(po_id), session=session)
    po_doc = PurchaseOrderInDB.model_validate(po_doc_raw)

    all_receipts_docs = await receipt_repo.find_all_by_purchase_order_id(str(po_doc.id), session=session)

    total_received_per_product = defaultdict(int)
    for receipt in all_receipts_docs:
        for item in receipt.get("items", []):
            total_received_per_product[str(item.get("product_id"))] += item.get("quantity_received", 0)

    is_fully_received = all(
        total_received_per_product.get(str(po_item.product_id), 0) >= po_item.quantity_ordered
        for po_item in po_doc.items
    )

    return PurchaseOrderStatus.FULLY_RECEIVED if is_fully_received else PurchaseOrderStatus.PARTIALLY_RECEIVED


async def create_goods_receipt(db: AsyncIOMotorDatabase, receipt_data: GoodsReceiptCreate, user: UserOut) -> GoodsReceiptOut:
    """
    Crea una Recepción de Mercancía. Operación atómica y transaccional que:
    1. Valida la OC de origen.
    2. Crea el documento de recepción.
    3. Actualiza el stock de inventario.
    4. Recalcula y actualiza el estado de la OC.
    """
    po_repo = PurchaseOrderRepository(db)
    receipt_repo = GoodsReceiptRepository(db)
    client = db.client

    async with await client.start_session() as session:
        async with session.start_transaction():
            po_doc_raw = await po_repo.find_by_id(str(receipt_data.purchase_order_id), session=session)
            if not po_doc_raw:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Compra de origen no existe.")
            po_doc = PurchaseOrderInDB.model_validate(po_doc_raw)

            if po_doc.status not in [PurchaseOrderStatus.CONFIRMED, PurchaseOrderStatus.PARTIALLY_RECEIVED]:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Solo se pueden recibir órdenes en estado 'Confirmado' o 'Parcialmente Recibido'.")

            receipt_to_db = GoodsReceiptInDB(
                **receipt_data.model_dump(),
                receipt_number=await _generate_sequential_number(receipt_repo, "RM"),
                supplier_id=po_doc.supplier_id,
                created_by_id=user.id,
                received_date=datetime.combine(receipt_data.received_date, datetime.min.time(), tzinfo=timezone.utc),
            )

            inserted_id = await receipt_repo.insert_one(receipt_to_db.model_dump(by_alias=True), session=session)
            receipt_to_db.id = inserted_id

            await inventory_service.add_stock_from_goods_receipt(db, receipt_to_db, session=session)
            new_po_status = await _get_new_po_status_after_receipt(db, po_doc.id, session=session)
            
            update_po_data = {
                "$set": {"status": new_po_status.value, "updated_at": datetime.now(timezone.utc)},
                "$push": {"receipt_ids": inserted_id}
            }
            await po_repo.update_one_by_id(str(po_doc.id), update_po_data, session=session)

    return await get_goods_receipt_by_id(db, str(inserted_id))


async def get_goods_receipt_by_id(db: AsyncIOMotorDatabase, receipt_id: str) -> GoodsReceiptOut:
    """Obtiene una única Recepción de Mercancía por su ID, enriqueciendo datos."""
    receipt_repo = GoodsReceiptRepository(db)
    receipt_doc = await receipt_repo.find_by_id(receipt_id)
    if not receipt_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Recepción de Mercancía con ID '{receipt_id}' no encontrada.")

    populated_list = await _populate_documents_with_suppliers(db, [receipt_doc], GoodsReceiptOut)
    if not populated_list:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No se pudo procesar la recepción después de ser encontrada.")
    return populated_list[0]


async def get_goods_receipts_paginated(db: AsyncIOMotorDatabase, page: int, page_size: int, search: Optional[str]) -> Dict[str, Any]:
    """Recupera una lista paginada de Recepciones de Mercancía."""
    receipt_repo = GoodsReceiptRepository(db)
    query: Dict[str, Any] = {}
    if search:
        query["receipt_number"] = {"$regex": search, "$options": "i"}
        
    total_count = await receipt_repo.count_documents(query)
    skip = (page - 1) * page_size
    sort_options = [("received_date", DESCENDING)]
    receipt_docs = await receipt_repo.find_all_paginated(query, skip, page_size, sort_options)

    populated_items = await _populate_documents_with_suppliers(db, receipt_docs, GoodsReceiptOut)

    return {"total_count": total_count, "items": populated_items}

# ==============================================================================
# SECCIÓN 6: SERVICIO PARA FACTURA DE COMPRA (PURCHASE BILL)
# ==============================================================================

async def create_purchase_bill(db: AsyncIOMotorDatabase, bill_data: PurchaseBillCreate, user: UserOut) -> PurchaseBillOut:
    """Crea una Factura de Compra."""
    bill_repo = PurchaseBillRepository(db)
    po_repo = PurchaseOrderRepository(db)

    po_doc_raw = await po_repo.find_by_id(str(bill_data.purchase_order_id))
    if not po_doc_raw:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Compra asociada no existe.")
    
    total_amount = sum(item.subtotal for item in bill_data.items)

    bill_to_db = PurchaseBillInDB(
        **bill_data.model_dump(),
        bill_number=await _generate_sequential_number(bill_repo, "FC"),
        supplier_id=po_doc_raw.get("supplier_id"),
        created_by_id=user.id,
        total_amount=round(total_amount, 2),
        invoice_date=datetime.combine(bill_data.invoice_date, datetime.min.time(), tzinfo=timezone.utc),
        due_date=datetime.combine(bill_data.due_date, datetime.min.time(), tzinfo=timezone.utc),
    )
    
    inserted_id = await bill_repo.insert_one(bill_to_db.model_dump(by_alias=True))
    return await get_purchase_bill_by_id(db, str(inserted_id))


async def get_purchase_bill_by_id(db: AsyncIOMotorDatabase, bill_id: str) -> PurchaseBillOut:
    """Obtiene una única Factura de Compra por su ID, enriqueciendo datos."""
    bill_repo = PurchaseBillRepository(db)
    bill_doc = await bill_repo.find_by_id(bill_id)
    if not bill_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Factura con ID '{bill_id}' no encontrada.")

    populated_list = await _populate_documents_with_suppliers(db, [bill_doc], PurchaseBillOut)
    if not populated_list:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No se pudo procesar la factura después de ser encontrada.")
    return populated_list[0]


async def get_purchase_bills_paginated(db: AsyncIOMotorDatabase, page: int, page_size: int, search: Optional[str]) -> Dict[str, Any]:
    """Recupera una lista paginada de Facturas de Compra."""
    bill_repo = PurchaseBillRepository(db)
    query: Dict[str, Any] = {}
    if search:
        query["$or"] = [
            {"bill_number": {"$regex": search, "$options": "i"}},
            {"supplier_invoice_number": {"$regex": search, "$options": "i"}}
        ]
        
    total_count = await bill_repo.count_documents(query)
    skip = (page - 1) * page_size
    sort_options = [("invoice_date", DESCENDING)]
    bill_docs = await bill_repo.find_all_paginated(query, skip, page_size, sort_options)
    
    populated_items = await _populate_documents_with_suppliers(db, bill_docs, PurchaseBillOut)
    
    return {"total_count": total_count, "items": populated_items}