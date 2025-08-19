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

# --- Importaciones de la Librería Estándar y Terceros ---
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorClientSession, AsyncIOMotorDatabase
from pymongo import ASCENDING

# --- Importaciones de la Aplicación ---
# Modelos
from app.modules.purchasing.purchasing_models import GoodsReceiptInDB

from .inventory_models import InventoryLotInDB, InventoryLotOut
# Repositorios
from .repositories.inventory_lot_repository import InventoryLotRepository
from .repositories.product_repository import ProductRepository

# ==============================================================================
# SECCIÓN 2: CONFIGURACIÓN DEL LOGGER
# ==============================================================================

logger = logging.getLogger(__name__)

# ==============================================================================
# SECCIÓN 3: LÓGICA DE ENTRADA DE STOCK Y LOTES
# ==============================================================================

async def add_stock_from_goods_receipt(
    database: AsyncIOMotorDatabase,
    receipt: GoodsReceiptInDB,
    purchase_order_doc: Dict[str, Any], # <-- PARÁMETRO NUEVO
    session: AsyncIOMotorClientSession
) -> None:
    """
    Registra la entrada de stock basada en una Recepción de Mercancía.

    Esta función utiliza el documento de la Orden de Compra proporcionado para
    determinar el costo de adquisición de cada ítem, valorizando el inventario
    correctamente desde el ingreso físico y operando dentro de una transacción.
    """
    logger.info(f"Procesando entrada de stock para la recepción: {receipt.receipt_number} (ID: {receipt.id})")
    lot_repository = InventoryLotRepository(database)
    
    # --- CORRECCIÓN CRÍTICA: Se utiliza el documento de la OC pasado como parámetro ---
    # Se elimina la búsqueda redundante en la base de datos.
    if not purchase_order_doc:
        raise ValueError("El documento de la Orden de Compra no fue proporcionado al servicio de inventario.")
    
    # Crear un mapa de producto_id -> unit_cost para una búsqueda eficiente.
    product_cost_map = {str(item['product_id']): item['unit_cost'] for item in purchase_order_doc.get('items', [])}
    
    warehouse_id_placeholder = ObjectId("60d5ec49e7e2d2001e4a0000")

    for item in receipt.items:
        if item.quantity_received <= 0:
            logger.warning(f"Omitiendo ítem SKU '{item.sku}' de la recepción '{receipt.receipt_number}'. Cantidad recibida es cero o negativa.")
            continue

        # Se busca el costo unitario desde el mapa creado a partir de la Orden de Compra.
        unit_cost = product_cost_map.get(str(item.product_id), 0.0)
        if unit_cost == 0.0:
            logger.warning(f"No se encontró costo para el producto ID '{item.product_id}' en la OC. Se usará 0.0 como costo de adquisición.")

        new_lot = InventoryLotInDB(
            product_id=item.product_id,
            purchase_order_id=receipt.purchase_order_id,
            goods_receipt_id=receipt.id,
            supplier_id=receipt.supplier_id,
            warehouse_id=warehouse_id_placeholder,
            lot_number=f"LOTE-{receipt.receipt_number}-{item.sku}",
            received_on=receipt.received_date,
            acquisition_cost=unit_cost,  # Se utiliza el costo de la OC.
            initial_quantity=item.quantity_received,
            current_quantity=item.quantity_received
        )
        
        logger.debug(f"Datos del nuevo lote a insertar: {new_lot.model_dump_json(indent=2)}")
        
        document_to_insert = new_lot.model_dump(by_alias=True)
        await lot_repository.insert_one(document_to_insert, session=session)
        
        logger.info(f"Lote '{new_lot.lot_number}' creado. Desencadenando actualización de resumen para el producto ID '{item.product_id}'.")
        await update_product_summary_from_lots(database, str(item.product_id), session=session)

async def create_initial_lot_for_product(
    database: AsyncIOMotorDatabase,
    product_id: str,
    product_sku: str,
    quantity: int,
    cost: float,
    session: Optional[AsyncIOMotorClientSession] = None
) -> None:
    """Crea el lote de inventario inicial para un producto recién registrado."""
    if quantity <= 0:
        logger.info(f"No se creó lote inicial para SKU '{product_sku}' porque la cantidad inicial es cero.")
        return

    lot_repository = InventoryLotRepository(database)
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
    
    document_to_insert = initial_lot.model_dump(by_alias=True)
    await lot_repository.insert_one(document_to_insert, session=session)
    await update_product_summary_from_lots(database, product_id, session=session)

# ==============================================================================
# SECCIÓN 4: LÓGICA DE SALIDA DE STOCK (FIFO)
# ==============================================================================
# (Esta sección no requiere cambios y se mantiene igual)

async def decrease_stock(
    database: AsyncIOMotorDatabase,
    product_id: str,
    quantity_to_decrease: int,
    session: AsyncIOMotorClientSession
) -> float:
    """Disminuye el stock de un producto siguiendo una estrategia FIFO."""
    product_repository = ProductRepository(database)
    lot_repository = InventoryLotRepository(database)
    
    product_document = await product_repository.find_by_id(product_id, session=session)
    if not product_document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con ID '{product_id}' no encontrado.")
    
    current_stock = product_document.get('stock_quantity', 0)
    if current_stock < quantity_to_decrease:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail=f"Stock insuficiente para SKU '{product_document.get('sku')}'. Solicitado: {quantity_to_decrease}, Disponible: {current_stock}."
        )

    available_lots = await lot_repository.find_available_by_product_id(product_id, sort_options=[("received_on", ASCENDING)], session=session)

    remaining_quantity_to_dispatch = quantity_to_decrease
    cost_of_goods_sold = 0.0

    for lot in available_lots:
        if remaining_quantity_to_dispatch <= 0:
            break

        quantity_from_this_lot = min(lot['current_quantity'], remaining_quantity_to_dispatch)
        cost_of_goods_sold += quantity_from_this_lot * lot['acquisition_cost']
        new_lot_quantity = lot['current_quantity'] - quantity_from_this_lot
        
        await lot_repository.update_one_by_id(str(lot['_id']), {"current_quantity": new_lot_quantity}, session=session)
        remaining_quantity_to_dispatch -= quantity_from_this_lot

    if remaining_quantity_to_dispatch > 0:
        logger.error(f"INCONSISTENCIA DE STOCK para SKU '{product_document.get('sku')}'. El stock total era {current_stock}, pero no se encontraron lotes suficientes.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Inconsistencia de stock para SKU '{product_document.get('sku')}'.")

    await update_product_summary_from_lots(database, product_id, session=session)
    return cost_of_goods_sold

# ==============================================================================
# SECCIÓN 5: LÓGICA DE ACTUALIZACIÓN DE TOTALES DE PRODUCTO
# ==============================================================================
# (Esta sección no requiere cambios y se mantiene igual)

async def update_product_summary_from_lots(
    database: AsyncIOMotorDatabase, 
    product_id_str: str, 
    session: Optional[AsyncIOMotorClientSession] = None
) -> None:
    """Calcula y actualiza los totales de inventario de un producto basándose en sus lotes."""
    if not ObjectId.is_valid(product_id_str):
        logger.error(f"ID de producto inválido '{product_id_str}' recibido en 'update_product_summary_from_lots'. Se omite la actualización.")
        return

    lot_repository = InventoryLotRepository(database)
    product_repository = ProductRepository(database)
    product_object_id = ObjectId(product_id_str)

    pipeline = [
        {"$match": {"product_id": product_object_id, "current_quantity": {"$gt": 0}}},
        {"$group": {
            "_id": "$product_id",
            "total_stock": {"$sum": "$current_quantity"},
            "total_value": {"$sum": {"$multiply": ["$current_quantity", "$acquisition_cost"]}}
        }}
    ]
    
    aggregation_result = await lot_repository.aggregate(pipeline, session=session)
    
    logger.debug(f"Resultado de la agregación para el producto ID '{product_id_str}': {aggregation_result}")
    
    stats = aggregation_result[0] if aggregation_result else {}
    
    total_stock = stats.get("total_stock", 0)
    total_value = stats.get("total_value", 0.0)
    average_cost = (total_value / total_stock) if total_stock > 0 else 0.0
    
    logger.info(f"PRODUCTO ID: {product_id_str} | STOCK CALCULADO DESDE LOTES: {total_stock} | VALOR TOTAL: {total_value}")

    update_data = {
        "stock_quantity": total_stock,
        "average_cost": round(average_cost, 4),
        "total_value": round(total_value, 2),
        "updated_at": datetime.now(timezone.utc)
    }
    
    logger.debug(f"Datos a actualizar en el producto '{product_id_str}': {update_data}")
    
    await product_repository.update_one_by_id(product_id_str, update_data, session=session)
    logger.info(f"Resumen de stock para el producto ID '{product_id_str}' actualizado exitosamente.")

# ==============================================================================
# SECCIÓN 6: LÓGICA DE CONSULTA DE LOTES
# ==============================================================================
# (Esta sección no requiere cambios y se mantiene igual)

async def get_lots_by_product_id(database: AsyncIOMotorDatabase, product_id: str) -> List[InventoryLotOut]:
    """Obtiene todos los lotes de inventario para un producto específico."""
    lot_repository = InventoryLotRepository(database)
    product_repository = ProductRepository(database)
    
    product_document = await product_repository.find_by_id(product_id)
    if not product_document:
        logger.warning(f"Se solicitó buscar lotes para un producto inexistente con ID: {product_id}")
        return []
        
    lot_documents = await lot_repository.find_by_product_id(product_id)
    
    enriched_lots = []
    for doc in lot_documents:
        doc["product_sku"] = product_document.get("sku")
        doc["product_name"] = product_document.get("name")
        enriched_lots.append(InventoryLotOut.model_validate(doc))
        
    return enriched_lots