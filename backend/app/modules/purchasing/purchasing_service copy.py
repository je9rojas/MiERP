# /backend/app/modules/purchasing/purchasing_service.py

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

from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from fastapi import HTTPException, status
from pymongo import DESCENDING

# Repositorios
from .repositories.purchase_order_repository import PurchaseOrderRepository
from app.modules.inventory.repositories.product_repository import ProductRepository
from app.modules.crm.repositories.supplier_repository import SupplierRepository
from app.modules.inventory.repositories.inventory_lot_repository import InventoryLotRepository

# Modelos
from app.modules.users.user_models import UserOut
from .purchasing_models import (
    PurchaseOrderCreate,
    PurchaseOrderItem,
    PurchaseOrderInDB,
    PurchaseOrderOut,
    PurchaseOrderStatus
)
from app.modules.inventory.inventory_models import InventoryLotInDB

# Servicios
from app.modules.inventory import inventory_service

# ==============================================================================
# SECCIÓN 2: FUNCIONES DE AYUDA PRIVADAS
# ==============================================================================

async def _validate_and_enrich_items(db: AsyncIOMotorDatabase, items_data: List) -> (List[PurchaseOrderItem], float):
    """Valida productos, enriquece los ítems y calcula el total de la orden."""
    product_repo = ProductRepository(db)
    enriched_items = []
    total_amount = 0.0

    for item_in in items_data:
        product_doc = await product_repo.find_by_id(str(item_in.product_id))
        if not product_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"El producto con ID '{item_in.product_id}' no existe."
            )
        
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

async def _generate_po_number(db: AsyncIOMotorDatabase) -> str:
    """Genera un número de orden de compra único."""
    timestamp = int(datetime.now(timezone.utc).timestamp())
    # En producción, esto debería usar un contador atómico de MongoDB.
    return f"OC-{timestamp}"

# ==============================================================================
# SECCIÓN 3: FUNCIONES PÚBLICAS DEL SERVICIO
# ==============================================================================

async def create_purchase_order(db: AsyncIOMotorDatabase, po_data: PurchaseOrderCreate, user: UserOut) -> PurchaseOrderOut:
    """
    Crea una nueva Orden de Compra en estado 'Borrador'. Esta operación no afecta al stock.
    """
    po_repo = PurchaseOrderRepository(db)
    supplier_repo = SupplierRepository(db)

    supplier_doc = await supplier_repo.find_by_id(str(po_data.supplier_id))
    if not supplier_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El proveedor especificado no existe.")

    enriched_items, total_amount = await _validate_and_enrich_items(db, po_data.items)
    order_number = await _generate_po_number(db)

    po_to_db = PurchaseOrderInDB(
        order_number=order_number,
        supplier_id=po_data.supplier_id,
        created_by_id=user.id,
        order_date=po_data.order_date,
        expected_delivery_date=po_data.expected_delivery_date,
        notes=po_data.notes,
        items=enriched_items,
        total_amount=round(total_amount, 2),
        status=PurchaseOrderStatus.DRAFT
    )

    inserted_id = await po_repo.insert_one(po_to_db.model_dump(by_alias=True))
    created_po_doc = await po_repo.find_by_id(str(inserted_id))

    created_po_doc['supplier'] = supplier_doc
    return PurchaseOrderOut.model_validate(created_po_doc)


async def receive_purchase_order(db: AsyncIOMotorDatabase, po_id: str, user: UserOut):
    """
    Marca una Orden de Compra como recibida, crea los lotes de inventario
    correspondientes y delega la actualización del stock al servicio de inventario.
    """
    po_repo = PurchaseOrderRepository(db)
    lot_repo = InventoryLotRepository(db)

    po_doc = await po_repo.find_by_id(po_id)
    if not po_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La Orden de Compra no existe.")
    
    # Aquí se añadiría la lógica para validar si la orden puede ser recibida (ej. debe estar 'Aprobada')

    for item in po_doc['items']:
        lot_doc_model = InventoryLotInDB(
            product_id=item['product_id'],
            purchase_order_id=po_doc['_id'],
            supplier_id=po_doc['supplier_id'],
            warehouse_id=user.warehouse_id, # Asume que el usuario tiene un almacén asignado
            lot_number=f"LOTE-{po_doc['order_number']}-{item['sku']}",
            received_on=datetime.now(timezone.utc),
            acquisition_cost=item['unit_cost'],
            initial_quantity=item['quantity_ordered'],
            current_quantity=item['quantity_ordered'],
        )
        await lot_repo.insert_one(lot_doc_model.model_dump(by_alias=True))
        
        await inventory_service.update_product_summary_from_lots(db, str(item['product_id']))

    await po_repo.update_one_by_id(po_id, {"status": PurchaseOrderStatus.COMPLETED})
    return {"status": "success", "message": "Mercancía recibida y lotes de inventario creados."}


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