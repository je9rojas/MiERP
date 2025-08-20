# /backend/app/modules/sales/repositories/sales_repository.py

"""
Capa de Repositorio para la entidad 'Orden de Venta' (Sales Order).

Este módulo proporciona una interfaz de bajo nivel para interactuar directamente
con la colección de 'sales_orders' en MongoDB. Hereda toda su funcionalidad CRUD
de la clase BaseRepository para garantizar la consistencia en toda la aplicación.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from motor.motor_asyncio import AsyncIOMotorDatabase

# Se importa la clase base para heredar su funcionalidad.
from app.repositories.base_repository import BaseRepository
# Se importa el modelo Pydantic que representa la orden de venta en la base de datos.
from ..sales_models import SalesOrderInDB

# ==============================================================================
# SECCIÓN 2: CLASE DEL REPOSITORIO
# ==============================================================================

class SalesOrderRepository(BaseRepository[SalesOrderInDB]):
    """
    Gestiona las operaciones de base de datos para la colección de órdenes de venta.

    Esta clase hereda de `BaseRepository` y no requiere métodos adicionales,
    ya que todas las operaciones necesarias (CRUD, paginación, etc.) son
    genéricas y están provistas por la clase padre.
    """

    def __init__(self, database: AsyncIOMotorDatabase):
        """
        Inicializa el repositorio de órdenes de venta.

        Args:
            database: Una instancia de AsyncIOMotorDatabase para interactuar con MongoDB.
        """
        # Se llama al constructor de la clase base, proporcionando el nombre de
        # la colección y el modelo Pydantic con el que trabajará.
        super().__init__(
            database=database,
            collection_name="sales_orders",
            model=SalesOrderInDB
        )