# backend/app/modules/inventory/inventory_service.py

"""
Capa de Servicio para las operaciones transaccionales del Inventario.

Este módulo contiene la lógica de negocio para los movimientos de stock,
como la actualización de cantidades y costos basados en los lotes, y
la lógica de despacho de mercancía para las ventas (PEPS/FIFO).
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

# Repositorios
from .repositories.product_repository import ProductRepository
from .repositories.inventory_lot_repository import InventoryLotRepository

# ==============================================================================
# SECCIÓN 2: LÓGICA DE ENTRADA DE STOCK (ADQUISICIÓN)
# ==============================================================================

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
    Esta función es llamada después de que el producto maestro ha sido creado.

    Args:
        db: La instancia de la base de datos.
        product_id: El ID del producto maestro al que pertenece este lote.
        product_sku: El SKU del producto, usado para generar un número de lote descriptivo.
        quantity: La cantidad de unidades en este lote inicial.
        cost: El costo de adquisición por unidad para este lote.
        session: Una sesión de MongoDB opcional para transacciones.
    """
    if quantity <= 0:
        return

    lot_repo = InventoryLotRepository(db)
    
    # NOTA A FUTURO: El ID del almacén debe ser dinámico o venir de la configuración.
    # Por ahora, se usa un valor placeholder.
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
    
    # Después de crear el lote, se actualiza el resumen del producto.
    await update_product_summary_from_lots(db, product_id, session=session)


# ==============================================================================
# SECCIÓN 3: LÓGICA DE SALIDA DE STOCK (DESPACHO)
# ==============================================================================

async def dispatch_stock_for_sale(
    db: AsyncIOMotorDatabase,
    items_sold: List[SalesOrderItem],
    session: Optional[AsyncIOMotorClientSession] = None
) -> float:
    """
    Gestiona la salida de stock para una venta, aplicando el método PEPS/FIFO.

    Args:
        db: La instancia de la base de datos.
        items_sold: Una lista de objetos `SalesOrderItem` que representan la venta.
        session: Una sesión de MongoDB opcional para transacciones.

    Returns:
        El costo total de la mercancía vendida (CMV) para esta venta específica.

    Raises:
        HTTPException(409): Si no hay suficiente stock para completar la venta.
        HTTPException(500): Si hay una inconsistencia de datos entre el stock total y los lotes.
    """
    product_repo = ProductRepository(db)
    lot_repo = InventoryLotRepository(db)
    total_cost_of_goods_sold = 0.0

    for item in items_sold:
        product_doc = await product_repo.find_by_id(str(item.product_id), session=session)
        if not product_doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con ID '{item.product_id}' no encontrado.")

        if product_doc.get('stock_quantity', 0) < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Stock insuficiente para SKU '{product_doc.get('sku')}'. Solicitado: {item.quantity}, Disponible: {product_doc.get('stock_quantity')}."
            )

        available_lots = await lot_repo.find_available_by_product_id(
            str(item.product_id), sort_options=[("received_on", ASCENDING)], session=session
        )

        quantity_to_dispatch = item.quantity
        for lot in available_lots:
            if quantity_to_dispatch <= 0:
                break

            quantity_from_this_lot = min(lot['current_quantity'], quantity_to_dispatch)
            total_cost_of_goods_sold += quantity_from_this_lot * lot['acquisition_cost']
            
            new_quantity = lot['current_quantity'] - quantity_from_this_lot
            await lot_repo.update_one_by_id(str(lot['_id']), {"current_quantity": new_quantity}, session=session)
            
            quantity_to_dispatch -= quantity_from_this_lot

        if quantity_to_dispatch > 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Inconsistencia de stock para SKU '{product_doc.get('sku')}'. No se pudieron despachar todas las unidades."
            )

        await update_product_summary_from_lots(db, str(item.product_id), session=session)

    return total_cost_of_goods_sold

# ==============================================================================
# SECCIÓN 4: LÓGICA DE ACTUALIZACIÓN DE STOCK
# ==============================================================================

async def update_product_summary_from_lots(
    db: AsyncIOMotorDatabase,
    product_id: str,
    session: Optional[AsyncIOMotorClientSession] = None
) -> None:
    """
    Recalcula y actualiza el stock total y el costo promedio de un producto maestro.
    Esta función es la única fuente de verdad para los totales de un producto.
    """
    lot_repo = InventoryLotRepository(db)
    product_repo = ProductRepository(db)

    pipeline = [
        {"$match": {"product_id": ObjectId(product_id), "current_quantity": {"$gt": 0}}},
        {"$group": {
            "_id": "$product_id",
            "total_stock": {"$sum": "$current_quantity"},
            "total_value": {"$sum": {"$multiply": ["$current_quantity", "$acquisition_cost"]}}
        }}
    ]
    
    aggregation_result = await lot_repo.aggregate(pipeline, session=session)

    stats = aggregation_result[0] if aggregation_result else {}
    total_stock = stats.get("total_stock", 0)
    total_value = stats.get("total_value", 0.0)
    average_cost = total_value / total_stock if total_stock > 0 else 0.0

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

async def get_lots_by_product_id(db: AsyncIOMotorDatabase, product_id: str) -> List[InventoryLotOut]:
    """
    Obtiene y enriquece todos los lotes de inventario para un producto específico.
    """
    lot_repo = InventoryLotRepository(db)
    product_repo = ProductRepository(db)

    product_doc = await product_repo.find_by_id(product_id)
    if not product_doc:
        return []

    lot_docs = await lot_repo.find_by_product_id(product_id)

    # El enriquecimiento podría optimizarse si fuera necesario en el futuro.
    enriched_lots = []
    for doc in lot_docs:
        doc["product_sku"] = product_doc.get("sku")
        doc["product_name"] = product_doc.get("name")
        enriched_lots.append(InventoryLotOut.model_validate(doc))

    return enriched_lots