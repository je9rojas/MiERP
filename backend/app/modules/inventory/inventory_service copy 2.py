# backend/app/modules/inventory/inventory_service.py

"""
Capa de Servicio para las operaciones transaccionales del Inventario.

Este módulo contiene la lógica de negocio para los movimientos de stock.
Se adhiere al principio de Responsabilidad Única, donde cada función
tiene un propósito claro: registrar entradas físicas (GoodsReceipt), despachar
salidas (Shipment), o actualizar los totales del inventario.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorClientSession
from datetime import datetime, timezone
from bson import ObjectId
from typing import List, Optional
from fastapi import HTTPException, status
from pymongo import ASCENDING

# Modelos
from .inventory_models import InventoryLotInDB, InventoryLotOut
from app.modules.sales.sales_models import SalesOrderItem
# Se importa el nuevo modelo de la recepción de mercancía
from app.modules.purchasing.purchasing_models import GoodsReceiptInDB

# Repositorios
from .repositories.product_repository import ProductRepository
from .repositories.inventory_lot_repository import InventoryLotRepository

# ==============================================================================
# SECCIÓN 2: LÓGICA DE ENTRADA DE STOCK (ADQUISICIÓN)
# ==============================================================================

async def add_stock_from_goods_receipt(
    db: AsyncIOMotorDatabase,
    receipt: GoodsReceiptInDB,
    session: AsyncIOMotorClientSession
) -> None:
    """
    Registra la entrada de stock basada en una Recepción de Mercancía (GoodsReceipt).

    Por cada ítem en la recepción, crea un nuevo lote de inventario. El costo de
    adquisición de este lote se tomará del costo definido en la Orden de Compra
    original, ya que este es el momento del registro físico, no el financiero.
    Luego, actualiza el resumen del producto correspondiente (stock total).

    Args:
        db: La instancia de la base de datos.
        receipt: El objeto de la recepción de mercancía (`GoodsReceiptInDB`).
        session: La sesión de MongoDB para garantizar la atomicidad de la transacción.
    """
    lot_repo = InventoryLotRepository(db)
    
    # NOTA: El ID del almacén debe ser dinámico.
    warehouse_id_placeholder = ObjectId("60d5ec49e7e2d2001e4a0000")

    for item in receipt.items:
        if item.quantity_received <= 0:
            continue

        # NOTA IMPORTANTE: En este modelo, el costo de adquisición se registrará
        # cuando se cree la Factura de Compra (PurchaseBill). Por ahora, el lote
        # se crea y el costo promedio se actualizará después.
        new_lot = InventoryLotInDB(
            product_id=item.product_id,
            purchase_order_id=receipt.purchase_order_id,
            goods_receipt_id=receipt.id, # Trazabilidad al documento físico
            supplier_id=receipt.supplier_id,
            warehouse_id=warehouse_id_placeholder,
            lot_number=f"LOTE-{receipt.receipt_number}-{item.sku}",
            received_on=receipt.received_date,
            acquisition_cost=0, # El costo real se definirá en el paso de facturación
            initial_quantity=item.quantity_received,
            current_quantity=item.quantity_received
        )
        
        await lot_repo.insert_one(new_lot.model_dump(by_alias=True), session=session)
        
        # Después de crear cada lote, se actualiza el resumen de stock del producto.
        await update_product_summary_from_lots(db, str(item.product_id), session=session)


async def create_initial_lot_for_product(
    db: AsyncIOMotorDatabase,
    product_id: str,
    product_sku: str,
    quantity: int,
    cost: float,
    session: Optional[AsyncIOMotorClientSession] = None
) -> None:
    """
    Crea el lote de inventario inicial para un producto recién registrado.
    """
    if quantity <= 0:
        return

    lot_repo = InventoryLotRepository(db)
    warehouse_id_placeholder = ObjectId("60d5ec49e7e2d2001e4a0000")

    initial_lot = InventoryLotInDB(
        product_id=ObjectId(product_id),
        warehouse_id=warehouse_id_placeholder,
        lot_number=f"INICIAL-{product_sku}",
        acquisition_cost=cost,
        initial_quantity=quantity,
        current_quantity=quantity,
        received_on=datetime.now(timezone.utc)
    )
    
    await lot_repo.insert_one(initial_lot.model_dump(by_alias=True), session=session)
    await update_product_summary_from_lots(db, product_id, session=session)

# ==============================================================================
# SECCIÓN 3: LÓGICA DE SALIDA DE STOCK (DESPACHO - FIFO)
# ==============================================================================
# ... (Sin cambios en dispatch_stock_for_sale)
async def dispatch_stock_for_sale(db: AsyncIOMotorDatabase, items_sold: List[SalesOrderItem], session: AsyncIOMotorClientSession) -> float:
    product_repo = ProductRepository(db)
    lot_repo = InventoryLotRepository(db)
    total_cost_of_goods_sold = 0.0
    for item in items_sold:
        product_doc = await product_repo.find_by_id(str(item.product_id), session=session)
        if not product_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con ID '{item.product_id}' no encontrado.")
        if product_doc.get('stock_quantity', 0) < item.quantity:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Stock insuficiente para SKU '{product_doc.get('sku')}'. Solicitado: {item.quantity}, Disponible: {product_doc.get('stock_quantity')}.")
        available_lots = await lot_repo.find_available_by_product_id(str(item.product_id), sort_options=[("received_on", ASCENDING)], session=session)
        quantity_to_dispatch = item.quantity
        for lot in available_lots:
            if quantity_to_dispatch <= 0: break
            quantity_from_this_lot = min(lot['current_quantity'], quantity_to_dispatch)
            total_cost_of_goods_sold += quantity_from_this_lot * lot['acquisition_cost']
            new_quantity = lot['current_quantity'] - quantity_from_this_lot
            await lot_repo.update_one_by_id(str(lot['_id']), {"current_quantity": new_quantity}, session=session)
            quantity_to_dispatch -= quantity_from_this_lot
        if quantity_to_dispatch > 0:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Inconsistencia de stock para SKU '{product_doc.get('sku')}'.")
        await update_product_summary_from_lots(db, str(item.product_id), session=session)
    return total_cost_of_goods_sold

# ==============================================================================
# SECCIÓN 4: LÓGICA DE ACTUALIZACIÓN DE TOTALES DE PRODUCTO
# ==============================================================================
# ... (Sin cambios en update_product_summary_from_lots y get_lots_by_product_id)
async def update_product_summary_from_lots(db: AsyncIOMotorDatabase, product_id: str, session: Optional[AsyncIOMotorClientSession] = None) -> None:
    lot_repo = InventoryLotRepository(db)
    product_repo = ProductRepository(db)
    try:
        product_object_id = ObjectId(product_id)
    except Exception:
        return
    pipeline = [{"$match": {"product_id": product_object_id, "current_quantity": {"$gt": 0}}}, {"$group": {"_id": "$product_id", "total_stock": {"$sum": "$current_quantity"}, "total_value": {"$sum": {"$multiply": ["$current_quantity", "$acquisition_cost"]}}}}]
    aggregation_result = await lot_repo.aggregate(pipeline, session=session)
    stats = aggregation_result[0] if aggregation_result else {}
    total_stock = stats.get("total_stock", 0)
    total_value = stats.get("total_value", 0.0)
    average_cost = total_value / total_stock if total_stock > 0 else 0.0
    update_data = {"stock_quantity": total_stock, "average_cost": round(average_cost, 4), "total_value": round(total_value, 2), "updated_at": datetime.now(timezone.utc)}
    await product_repo.update_one_by_id(product_id, update_data, session=session)

async def get_lots_by_product_id(db: AsyncIOMotorDatabase, product_id: str) -> List[InventoryLotOut]:
    lot_repo = InventoryLotRepository(db)
    product_repo = ProductRepository(db)
    product_doc = await product_repo.find_by_id(product_id)
    if not product_doc:
        return []
    lot_docs = await lot_repo.find_by_product_id(product_id)
    enriched_lots = []
    for doc in lot_docs:
        doc["product_sku"] = product_doc.get("sku")
        doc["product_name"] = product_doc.get("name")
        enriched_lots.append(InventoryLotOut.model_validate(doc))
    return enriched_lots