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
# --- CORRECCIÓN ARQUITECTÓNICA ---
# Se elimina la dependencia directa del módulo de compras.
# Ahora se define un modelo de entrada genérico para desacoplar los servicios.
from .inventory_models import (
    InventoryLotInDB,
    InventoryLotOut,
    StockEntryItem
)
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

async def add_stock_from_external_document(
    database: AsyncIOMotorDatabase,
    items_to_add: List[StockEntryItem],
    session: AsyncIOMotorClientSession
) -> None:
    """
    Registra la entrada de stock desde un documento externo (ej. una Recepción).

    Esta función está desacoplada del origen de los datos. Acepta una lista
    genérica de ítems a ingresar, permitiendo que sea reutilizada por diferentes
    flujos de negocio (compras, devoluciones de ventas, etc.).
    """
    logger.info(f"Procesando entrada de stock para {len(items_to_add)} ítems.")
    lot_repository = InventoryLotRepository(database)
    warehouse_id_placeholder = ObjectId("60d5ec49e7e2d2001e4a0000") # Placeholder

    for item in items_to_add:
        if item.quantity_received <= 0:
            logger.warning(f"Omitiendo ítem SKU '{item.sku}'. Cantidad recibida es <= 0.")
            continue

        try:
            document_to_insert = {
                "_id": ObjectId(),
                "product_id": item.product_id,
                "purchase_order_id": item.purchase_order_id,
                "goods_receipt_id": item.source_document_id,
                "supplier_id": item.supplier_id,
                "warehouse_id": warehouse_id_placeholder,
                "lot_number": f"LOTE-{item.source_document_number}-{item.sku}",
                "received_on": item.received_date,
                "acquisition_cost": item.unit_cost,
                "initial_quantity": item.quantity_received,
                "current_quantity": item.quantity_received,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            
            await lot_repository.insert_one(document_to_insert, session=session)
            
            logger.info(f"Lote '{document_to_insert['lot_number']}' creado. Desencadenando actualización para producto ID '{item.product_id}'.")
            await update_product_summary_from_lots(database, str(item.product_id), session=session)

        except InvalidId as error:
            logger.error(f"Error Crítico: ID inválido al crear lote para SKU '{item.sku}'. Error: {error}. Omitiendo lote.")
            continue
        except Exception as error:
            logger.error(f"Error inesperado al crear lote para SKU '{item.sku}': {error}", exc_info=True)
            raise

async def create_initial_lot_for_product(
    database: AsyncIOMotorDatabase,
    product_id: str,
    product_sku: str,
    quantity: int,
    cost: float,
    session: Optional[AsyncIOMotorClientSession] = None
) -> None:
    """Crea el lote de inventario inicial para un producto, asegurando tipos de BSON correctos."""
    if quantity <= 0:
        logger.info(f"No se creó lote inicial para SKU '{product_sku}' porque la cantidad inicial es cero.")
        return

    lot_repository = InventoryLotRepository(database)
    warehouse_id_placeholder = ObjectId("60d5ec49e7e2d2001e4a0000")

    try:
        document_to_insert = {
            "_id": ObjectId(),
            "product_id": ObjectId(product_id),
            "purchase_order_id": None,
            "goods_receipt_id": None,
            "supplier_id": None,
            "warehouse_id": warehouse_id_placeholder,
            "lot_number": f"INICIAL-{product_sku}",
            "received_on": datetime.now(timezone.utc),
            "acquisition_cost": cost,
            "initial_quantity": quantity,
            "current_quantity": quantity,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        await lot_repository.insert_one(document_to_insert, session=session)
        await update_product_summary_from_lots(database, product_id, session=session)

    except InvalidId as error:
        logger.error(f"Error Crítico: ID de producto inválido '{product_id}' al crear lote inicial. Error: {error}")
        raise HTTPException(status_code=500, detail="No se pudo crear el lote inicial debido a un ID de producto inválido.")

# ==============================================================================
# SECCIÓN 4: LÓGICA DE SALIDA DE STOCK (FIFO)
# ==============================================================================

async def decrease_stock(
    database: AsyncIOMotorDatabase, product_id: str, quantity_to_decrease: int,
    session: AsyncIOMotorClientSession
) -> float:
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
        if remaining_quantity_to_dispatch <= 0: break
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

async def update_product_summary_from_lots(
    database: AsyncIOMotorDatabase, 
    product_id_str: str, 
    session: Optional[AsyncIOMotorClientSession] = None
) -> None:
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
    
    await product_repository.update_one_by_id(product_id_str, update_data, session=session)
    logger.info(f"Resumen de stock para el producto ID '{product_id_str}' actualizado exitosamente.")

# ==============================================================================
# SECCIÓN 6: LÓGICA DE CONSULTA DE LOTES
# ==============================================================================

async def get_lots_by_product_id(database: AsyncIOMotorDatabase, product_id: str) -> List[InventoryLotOut]:
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