# backend/app/modules/purchasing/purchasing_service.py

"""
Capa de Servicio para la lógica de negocio del módulo de Compras.

Este módulo orquesta las operaciones de las órdenes de compra, aplicando validaciones,
enriqueciendo los datos, calculando totales y coordinando con las capas de repositorio
para la persistencia de datos. También se comunica con el servicio de inventario
para registrar los movimientos de stock correspondientes.
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

from .repositories.purchase_order_repository import PurchaseOrderRepository
from app.modules.inventory.repositories.product_repository import ProductRepository
from app.modules.crm.repositories.supplier_repository import SupplierRepository
from app.modules.inventory.repositories.inventory_lot_repository import InventoryLotRepository
from app.modules.users.user_models import UserOut
from .purchasing_models import (
    PurchaseOrderCreate, PurchaseOrderItem, PurchaseOrderInDB,
    PurchaseOrderOut, PurchaseOrderStatus, PurchaseOrderUpdate
)
from app.modules.inventory.inventory_models import InventoryLotInDB
from app.modules.inventory import inventory_service
from app.modules.crm import crm_service

# ==============================================================================
# SECCIÓN 2: FUNCIONES DE AYUDA PRIVADAS
# ==============================================================================

async def _validate_and_enrich_items(db: AsyncIOMotorDatabase, items_data: List) -> (List[PurchaseOrderItem], float):
    """Valida productos, enriquece los ítems y calcula el total de la orden."""
    product_repo = ProductRepository(db)
    enriched_items = []
    total_amount = 0.0

    for item_in in items_data:
        product_id_str = str(item_in.product_id)
        product_doc = await product_repo.find_by_id(product_id_str)
        if not product_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"El producto con ID '{product_id_str}' no existe.")
        
        item_total = item_in.quantity_ordered * item_in.unit_cost
        total_amount += item_total
        
        enriched_item = PurchaseOrderItem(
            product_id=item_in.product_id,
            sku=product_doc.get("sku", "N/A"),
            name=product_doc.get("name", "Producto no encontrado"),
            quantity_ordered=item_in.quantity_ordered,
            unit_cost=item_in.unit_cost,
        )
        enriched_items.append(enriched_item)
        
    return enriched_items, total_amount

async def _generate_po_number(db: AsyncIOMotorDatabase, prefix: str = "OC") -> str:
    """Genera un número de orden de compra único y secuencial."""
    po_repo = PurchaseOrderRepository(db)
    last_po = await po_repo.find_one_sorted([("created_at", DESCENDING)])
    if last_po and last_po.get("order_number", "").startswith(f"{prefix}-"):
        try:
            last_num = int(last_po["order_number"].split('-')[-1])
            new_num = last_num + 1
            return f"{prefix}-{datetime.now().year}-{str(new_num).zfill(5)}"
        except (ValueError, IndexError):
            pass
    
    return f"{prefix}-{datetime.now().year}-{'1'.zfill(5)}"

# ==============================================================================
# SECCIÓN 3: FUNCIONES DEL SERVICIO (OPERACIONES CRUD)
# ==============================================================================

async def create_purchase_order(
    db: AsyncIOMotorDatabase, po_data: PurchaseOrderCreate, user: UserOut, prefix: str = "OC"
) -> PurchaseOrderOut:
    """
    Crea una nueva Orden de Compra en estado 'Borrador'.
    """
    po_repo = PurchaseOrderRepository(db)
    supplier_repo = SupplierRepository(db)

    supplier_doc = await supplier_repo.find_by_id(str(po_data.supplier_id))
    if not supplier_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El proveedor especificado no existe.")

    enriched_items, total_amount = await _validate_and_enrich_items(db, po_data.items)
    order_number = await _generate_po_number(db, prefix)

    po_to_db = PurchaseOrderInDB(
        order_number=order_number, supplier_id=po_data.supplier_id, created_by_id=user.id,
        order_date=po_data.order_date, expected_delivery_date=po_data.expected_delivery_date,
        notes=po_data.notes, items=enriched_items, total_amount=round(total_amount, 2),
        status=PurchaseOrderStatus.DRAFT
    )

    inserted_id = await po_repo.insert_one(po_to_db.model_dump(by_alias=True))
    created_po_doc = await po_repo.find_by_id(str(inserted_id))
    created_po_doc['supplier'] = supplier_doc
    return PurchaseOrderOut.model_validate(created_po_doc)

async def get_purchase_order_by_id(db: AsyncIOMotorDatabase, order_id: str) -> PurchaseOrderOut:
    """
    Obtiene una única Orden de Compra por su ID, enriqueciendo los datos del proveedor.
    """
    po_repo = PurchaseOrderRepository(db)
    supplier_repo = SupplierRepository(db)

    po_doc = await po_repo.find_by_id(order_id)
    if not po_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"La Orden de Compra con ID '{order_id}' no fue encontrada.")
    
    supplier_doc = await supplier_repo.find_by_id(str(po_doc.get("supplier_id")))
    po_doc['supplier'] = supplier_doc or {"business_name": "Proveedor no encontrado"}
    return PurchaseOrderOut.model_validate(po_doc)

async def get_purchase_orders_paginated(db: AsyncIOMotorDatabase, page: int, page_size: int, search: Optional[str]) -> Dict[str, Any]:
    """
    Recupera una lista paginada de Órdenes de Compra, poblando los datos del proveedor.
    """
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
    """
    Actualiza una Orden de Compra existente. Solo permite la edición si está en estado 'Borrador'.
    """
    po_repo = PurchaseOrderRepository(db)
    
    # 1. Validar que la orden de compra exista.
    po_doc = await po_repo.find_by_id(order_id)
    if not po_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Compra no existe.")
    
    # 2. Lógica de Negocio: Solo se pueden editar órdenes en estado 'Borrador'.
    if po_doc.get('status') != PurchaseOrderStatus.DRAFT:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Solo se pueden editar Órdenes de Compra en estado 'Borrador'.")

    # 3. Preparar los datos a actualizar.
    update_data = {}
    if po_data.items:
        enriched_items, total_amount = await _validate_and_enrich_items(db, po_data.items)
        update_data["items"] = [item.model_dump() for item in enriched_items]
        update_data["total_amount"] = round(total_amount, 2)
    
    if po_data.notes is not None:
        update_data["notes"] = po_data.notes
    
    if po_data.expected_delivery_date is not None:
        update_data["expected_delivery_date"] = po_data.expected_delivery_date
    
    if not update_data:
        # Si no hay nada que actualizar, se devuelve la orden como está.
        return await get_purchase_order_by_id(db, order_id)
        
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    # 4. Ejecutar la actualización y devolver la orden actualizada.
    await po_repo.update_one_by_id(order_id, update_data)
    
    return await get_purchase_order_by_id(db, order_id)

# ==============================================================================
# SECCIÓN 4: FUNCIONES DEL SERVICIO (OPERACIONES DE ACCIÓN)
# ==============================================================================

async def receive_purchase_order(db: AsyncIOMotorDatabase, po_id: str, user: UserOut) -> Dict[str, str]:
    """
    Marca una Orden de Compra como recibida y crea los lotes de inventario correspondientes.
    """
    po_repo = PurchaseOrderRepository(db)
    lot_repo = InventoryLotRepository(db)

    po_doc = await po_repo.find_by_id(po_id)
    if not po_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Compra no existe.")
    if po_doc["status"] == PurchaseOrderStatus.COMPLETED:
         raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Esta orden de compra ya ha sido recibida.")

    for item in po_doc['items']:
        lot_doc_model = InventoryLotInDB(
            product_id=item['product_id'], purchase_order_id=po_doc['_id'], supplier_id=po_doc['supplier_id'],
            warehouse_id=user.warehouse_id, lot_number=f"LOTE-{po_doc['order_number']}-{item['sku']}",
            received_on=datetime.now(timezone.utc), acquisition_cost=item['unit_cost'],
            initial_quantity=item['quantity_ordered'], current_quantity=item['quantity_ordered'],
        )
        await lot_repo.insert_one(lot_doc_model.model_dump(by_alias=True))
        await inventory_service.update_product_summary_from_lots(db, str(item['product_id']))

    await po_repo.update_one_by_id(po_id, {"status": PurchaseOrderStatus.COMPLETED, "received_date": datetime.now(timezone.utc)})
    return {"status": "success", "message": "Mercancía recibida y lotes de inventario creados."}

async def create_purchase_order_from_file(db: AsyncIOMotorDatabase, file: UploadFile, user: UserOut) -> PurchaseOrderOut:
    """
    Crea y recibe una Orden de Compra a partir de un archivo CSV de inventario inicial.
    """
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
    for index, row in df.iterrows():
        product = await product_repo.find_by_sku(row['sku'])
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Fila {index + 2}: El producto con SKU '{row['sku']}' no fue encontrado.")
        items_to_create.append({"product_id": product["_id"], "quantity_ordered": int(row['quantity']), "unit_cost": float(row['cost'])})

    po_data = PurchaseOrderCreate(
        supplier_id=system_supplier.id, order_date=datetime.now(timezone.utc),
        notes="Orden de compra generada automáticamente por la carga de inventario inicial.",
        items=items_to_create
    )
    
    initial_inventory_po = await create_purchase_order(db, po_data, user, "INV-INICIAL")
    await receive_purchase_order(db, str(initial_inventory_po.id), user)
    return await get_purchase_order_by_id(db, str(initial_inventory_po.id))