# backend/app/modules/purchasing/purchasing_service.py

"""
Capa de Servicio para la lógica de negocio del módulo de Compras.

Este módulo orquesta las operaciones de las Órdenes de Compra y las
Recepciones/Facturas de Compra. Aplica validaciones, enriquece datos,
calcula totales y coordina con otras capas (repositorios, otros servicios)
para asegurar la integridad de los datos y la correcta ejecución de los
procesos de negocio, como la aprobación de documentos y la recepción de mercancía.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

import pandas as pd
from io import StringIO
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from fastapi import HTTPException, status, UploadFile
from pymongo import DESCENDING
from collections import defaultdict

# Repositorios
from .repositories.purchase_order_repository import PurchaseOrderRepository
from .repositories.purchase_bill_repository import PurchaseBillRepository
from app.modules.inventory.repositories.product_repository import ProductRepository
from app.modules.crm.repositories.supplier_repository import SupplierRepository

# Modelos
from .purchasing_models import (
    PurchaseOrderCreate, PurchaseOrderItem, PurchaseOrderInDB, PurchaseOrderOut,
    PurchaseOrderStatus, PurchaseOrderUpdate, PurchaseBillCreate, PurchaseBillItem,
    PurchaseBillInDB, PurchaseBillOut, PurchaseOrderItemCreate,
    PurchaseBillListOut # Se importa el nuevo DTO para la lista
)
from app.modules.users.user_models import UserOut, UserRole

# Servicios
from app.modules.inventory import inventory_service
from app.modules.crm import crm_service

# ==============================================================================
# SECCIÓN 2: FUNCIONES DE AYUDA PRIVADAS
# ==============================================================================
# ... (Sin cambios en esta sección)
async def _generate_sequential_number(repo, prefix: str) -> str:
    field_name = "order_number" if prefix == "OC" else "bill_number"
    last_doc = await repo.find_one_sorted([("created_at", DESCENDING)])
    if last_doc and last_doc.get(field_name, "").startswith(f"{prefix}-"):
        try:
            last_num = int(last_doc[field_name].split('-')[-1])
            new_num = last_num + 1
            return f"{prefix}-{datetime.now().year}-{str(new_num).zfill(5)}"
        except (ValueError, IndexError):
            pass
    return f"{prefix}-{datetime.now().year}-{'1'.zfill(5)}"

async def _get_new_po_status(db: AsyncIOMotorDatabase, po_id: str) -> PurchaseOrderStatus:
    po_repo = PurchaseOrderRepository(db)
    bill_repo = PurchaseBillRepository(db)
    po_doc_raw = await po_repo.find_by_id(po_id)
    if not po_doc_raw:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden de Compra no encontrada al recalcular estado.")
    po_doc = PurchaseOrderInDB.model_validate(po_doc_raw)
    all_bills_docs = await bill_repo.find_all_by_purchase_order_id(str(po_doc.id))
    total_received_per_product = defaultdict(int)
    for bill in all_bills_docs:
        for item in bill.get("items", []):
            total_received_per_product[str(item.get("product_id"))] += item.get("quantity_received", 0)
    is_fully_received = True
    for po_item in po_doc.items:
        if total_received_per_product.get(str(po_item.product_id), 0) < po_item.quantity_ordered:
            is_fully_received = False
            break
    has_any_reception = len(all_bills_docs) > 0
    if is_fully_received and has_any_reception:
        return PurchaseOrderStatus.COMPLETED
    elif has_any_reception:
        return PurchaseOrderStatus.PARTIALLY_RECEIVED
    else:
        return po_doc.status

# ==============================================================================
# SECCIÓN 3: SERVICIO PARA ÓRDENES DE COMPRA (PURCHASE ORDER)
# ==============================================================================
# ... (Sin cambios en create, get by id, get paginated, update, update status)
async def create_purchase_order(db: AsyncIOMotorDatabase, po_data: PurchaseOrderCreate, user: UserOut, prefix: str = "OC") -> PurchaseOrderOut:
    po_repo = PurchaseOrderRepository(db)
    supplier_repo = SupplierRepository(db)
    product_repo = ProductRepository(db)
    supplier_doc = await supplier_repo.find_by_id(str(po_data.supplier_id))
    if not supplier_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El proveedor especificado no existe.")
    enriched_items = []
    total_amount = 0.0
    for item_in in po_data.items:
        product_doc = await product_repo.find_by_id(str(item_in.product_id))
        if not product_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con ID '{item_in.product_id}' no encontrado.")
        item_total = item_in.quantity_ordered * item_in.unit_cost
        total_amount += item_total
        enriched_items.append(PurchaseOrderItem(product_id=item_in.product_id, sku=product_doc.get("sku", "N/A"), name=product_doc.get("name", "Producto no encontrado"), quantity_ordered=item_in.quantity_ordered, unit_cost=item_in.unit_cost))
    po_to_db = PurchaseOrderInDB(order_number=await _generate_sequential_number(po_repo, prefix), supplier_id=po_data.supplier_id, created_by_id=user.id, items=enriched_items, total_amount=round(total_amount, 2), order_date=po_data.order_date, expected_delivery_date=po_data.expected_delivery_date, notes=po_data.notes)
    inserted_id = await po_repo.insert_one(po_to_db.model_dump(by_alias=True))
    return await get_purchase_order_by_id(db, str(inserted_id))

async def get_purchase_order_by_id(db: AsyncIOMotorDatabase, order_id: str) -> PurchaseOrderOut:
    po_repo = PurchaseOrderRepository(db)
    po_doc = await po_repo.find_by_id(order_id)
    if not po_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Orden de Compra con ID '{order_id}' no encontrada.")
    supplier_repo = SupplierRepository(db)
    supplier_doc = await supplier_repo.find_by_id(str(po_doc.get("supplier_id")))
    po_doc['supplier'] = supplier_doc or {"business_name": "Proveedor No Encontrado"}
    return PurchaseOrderOut.model_validate(po_doc)

async def get_purchase_orders_paginated(db: AsyncIOMotorDatabase, page: int, page_size: int, search: Optional[str]) -> Dict[str, Any]:
    po_repo = PurchaseOrderRepository(db)
    supplier_repo = SupplierRepository(db)
    query: Dict[str, Any] = {}
    if search:
        query["order_number"] = {"$regex": search, "$options": "i"}
    total_count = await po_repo.count_documents(query)
    skip = (page - 1) * page_size
    sort_options = [("order_date", DESCENDING)]
    po_docs = await po_repo.find_all_paginated(query, skip, page_size, sort_options)
    populated_items = []
    for doc in po_docs:
        supplier = await supplier_repo.find_by_id(str(doc.get("supplier_id")))
        doc["supplier"] = supplier
        populated_items.append(PurchaseOrderOut.model_validate(doc))
    return {"total_count": total_count, "items": populated_items}

async def update_purchase_order(db: AsyncIOMotorDatabase, order_id: str, po_data: PurchaseOrderUpdate) -> PurchaseOrderOut:
    po_repo = PurchaseOrderRepository(db)
    po_doc = await po_repo.find_by_id(order_id)
    if not po_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Compra no existe.")
    if po_doc.get('status') != PurchaseOrderStatus.DRAFT:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Solo se pueden editar Órdenes de Compra en estado 'Borrador'.")
    update_data = po_data.model_dump(exclude_unset=True)
    if "items" in update_data and update_data["items"] is not None:
        product_repo = ProductRepository(db)
        enriched_items = []
        total_amount = 0.0
        for item_data in po_data.items:
            item_create = PurchaseOrderItemCreate.model_validate(item_data)
            product_doc = await product_repo.find_by_id(str(item_create.product_id))
            if not product_doc: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con ID '{item_create.product_id}' no encontrado.")
            item_total = item_create.quantity_ordered * item_create.unit_cost
            total_amount += item_total
            enriched_items.append(PurchaseOrderItem(product_id=item_create.product_id, sku=product_doc.get("sku"), name=product_doc.get("name"), quantity_ordered=item_create.quantity_ordered, unit_cost=item_create.unit_cost))
        update_data["items"] = [item.model_dump() for item in enriched_items]
        update_data["total_amount"] = round(total_amount, 2)
    if not update_data:
        return await get_purchase_order_by_id(db, order_id)
    update_data["updated_at"] = datetime.now(timezone.utc)
    await po_repo.update_one_by_id(order_id, update_data)
    return await get_purchase_order_by_id(db, order_id)

async def update_purchase_order_status(db: AsyncIOMotorDatabase, order_id: str, new_status: PurchaseOrderStatus, user: UserOut) -> PurchaseOrderOut:
    po_repo = PurchaseOrderRepository(db)
    po_doc = await po_repo.find_by_id(order_id)
    if not po_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Compra no existe.")
    current_status = po_doc.get('status')
    valid_transitions = {PurchaseOrderStatus.DRAFT: [PurchaseOrderStatus.PENDING_APPROVAL, PurchaseOrderStatus.CANCELLED], PurchaseOrderStatus.PENDING_APPROVAL: [PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.REJECTED], PurchaseOrderStatus.APPROVED: [PurchaseOrderStatus.CANCELLED]}
    allowed_transitions = valid_transitions.get(current_status, [])
    if new_status not in allowed_transitions:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"No se puede cambiar el estado de '{current_status}' a '{new_status.value}'.")
    if new_status in [PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.REJECTED]:
        if user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.MANAGER]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para aprobar o rechazar órdenes de compra.")
    update_data = {"status": new_status, "updated_at": datetime.now(timezone.utc)}
    await po_repo.update_one_by_id(order_id, update_data)
    return await get_purchase_order_by_id(db, order_id)

# ==============================================================================
# SECCIÓN 4: SERVICIO PARA RECEPCIÓN/FACTURA DE COMPRA (PURCHASE BILL)
# ==============================================================================
# ... (process_purchase_receipt y get_bill_by_id permanecen idénticas)
async def process_purchase_receipt(db: AsyncIOMotorDatabase, po_id: str, bill_data: PurchaseBillCreate, user: UserOut) -> PurchaseBillOut:
    po_repo = PurchaseOrderRepository(db)
    bill_repo = PurchaseBillRepository(db)
    client = db.client
    inserted_id = None
    async with await client.start_session() as session:
        async with session.start_transaction():
            po_doc_raw = await po_repo.find_by_id(po_id, session=session)
            if not po_doc_raw:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Compra de origen no existe.")
            po_doc = PurchaseOrderInDB.model_validate(po_doc_raw)
            if po_doc.status not in [PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.PARTIALLY_RECEIVED]:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Solo se puede recibir mercancía de órdenes en estado 'Aprobado' o 'Parcialmente Recibido'. Estado actual: {po_doc.status.value}")
            po_items_map = {str(item.product_id): item for item in po_doc.items}
            total_bill_amount = 0.0
            for bill_item in bill_data.items:
                if str(bill_item.product_id) not in po_items_map:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"El producto con ID '{bill_item.product_id}' no pertenece a la orden de compra original.")
                bill_item.quantity_ordered = po_items_map[str(bill_item.product_id)].quantity_ordered
                total_bill_amount += bill_item.quantity_received * bill_item.unit_cost
            bill_to_db = PurchaseBillInDB(purchase_order_id=po_doc.id, supplier_id=po_doc.supplier_id, created_by_id=user.id, bill_number=await _generate_sequential_number(bill_repo, "FC"), total_amount=round(total_bill_amount, 2), supplier_invoice_number=bill_data.supplier_invoice_number, received_date=bill_data.received_date, notes=bill_data.notes, items=bill_data.items)
            inserted_id = await bill_repo.insert_one(bill_to_db.model_dump(by_alias=True), session=session)
            bill_to_db.id = inserted_id
            await inventory_service.add_stock_from_purchase_bill(db, bill_to_db, session=session)
    if not inserted_id:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No se pudo crear la factura de compra.")
    try:
        new_po_status = await _get_new_po_status(db, po_id)
        po_doc_raw_after = await po_repo.find_by_id(po_id)
        po_doc_after = PurchaseOrderInDB.model_validate(po_doc_raw_after)
        update_po_data = {"status": new_po_status, "updated_at": datetime.now(timezone.utc), "related_bill_ids": po_doc_after.related_bill_ids + [inserted_id]}
        await po_repo.update_one_by_id(po_id, update_po_data)
    except Exception as e:
        print(f"ADVERTENCIA: La recepción {inserted_id} fue exitosa, pero falló la actualización de la OC {po_id}. Error: {e}")
    return await get_bill_by_id(db, str(inserted_id))

async def get_bill_by_id(db: AsyncIOMotorDatabase, bill_id: str) -> PurchaseBillOut:
    bill_repo = PurchaseBillRepository(db)
    bill_doc = await bill_repo.find_by_id(bill_id)
    if not bill_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Factura de Compra con ID '{bill_id}' no encontrada.")
    supplier_repo = SupplierRepository(db)
    supplier_doc = await supplier_repo.find_by_id(str(bill_doc.get("supplier_id")))
    bill_doc['supplier'] = supplier_doc or {"business_name": "Proveedor No Encontrado"}
    return PurchaseBillOut.model_validate(bill_doc)

# --- INICIO DEL BLOQUE CORREGIDO ---
async def get_purchase_bills_paginated(db: AsyncIOMotorDatabase, page: int, page_size: int, search: Optional[str]) -> Dict[str, Any]:
    """Recupera una lista paginada de Facturas de Compra, poblando los datos del proveedor y la OC."""
    bill_repo = PurchaseBillRepository(db)
    supplier_repo = SupplierRepository(db)
    po_repo = PurchaseOrderRepository(db) # Se necesita para obtener el número de la OC
    
    query: Dict[str, Any] = {}
    if search:
        query["$or"] = [
            {"bill_number": {"$regex": search, "$options": "i"}},
            {"supplier_invoice_number": {"$regex": search, "$options": "i"}}
        ]
        
    total_count = await bill_repo.count_documents(query)
    skip = (page - 1) * page_size
    sort_options = [("received_date", DESCENDING)]
    
    bill_docs = await bill_repo.find_all_paginated(query, skip, page_size, sort_options)
    
    populated_items = []
    for doc in bill_docs:
        supplier_doc = await supplier_repo.find_by_id(str(doc.get("supplier_id")))
        po_doc = await po_repo.find_by_id(str(doc.get("purchase_order_id")))
        
        # Se construye explícitamente el DTO de respuesta para asegurar que todos los campos existan.
        bill_out_item = PurchaseBillListOut(
            **doc,
            supplier=supplier_doc if supplier_doc else {"business_name": "Proveedor No Encontrado"},
            purchase_order_number=po_doc.get("order_number") if po_doc else "N/A"
        )
        populated_items.append(bill_out_item)

    return {"total_count": total_count, "items": populated_items}
# --- FIN DEL BLOQUE CORREGIDO ---


# ==============================================================================
# SECCIÓN 5: FUNCIONES DE SERVICIO (OPERACIONES ESPECIALES)
# ==============================================================================
# ... (Sin cambios en create_purchase_order_from_file)
async def create_purchase_order_from_file(db: AsyncIOMotorDatabase, file: UploadFile, user: UserOut) -> PurchaseOrderOut:
    try:
        content = await file.read()
        df = pd.read_csv(StringIO(content.decode('utf-8')))
        required_columns = ['sku', 'quantity', 'cost']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"El archivo CSV debe contener las columnas: {', '.join(required_columns)}.")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"No se pudo procesar el archivo. Error: {e}")
    system_supplier = await crm_service.get_or_create_system_supplier(db)
    product_repo = ProductRepository(db)
    items_to_create = []
    for _index, row in df.iterrows():
        product = await product_repo.find_by_sku(row['sku'])
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"El producto con SKU '{row['sku']}' no fue encontrado.")
        items_to_create.append(PurchaseOrderItemCreate(product_id=product["_id"], quantity_ordered=int(row['quantity']), unit_cost=float(row['cost'])))
    po_data = PurchaseOrderCreate(supplier_id=system_supplier.id, order_date=datetime.now(timezone.utc), notes="Orden de compra generada automáticamente por la carga de inventario inicial.", items=items_to_create)
    initial_po = await create_purchase_order(db, po_data, user, "INV-INICIAL")
    await update_purchase_order_status(db, str(initial_po.id), PurchaseOrderStatus.APPROVED, user)
    po_after_approval = await get_purchase_order_by_id(db, str(initial_po.id))
    bill_items = [PurchaseBillItem(product_id=item.product_id, sku=item.sku, name=item.name, quantity_ordered=item.quantity_ordered, quantity_received=item.quantity_ordered, unit_cost=item.unit_cost) for item in po_after_approval.items]
    bill_data = PurchaseBillCreate(supplier_invoice_number=f"INV-INICIAL-{initial_po.order_number}", received_date=datetime.now(timezone.utc), notes="Recepción automática de la carga de inventario inicial.", items=bill_items)
    await process_purchase_receipt(db, str(initial_po.id), bill_data, user)
    return await get_purchase_order_by_id(db, str(initial_po.id))