"""
Define los modelos de datos de Pydantic para la entidad 'Producto' del inventario.

Este módulo implementa una arquitectura de DTOs (Data Transfer Objects) para
gestionar los datos de productos de manera segura y organizada. Se definen
modelos distintos para los diferentes flujos de datos:

1.  **Modelos de Entrada (Create/Update):** Definen la forma de los datos que la
    API espera recibir para crear o modificar un recurso.
2.  **Modelos de Base de Datos (InDB):** Representan la estructura completa y
    verdadera del documento tal como se almacena en la base de datos (ej. MongoDB).
3.  **Modelos de Salida (Out):** Definen la forma de los datos que la API expone
    al cliente, permitiendo ocultar campos sensibles o internos.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES DE MÓDULOS
# ==============================================================================

from pydantic import BaseModel, Field, ConfigDict, field_serializer
from typing import List, Optional, Union
from datetime import datetime, timezone
from enum import Enum
from bson import ObjectId as BsonObjectId

from app.models.shared import PyObjectId


# ==============================================================================
# SECCIÓN 2: ENUMS PARA CATEGORIZACIÓN ESTANDARIZADA
# ==============================================================================

class ProductCategory(str, Enum):
    """Categorías principales de productos en el sistema."""
    FILTER = "filter"
    BATTERY = "battery"
    OIL = "oil"
    SPARE_PART = "spare_part"

class FilterType(str, Enum):
    """Subtipos específicos para la categoría 'Filtro'."""
    AIR = "air"
    OIL = "oil"
    CABIN = "cabin"
    FUEL = "fuel"
    NOT_APPLICABLE = "n_a"

class ProductShape(str, Enum):
    """Formas físicas o de construcción de los productos, principalmente filtros."""
    PANEL = "panel"
    ROUND = "round"
    OVAL = "oval"
    CARTRIDGE = "cartridge"
    SPIN_ON = "spin_on"
    IN_LINE_DIESEL = "in_line_diesel"
    IN_LINE_GASOLINE = "in_line_gasoline"
    NOT_APPLICABLE = "n_a"


# ==============================================================================
# SECCIÓN 3: MODELOS DE SOPORTE Y DATOS ANIDADOS
# ==============================================================================

class FilterDimensions(BaseModel):
    """
    Modelo fuertemente tipado para las dimensiones de los filtros.

    Este modelo está diseñado para ser flexible, aceptando valores numéricos para
    medidas estándar y valores de texto para especificaciones complejas como
    el tamaño de una rosca (ej. "M20x1.5").
    """
    a: Optional[float] = Field(None, description="Dimensión A, generalmente el diámetro exterior o longitud.")
    b: Optional[float] = Field(None, description="Dimensión B, generalmente el diámetro interior o ancho.")
    c: Optional[float] = Field(None, description="Dimensión C, generalmente una segunda medida de diámetro interior.")
    g: Optional[Union[str, float]] = Field(None, description="Dimensión G, representa la rosca. Puede ser un texto (ej. 'M20x1.5') o un número.")
    h: Optional[float] = Field(None, description="Dimensión H, generalmente la altura total del filtro.")
    f: Optional[float] = Field(None, description="Dimensión F, otra medida relevante según la forma del filtro.")

    model_config = ConfigDict(
        extra='forbid',
        json_schema_extra={
            "example": {
                "a": 100.5,
                "h": 150,
                "g": "M20x1.5"
            }
        }
    )

class OEMCode(BaseModel):
    """Representa un código de fabricante de equipo original (OEM)."""
    brand: str = Field(..., description="Marca del fabricante OEM.")
    code: str = Field(..., description="Código del producto OEM.")

class CrossReference(BaseModel):
    """Representa una referencia cruzada con un producto de otra marca."""
    brand: str = Field(..., description="Marca del producto equivalente.")
    code: str = Field(..., description="Código del producto equivalente.")

class Application(BaseModel):
    """Describe la aplicación de un producto en un vehículo específico."""
    brand: str = Field(..., description="Marca del vehículo (ej. Toyota).")
    model: Optional[str] = Field(None, description="Modelo del vehículo (ej. Corolla).")
    years: List[int] = Field(default_factory=list, description="Rango de años de fabricación del modelo.")
    engine: Optional[str] = Field(None, description="Especificación del motor (ej. 2.0L 16V).")


# ==============================================================================
# SECCIÓN 4: ARQUITECTURA DE MODELOS PRINCIPALES DE PRODUCTO (DTOs)
# ==============================================================================

class ProductBase(BaseModel):
    """
    Modelo base con todos los campos comunes que definen un producto.
    Sirve como la estructura fundamental de la cual otros DTOs heredan.
    """
    sku: str = Field(..., min_length=1, description="Código de Referencia Único (SKU) del producto.")
    name: str = Field(..., min_length=3, description="Nombre descriptivo del producto.")
    brand: str = Field(..., min_length=2, description="Marca del producto.")
    description: Optional[str] = Field(None, description="Descripción detallada o notas adicionales sobre el producto.")
    category: ProductCategory = Field(..., description="Categoría principal a la que pertenece el producto.")
    product_type: FilterType = Field(FilterType.NOT_APPLICABLE, description="Subtipo específico, principalmente para filtros.")
    shape: Optional[ProductShape] = Field(None, description="Forma física o tipo de construcción del producto.")
    cost: float = Field(..., ge=0, description="Costo de adquisición del producto.")
    price: float = Field(..., ge=0, description="Precio de venta al público del producto.")
    stock_quantity: int = Field(0, ge=0, description="Cantidad de unidades disponibles en inventario.")
    points_on_sale: float = Field(0.0, ge=0, description="Puntos generados por la venta de este producto.")
    weight_g: Optional[float] = Field(None, ge=0, description="Peso del producto en gramos.")
    dimensions: Optional[FilterDimensions] = Field(None, description="Dimensiones físicas del producto, si aplica.")
    oem_codes: List[OEMCode] = Field(default_factory=list, description="Lista de códigos OEM equivalentes.")
    cross_references: List[CrossReference] = Field(default_factory=list, description="Lista de referencias cruzadas con otras marcas.")
    applications: List[Application] = Field(default_factory=list, description="Lista de vehículos en los que aplica el producto.")
    main_image_url: Optional[str] = Field(None, description="URL de la imagen principal del producto.")
    image_urls: List[str] = Field(default_factory=list, description="Lista de URLs de imágenes adicionales.")

class ProductCreate(ProductBase):
    """
    DTO de Entrada para la creación de un nuevo producto.
    Hereda directamente de ProductBase, definiendo el contrato para la API de creación.
    """
    pass

class ProductUpdate(BaseModel):
    """
    DTO de Entrada para la actualización parcial (PATCH) de un producto.
    Todos los campos son opcionales para permitir modificaciones de solo algunos atributos.
    """
    name: Optional[str] = Field(None, min_length=3)
    brand: Optional[str] = Field(None, min_length=2)
    description: Optional[str] = Field(None)
    category: Optional[ProductCategory] = None
    product_type: Optional[FilterType] = None
    shape: Optional[ProductShape] = None
    cost: Optional[float] = Field(None, ge=0)
    price: Optional[float] = Field(None, ge=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    points_on_sale: Optional[float] = Field(None, ge=0)
    weight_g: Optional[float] = Field(None, ge=0)
    dimensions: Optional[FilterDimensions] = None
    oem_codes: Optional[List[OEMCode]] = None
    cross_references: Optional[List[CrossReference]] = None
    applications: Optional[List[Application]] = None
    main_image_url: Optional[str] = None
    is_active: Optional[bool] = None

class ProductInDB(ProductBase):
    """
    Modelo que representa el documento completo del producto como se almacena en MongoDB.
    Incluye campos de auditoría y el identificador único de la base de datos.
    """
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    is_active: bool = Field(True, description="Indica si el producto está activo y disponible para la venta.")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "sku": "WIX-51348",
                "name": "Filtro de Aceite Spin-On",
                "brand": "WIX",
                "category": "filter",
                "product_type": "oil",
                "_id": "64c919f18e974f039d226a97",
                "is_active": True,
                "created_at": "2023-08-01T12:00:00Z",
                "updated_at": "2023-08-01T12:00:00Z"
            }
        }
    )

class ProductOut(ProductBase):
    """
    DTO de Salida que define la estructura de un producto expuesto por la API.
    Este es el modelo que el cliente recibirá al consultar productos.
    """
    id: PyObjectId = Field(..., alias="_id")
    is_active: bool
    created_at: datetime
    updated_at: datetime

    @field_serializer('id', when_used='json')
    def serialize_id(self, id_obj: BsonObjectId) -> str:
        """Convierte el ObjectId de MongoDB a string durante la serialización a JSON."""
        return str(id_obj)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )

class ProductOutDetail(ProductOut):
    """
    DTO de Salida para una vista detallada del producto.
    Actualmente, este DTO es un alias de ProductOut, pero puede extenderse en el
    futuro para incluir más información o relaciones pobladas.
    """
    pass


# ==============================================================================
# SECCIÓN 5: MODELOS PARA FUNCIONALIDADES ESPECÍFICAS
# ==============================================================================

class CatalogFilterPayload(BaseModel):
    """Define la carga útil para filtrar el catálogo de productos."""
    search_term: Optional[str] = Field(None, description="Término de búsqueda para SKU, nombre, etc.")
    product_types: Optional[List[FilterType]] = Field(None, description="Lista de tipos de filtro para acotar la búsqueda.")
    view_type: str = Field('client', description="Define el tipo de vista, puede afectar precios o campos visibles.")