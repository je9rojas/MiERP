# /backend/app/modules/purchasing/repositories/purchase_order_repository.py

"""
Capa de Repositorio para la entidad 'Orden de Compra' (Purchase Order).

Este módulo define la clase `PurchaseOrderRepository`, que hereda de la clase
genérica `BaseRepository` para obtener las operaciones CRUD estándar.
No requiere métodos adicionales, ya que las operaciones de consulta estándar
son suficientes para las necesidades del servicio de compras.
"""

# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
# SECCIÓN 1: IMPORTACIONES
# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories.base_repository import BaseRepository
from app.modules.purchasing.purchasing_models import PurchaseOrderInDB

# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
# SECCIÓN 2: DEFINICIÓN DE LA CLASE DEL REPOSITORIO
# -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

class PurchaseOrderRepository(BaseRepository[PurchaseOrderInDB]):
    """
    Gestiona las operaciones de base de datos para la colección 'purchase_orders'.

    Esta clase hereda toda la funcionalidad CRUD genérica de `BaseRepository`,
    como `find_one_by_id`, `find_all_paginated`, `insert_one`, etc. No define
    métodos adicionales porque las operaciones base son suficientes.
    """

    def __init__(self, database: AsyncIOMotorDatabase):
        """
        Inicializa el repositorio de órdenes de compra.

        Llama al constructor de la clase base `BaseRepository` y le proporciona
        el nombre de la colección ("purchase_orders") y el modelo Pydantic
        (`PurchaseOrderInDB`) con el que operará.

        Args:
            database: Una instancia de AsyncIOMotorDatabase para la conexión.
        """
        super().__init__(
            database,
            collection_name="purchase_orders",
            model=PurchaseOrderInDB
        )