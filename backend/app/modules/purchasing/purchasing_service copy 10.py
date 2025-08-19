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

# --- Importaciones de la Librería Estándar y Terceros ---
import logging
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Type

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorClientSession, AsyncIOMotorDatabase
from pydantic import BaseModel
from pymongo import DESCENDING

# --- Importaciones de la Aplicación ---
# Repositorios
from app.modules.crm.repositories.supplier_repository import SupplierRepository
from app.modules.inventory.repositories.product_repository import ProductRepository

# Modelos
from app.models.shared import PyObjectId
from app.modules.crm.supplier_models import SupplierOut
from app.modules.users.user_models import UserOut

from .purchasing_models import (
    GoodsReceiptCreate, GoodsReceiptInDB, GoodsReceiptOut, PurchaseBillCreate,
    PurchaseBillInDB, PurchaseBillOut, PurchaseOrderCreate, PurchaseOrderItem,
    PurchaseOrderInDB, PurchaseOrderOut, PurchaseOrderStatus
)
from .repositories.goods_receipt_repository import GoodsReceiptRepository
from .repositories.purchase_bill_repository import PurchaseBillRepository
from .repositories.purchase_order_repository import PurchaseOrderRepository

# Servicios
from app.modules.inventory import inventory_service

# ==============================================================================
# SECCIÓN 2: CONFIGURACIÓN DEL LOGGER
# ==============================================================================

# Configura un logger específico para este módulo para un seguimiento detallado.
logger = logging.getLogger(__name__)

# ==============================================================================
# SECCIÓN 3: FUNCIONES DE AYUDA PRIVADAS
# ==============================================================================

async def _generate_sequential_number(repository: Any, prefix: str) -> str:
    """
    Genera un número secuencial para un documento (OC, RM, FC).
    Formato: {PREFIX}-{AÑO}-{NÚMERO_INCREMENTAL_DE_5_DÍGITOS}
    """
    field_map = {"OC": "order_number", "RM": "receipt_number", "FC": "bill_number"}
    field_name = field_map.get(prefix)
    if not field_name:
        raise ValueError(f"Prefijo de secuencia no válido: '{prefix}'")

    current_year = datetime.now(timezone.utc).year
    last_document = await repository.find_one_sorted([("created_at", DESCENDING)])
    new_sequence_number = 1

    if last_document and (last_document_number := last_document.get(field_name)):
        try:
            parts = last_document_number.split('-')
            year_from_document = int(parts[1])
            if year_from_document == current_year:
                new_sequence_number = int(parts[2]) + 1
        except (ValueError, IndexError, TypeError):
            logger.warning(
                f"No se pudo parsear el número secuencial: '{last_document_number}'. "
                f"Se reiniciará la secuencia para el prefijo '{prefix}'."
            )
    
    return f"{prefix}-{current_year}-{str(new_sequence_number).zfill(5)}"

async def _populate_documents_with_suppliers(
    database: AsyncIOMotorDatabase,
    documents: List[Dict[str, Any]],
    PydanticOutModel: Type[BaseModel]
) -> List[BaseModel]:
    """
    Enriquece una lista de documentos con la información completa de sus proveedores.
    """
    supplier_ids = {str(doc.get("supplier_id")) for doc in documents if doc.get("supplier_id")}
    if not supplier_ids:
        for doc in documents:
            doc["supplier"] = None
        return [PydanticOutModel.model_validate(doc) for doc in documents]

    supplier_repository = SupplierRepository(database)
    suppliers_cursor = await supplier_repository.find_by_ids(list(supplier_ids))
    suppliers_map = {str(s['_id']): SupplierOut.model_validate(s) for s in suppliers_cursor}

    populated_items = []
    for doc in documents:
        supplier = suppliers_map.get(str(doc.get("supplier_id")))
        doc["supplier"] = supplier
        populated_items.append(PydanticOutModel.model_validate(doc))
            
    return populated_items

# ==============================================================================
# SECCIÓN 4: SERVICIOS PARA ÓRDENES DE COMPRA (PURCHASE ORDER)
# ==============================================================================

async def create_purchase_order(database: AsyncIOMotorDatabase, order_data: PurchaseOrderCreate, current_user: UserOut) -> PurchaseOrderOut:
    """Crea una nueva Orden de Compra, validando y enriqueciendo los datos."""
    purchase_order_repo = PurchaseOrderRepository(database)
    supplier_repo = SupplierRepository(database)
    product_repo = ProductRepository(database)

    if not await supplier_repo.find_by_id(str(order_data.supplier_id)):
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
        enriched_item = PurchaseOrderItem(
            **item_data.model_dump(),
            sku=product_doc.get("sku", "N/A"),
            name=product_doc.get("name", "N/A")
        )
        enriched_items.append(enriched_item)

    order_to_db = PurchaseOrderInDB(
        **order_data.model_dump(exclude={"items"}),
        order_number=await _generate_sequential_number(purchase_order_repo, "OC"),
        created_by_id=current_user.id,
        items=enriched_items,
        total_amount=round(total_amount, 2)
    )
    document_to_insert = order_to_db.model_dump(by_alias=True, exclude={'id'})
    document_to_insert['_id'] = order_to_db.id

    inserted_id = await purchase_order_repo.insert_one(document_to_insert)
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
    """Recupera una lista paginada de Órdenes de Compra."""
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
# SECCIÓN 5: SERVICIOS PARA RECEPCIÓN DE MERCANCÍA (GOODS RECEIPT)
# ==============================================================================

async def _get_new_po_status_after_receipt(
    database: AsyncIOMotorDatabase,
    po_id: PyObjectId,
    session: Optional[AsyncIOMotorClientSession] = None
) -> PurchaseOrderStatus:
    """Calcula el nuevo estado de una OC tras una recepción, basado en las cantidades totales recibidas."""
    po_repo = PurchaseOrderRepository(database)
    receipt_repo = GoodsReceiptRepository(database)
    
    po_doc = await po_repo.find_by_id(str(po_id), session=session)
    if not po_doc:
        raise ValueError(f"Orden de Compra con ID {po_id} no encontrada durante recálculo de estado.")
    
    all_receipts = await receipt_repo.find_all_by_purchase_order_id(str(po_id), session=session)
    
    total_received_per_product = defaultdict(int)
    for receipt in all_receipts:
        for item in receipt.get("items", []):
            total_received_per_product[str(item.get("product_id"))] += item.get("quantity_received", 0)
    
    is_fully_received = all(
        total_received_per_product.get(str(po_item["product_id"]), 0) >= po_item["quantity_ordered"]
        for po_item in po_doc["items"]
    )
    
    return PurchaseOrderStatus.FULLY_RECEIVED if is_fully_received else PurchaseOrderStatus.PARTIALLY_RECEIVED

async def create_goods_receipt(database: AsyncIOMotorDatabase, receipt_data: GoodsReceiptCreate, current_user: UserOut) -> GoodsReceiptOut:
    """
    Crea una Recepción de Mercancía.
    
    Esta es una operación crítica y transaccional que:
    1. Valida la Orden de Compra de origen.
    2. Crea el documento de Recepción.
    3. Invoca al servicio de Inventario para actualizar el stock.
    4. Actualiza el estado de la Orden de Compra.
    Si cualquier paso falla, toda la operación se revierte (rollback).
    """
    po_repo = PurchaseOrderRepository(database)
    receipt_repo = GoodsReceiptRepository(database)
    inserted_id = None

    async with await database.client.start_session() as session:
        try:
            async with session.start_transaction():
                logger.info(f"Iniciando transacción para crear recepción para la OC ID: {receipt_data.purchase_order_id}")
                
                # Paso 1: Validar la Orden de Compra
                po_doc = await po_repo.find_by_id(str(receipt_data.purchase_order_id), session=session)
                if not po_doc:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Compra de origen no existe.")
                
                po_status = PurchaseOrderStatus(po_doc.get("status"))
                if po_status not in [PurchaseOrderStatus.CONFIRMED, PurchaseOrderStatus.PARTIALLY_RECEIVED]:
                    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Solo se pueden recibir órdenes en estado 'Confirmado' o 'Parcialmente Recibido'.")
                logger.debug(f"Payload de recepción validado para la OC ID: {po_doc['_id']}")

                # Paso 2: Crear el documento de Recepción de Mercancía
                receipt_to_db = GoodsReceiptInDB(
                    **receipt_data.model_dump(),
                    receipt_number=await _generate_sequential_number(receipt_repo, "RM"),
                    supplier_id=po_doc["supplier_id"],
                    created_by_id=current_user.id
                )
                doc_to_insert = receipt_to_db.model_dump(by_alias=True, exclude={'id'})
                doc_to_insert['_id'] = receipt_to_db.id
                inserted_id = await receipt_repo.insert_one(doc_to_insert, session=session)
                logger.info(f"Documento de recepción {receipt_to_db.receipt_number} (ID: {inserted_id}) insertado en la BD.")

                # Paso 3: Invocar al Servicio de Inventario para actualizar el stock (Punto Crítico)
                logger.info(f"Invocando al servicio de inventario para actualizar stock para la recepción ID: {inserted_id}")
                await inventory_service.add_stock_from_goods_receipt(database, receipt_to_db, session=session)
                logger.info(f"El servicio de inventario completó la actualización de stock para la recepción ID: {inserted_id}")

                # Paso 4: Actualizar el estado de la Orden de Compra
                new_po_status = await _get_new_po_status_after_receipt(database, po_doc["_id"], session=session)
                logger.info(f"Nuevo estado calculado para la OC ID {po_doc['_id']}: {new_po_status.value}")
                
                update_po_operation = {
                    "$set": {"status": new_po_status.value, "updated_at": datetime.now(timezone.utc)},
                    "$push": {"receipt_ids": inserted_id}
                }
                await po_repo.execute_update_one_by_id(str(po_doc["_id"]), update_po_operation, session=session)
                logger.info(f"OC ID {po_doc['_id']} actualizada al estado '{new_po_status.value}'.")

            logger.info(f"Transacción para la recepción {inserted_id} completada exitosamente (COMMIT).")

        except Exception as e:
            # Si ocurre cualquier error, se captura, se loguea y se revierte la transacción.
            logger.error(
                f"Error durante la transacción de creación de recepción para la OC ID {receipt_data.purchase_order_id}. "
                f"Se revertirán los cambios. Error: {e}",
                exc_info=True  # Esto añade el traceback completo al log
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Ocurrió un error inesperado al procesar la recepción. La operación ha sido revertida."
            )

    if not inserted_id:
        # Este caso no debería ocurrir si la lógica es correcta, pero es una salvaguarda.
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No se pudo obtener el ID de la recepción creada.")
        
    return await get_goods_receipt_by_id(database, str(inserted_id))

async def get_goods_receipt_by_id(database: AsyncIOMotorDatabase, receipt_id: str) -> GoodsReceiptOut:
    """Obtiene una única Recepción de Mercancía por su ID."""
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
# SECCIÓN 6: SERVICIOS PARA FACTURAS DE COMPRA (PURCHASE BILL)
# ==============================================================================

async def create_purchase_bill(database: AsyncIOMotorDatabase, bill_data: PurchaseBillCreate, current_user: UserOut) -> PurchaseBillOut:
    """Crea una Factura de Compra, registrando una cuenta por pagar."""
    bill_repo = PurchaseBillRepository(database)
    po_repo = PurchaseOrderRepository(database)
    
    po_doc = await po_repo.find_by_id(str(bill_data.purchase_order_id))
    if not po_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Compra asociada no existe.")
    
    total_amount = sum(item.subtotal for item in bill_data.items)
    bill_to_db = PurchaseBillInDB(
        **bill_data.model_dump(),
        bill_number=await _generate_sequential_number(bill_repo, "FC"),
        supplier_id=po_doc.get("supplier_id"),
        created_by_id=current_user.id,
        total_amount=round(total_amount, 2)
    )
    doc_to_insert = bill_to_db.model_dump(by_alias=True, exclude={'id'})
    doc_to_insert['_id'] = bill_to_db.id
    inserted_id = await bill_repo.insert_one(doc_to_insert)
    
    return await get_purchase_bill_by_id(database, str(inserted_id))

async def get_purchase_bill_by_id(database: AsyncIOMotorDatabase, bill_id: str) -> PurchaseBillOut:
    """Obtiene una única Factura de Compra por su ID."""
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
        query["$or"] = [
            {"bill_number": {"$regex": search, "$options": "i"}},
            {"supplier_invoice_number": {"$regex": search, "$options": "i"}}
        ]
        
    total_count = await bill_repo.count_documents(query)
    bill_docs = await bill_repo.find_all_paginated(query, (page - 1) * page_size, page_size, [("invoice_date", DESCENDING)])
    populated_items = await _populate_documents_with_suppliers(database, bill_docs, PurchaseBillOut)
    
    return {"total_count": total_count, "items": populated_items}