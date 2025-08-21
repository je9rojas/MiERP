# /backend/app/modules/inventory/repositories/product_repository.py

"""
Capa de Acceso a Datos (Repositorio) para la entidad 'Producto'.

Este archivo define la clase `ProductRepository`, que hereda de la clase genérica
`BaseRepository` para obtener las operaciones CRUD estándar. Su principal
responsabilidad es extender esa funcionalidad base con métodos de consulta
específicos y de alto nivel para la colección 'products' en la base de datos.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

# --- Importaciones de la Librería Estándar y Terceros ---
from typing import Any, Dict, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorClientSession

# --- Importaciones de la Aplicación ---
from app.repositories.base_repository import BaseRepository
from app.modules.inventory.product_models import Product

# ==============================================================================
# SECCIÓN 2: DEFINICIÓN DE LA CLASE DEL REPOSITORIO
# ==============================================================================

class ProductRepository(BaseRepository[Product]):
    """
    Gestiona las operaciones de base de datos para la colección de productos.

    Esta clase hereda toda la funcionalidad CRUD genérica de `BaseRepository`
    (como `find_one_by_id`, `find_all`, `insert_one`, etc.) y añade métodos
    específicos para la entidad 'Producto' que no son genéricos.
    """

    # --------------------------------------------------------------------------
    # Subsección 2.1: Inicialización
    # --------------------------------------------------------------------------
    
    def __init__(self, database: AsyncIOMotorDatabase):
        """
        Inicializa el repositorio de productos.
        
        Llama al constructor de la clase base `BaseRepository` y le proporciona
        el nombre de la colección ("products") y el modelo Pydantic (`Product`)
        con el que operará.
        """
        super().__init__(database, collection_name="products", model=Product)

    # --------------------------------------------------------------------------
    # Subsección 2.2: Métodos de Consulta Específicos
    # --------------------------------------------------------------------------

    async def find_by_sku(self, sku: str, session: Optional[AsyncIOMotorClientSession] = None) -> Optional[Dict[str, Any]]:
        """
        Encuentra un único producto por su campo 'sku'.

        El SKU (Stock Keeping Unit) es un identificador de negocio único, por lo
        que esta consulta especializada es fundamental para la lógica de negocio
        del módulo de inventario.
        
        Args:
            sku: El identificador único de producto a buscar.
            session: Una sesión opcional de Motor para operaciones transaccionales.

        Returns:
            Un diccionario que representa el documento del producto si se encuentra,
            o None en caso contrario.
        """
        query = {"sku": sku}
        return await self.collection.find_one(query, session=session)