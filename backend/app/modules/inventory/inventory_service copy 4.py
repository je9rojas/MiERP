# /backend/app/modules/inventory/inventory_service.py

"""
Capa de Servicio para las operaciones transaccionales del Inventario.

Este módulo contiene la lógica de negocio para los movimientos de stock.
Se adhiere al principio de Responsabilidad Única, donde cada función
tiene un propósito claro: registrar entradas físicas, despachar salidas,
o actualizar los totales del inventario.
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
from app.modules.purchasing.purchasing_models import GoodsReceiptInDB

# Repositorios
from .repositories.product_repository import ProductRepository
from .repositories.inventory_lot_repository import InventoryLotRepository

# ==============================================================================
# SECCIÓN 2: LÓGICA DE ENTRADA Y LOTES INICIALES
# ==============================================================================

async def add_stock_from_goods_receipt(
    database: AsyncIOMotorDatabase,
    receipt: GoodsReceiptInDB,
    session: AsyncIOMotorClientSession
) -> None:

    # LOG 1: Punto de entrada
    print("\n[DEBUG-INVENTORY] 1. Iniciando add_stock_from_goods_receipt...")
    print(f"[DEBUG-INVENTORY]    - Recibiendo datos para la recepción N°: {receipt.receipt_number}")

    """
    Registra la entrada de stock basada en una Recepción de Mercancía (GoodsReceipt).
    Por cada ítem en la recepción, crea un nuevo lote de inventario y actualiza el producto.
    """
    lot_repo = InventoryLotRepository(database)
    warehouse_id_placeholder = ObjectId("60d5ec49e7e2d2001e4a0000") # TODO: Reemplazar con lógica dinámica

    for item in receipt.items:

        # LOG 2: Dentro del bucle de ítems
        print(f"[DEBUG-INVENTORY] 2. Procesando ítem del producto ID: {item.product_id} | SKU: {item.sku}")
        print(f"[DEBUG-INVENTORY]    - Cantidad recibida: {item.quantity_received}")
        
        if item.quantity_received <= 0:
            continue

        new_lot = InventoryLotInDB(
            product_id=item.product_id,
            purchase_order_id=receipt.purchase_order_id,
            goods_receipt_id=receipt.id,
            supplier_id=receipt.supplier_id,
            warehouse_id=warehouse_id_placeholder,
            lot_number=f"LOTE-{receipt.receipt_number}-{item.sku}",
            received_on=receipt.received_date,
            acquisition_cost=0, # El costo se actualizará en el paso de facturación de compra
            initial_quantity=item.quantity_received,
            current_quantity=item.quantity_received
        )
        
        document_to_insert = new_lot.model_dump(by_alias=True)
        await lot_repo.insert_one(document_to_insert, session=session)
        
        # LOG 3: Justo antes de actualizar el resumen
        print(f"[DEBUG-INVENTORY] 3. Lote creado. Llamando a update_product_summary_from_lots para el producto ID: {item.product_id}")
        
        await update_product_summary_from_lots(database, str(item.product_id), session=session)

async def create_initial_lot_for_product(
    database: AsyncIOMotorDatabase,
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

    lot_repo = InventoryLotRepository(database)
    warehouse_id_placeholder = ObjectId("60d5ec49e7e2d2001e4a0000") # TODO: Reemplazar con lógica dinámica

    initial_lot = InventoryLotInDB(
        product_id=ObjectId(product_id),
        warehouse_id=warehouse_id_placeholder,
        lot_number=f"INICIAL-{product_sku}",
        acquisition_cost=cost,
        initial_quantity=quantity,
        current_quantity=quantity,
        received_on=datetime.now(timezone.utc)
    )
    
    document_to_insert = initial_lot.model_dump(by_alias=True)
    await lot_repo.insert_one(document_to_insert, session=session)
    await update_product_summary_from_lots(database, product_id, session=session)

# ==============================================================================
# SECCIÓN 3: LÓGICA DE MOVIMIENTOS DE STOCK (FIFO)
# ==============================================================================

async def decrease_stock(
    database: AsyncIOMotorDatabase,
    product_id: str,
    quantity_to_decrease: int,
    session: AsyncIOMotorClientSession
) -> float:
    """
    Disminuye el stock de un producto siguiendo una estrategia FIFO.
    Esta es la función principal a ser llamada por otros servicios (ej: Ventas).
    """
    product_repo = ProductRepository(database)
    lot_repo = InventoryLotRepository(database)
    
    product_document = await product_repo.find_by_id(product_id, session=session)
    if not product_document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con ID '{product_id}' no encontrado.")
    
    if product_document.get('stock_quantity', 0) < quantity_to_decrease:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail=f"Stock insuficiente para SKU '{product_document.get('sku')}'. Solicitado: {quantity_to_decrease}, Disponible: {product_document.get('stock_quantity')}."
        )

    available_lots = await lot_repo.find_available_by_product_id(product_id, sort_options=[("received_on", ASCENDING)], session=session)

    remaining_quantity = quantity_to_decrease
    cost_of_goods_sold = 0.0

    for lot in available_lots:
        if remaining_quantity <= 0: break

        quantity_from_lot = min(lot['current_quantity'], remaining_quantity)
        cost_of_goods_sold += quantity_from_lot * lot['acquisition_cost']
        new_lot_quantity = lot['current_quantity'] - quantity_from_lot
        
        await lot_repo.update_one_by_id(str(lot['_id']), {"current_quantity": new_lot_quantity}, session=session)
        remaining_quantity -= quantity_from_lot

    if remaining_quantity > 0:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Inconsistencia de stock para SKU '{product_document.get('sku')}'.")

    await update_product_summary_from_lots(database, product_id, session=session)
    return cost_of_goods_sold

# ==============================================================================
# SECCIÓN 4: LÓGICA DE ACTUALIZACIÓN DE TOTALES DE PRODUCTO
# ==============================================================================

async def update_product_summary_from_lots(
    database: AsyncIOMotorDatabase, 
    product_id: str, 
    session: Optional[AsyncIOMotorClientSession] = None
) -> None:
    """
    Calcula y actualiza el stock total, costo promedio y valor total de un producto
    basándose en la suma de sus lotes de inventario actuales.
    """
    lot_repo = InventoryLotRepository(database)
    product_repo = ProductRepository(database)

    try:
        product_object_id = ObjectId(product_id)
    except Exception:
        return

    pipeline = [
        {"$match": {"product_id": product_object_id, "current_quantity": {"$gt": 0}}},
        {"$group": {"_id": "$product_id", "total_stock": {"$sum": "$current_quantity"}, "total_value": {"$sum": {"$multiply": ["$current_quantity", "$acquisition_cost"]}}}}
    ]
    
    aggregation_result = await lot_repo.aggregate(pipeline, session=session)
    stats = aggregation_result[0] if aggregation_result else {}
    
    total_stock = stats.get("total_stock", 0)
    total_value = stats.get("total_value", 0.0)
    average_cost = (total_value / total_stock) if total_stock > 0 else 0.0
    
    update_data = {
        "stock_quantity": total_stock,
        "average_cost": round(average_cost, 4),
        "total_value": round(total_value, 2),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await product_repo.update_one_by_id(product_id, update_data, session=session)

# ==============================================================================
# SECCIÓN 5: LÓGICA DE CONSULTA DE LOTES
# ==============================================================================

async def get_lots_by_product_id(database: AsyncIOMotorDatabase, product_id: str) -> List[InventoryLotOut]:
    """
    Obtiene todos los lotes de inventario para un producto específico, enriqueciendo
    la información con el SKU y nombre del producto.
    """
    lot_repo = InventoryLotRepository(database)
    product_repo = ProductRepository(database)
    
    product_document = await product_repo.find_by_id(product_id)
    if not product_document:
        return []
        
    lot_documents = await lot_repo.find_by_product_id(product_id)
    
    enriched_lots = []
    for doc in lot_documents:
        doc["product_sku"] = product_document.get("sku")
        doc["product_name"] = product_document.get("name")
        enriched_lots.append(InventoryLotOut.model_validate(doc))
        
    return enriched_lots