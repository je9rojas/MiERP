# /backend/app/modules/inventory/product_models.py

"""
Define los modelos de datos de Pydantic para la entidad 'Producto'.

Sigue una arquitectura DTO (Data Transfer Object) robusta, separando las
responsabilidades de los modelos para la creación (DTO de entrada), el
almacenamiento en la base de datos (la fuente de la verdad) y la exposición a
través de la API (DTO de salida), garantizando seguridad y consistencia.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from pydantic import BaseModel, Field, ConfigDict, field_serializer
from typing import List, Optional
from datetime import datetime, timezone
from enum import Enum
from bson import ObjectId as BsonObjectId # Se importa para la anotación de tipo en el serializador

# Se asume que PyObjectId está correctamente definido en app/models/shared.py
from app.models.shared import PyObjectId


# ==============================================================================
# SECCIÓN 2: ENUMS PARA CATEGORIZACIÓN ESTANDARIZADA
# ==============================================================================

class ProductCategory(str, Enum):
    """Define la categoría principal del producto para una clasificación uniforme."""
    FILTER = "filter"
    BATTERY = "battery"
    OIL = "oil"
    SPARE_PART = "spare_part"

class FilterType(str, Enum):
    """Define el tipo específico para la categoría 'filter'."""
    AIR = "air"
    OIL = "oil"
    CABIN = "cabin"
    FUEL = "fuel"
    NOT_APPLICABLE = "n_a"

class ProductShape(str, Enum):
    """Define la forma física, principalmente relevante para filtros."""
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
    Define explícitamente cada posible medida, su tipo de dato y su descripción.
    """
    a: Optional[float] = Field(None, description="Dimensión A (ej. Largo o Diámetro Externo) en mm.", example=150.5)
    b: Optional[float] = Field(None, description="Dimensión B (ej. Ancho o Diámetro Interno) en mm.", example=75)
    c: Optional[float] = Field(None, description="Dimensión C (ej. Diámetro Interno Inferior) en mm.", example=20)
    g: Optional[str] = Field(None, description="Dimensión G, típicamente para la rosca (ej: '13/16-16 UNF') o el diámetro de la junta.", example="13/16-16 UNF")
    h: Optional[float] = Field(None, description="Dimensión H (ej. Altura Total o Diámetro del Cuerpo) en mm.", example=100)
    f: Optional[float] = Field(None, description="Dimensión F (ej. Diámetro del tubo de entrada) en mm.", example=8)
    model_config = ConfigDict(extra='forbid')

class OEMCode(BaseModel):
    """Representa un código de Equipo Original (OEM) del fabricante del vehículo."""
    brand: str = Field(..., description="Marca del fabricante del vehículo (ej: 'Toyota').")
    code: str = Field(..., description="Código de la pieza según el fabricante del vehículo.")

class CrossReference(BaseModel):
    """Representa una equivalencia con otra marca del mercado de repuestos (aftermarket)."""
    brand: str = Field(..., description="Marca de la pieza de recambio (ej: 'Bosch').")
    code: str = Field(..., description="Código de la pieza de recambio equivalente.")

class Application(BaseModel):
    """Representa un vehículo en el que se puede usar el producto."""
    brand: str = Field(..., description="Marca del vehículo (ej: 'Nissan').")
    model: Optional[str] = Field(None, description="Modelo específico del vehículo (ej: 'Sentra').")
    years: List[int] = Field(default_factory=list, description="Lista de años de aplicación del modelo.")
    engine: Optional[str] = Field(None, description="Especificación del motor (ej: '1.8L QR18DE').")


# ==============================================================================
# SECCIÓN 4: ARQUITECTURA DE MODELOS PRINCIPALES DE PRODUCTO (DTOs)
# ==============================================================================

class ProductBase(BaseModel):
    """
    Modelo base con todos los campos posibles de un producto.
    Sirve como la definición completa y se utiliza para la creación y el almacenamiento interno.
    """
    sku: str = Field(..., min_length=1, description="SKU (Stock Keeping Unit) único y obligatorio del producto.", example="WIX-51348")
    name: str = Field(..., min_length=3, description="Nombre descriptivo y legible del producto.", example="Filtro de Aceite Spin-On")
    brand: str = Field(..., min_length=2, description="Marca del producto.", example="WIX")
    description: Optional[str] = Field(None, description="Descripción detallada, notas o información adicional.")
    category: ProductCategory = Field(..., description="Categoría principal a la que pertenece el producto.")
    product_type: FilterType = Field(FilterType.NOT_APPLICABLE, description="Sub-tipo de producto, principalmente para filtros.")
    shape: Optional[ProductShape] = Field(None, description="Forma física del producto, relevante para filtros.")
    cost: float = Field(..., ge=0, description="Costo de adquisición del producto.", example=5.25)
    price: float = Field(..., ge=0, description="Precio de venta al público del producto.", example=10.50)
    stock_quantity: int = Field(0, ge=0, description="Cantidad de unidades disponibles en inventario.")
    points_on_sale: float = Field(0.0, ge=0, description="Puntos de lealtad generados por la venta de este producto.")
    weight_g: Optional[float] = Field(None, ge=0, description="Peso del producto en gramos.", example=250)
    dimensions: Optional[FilterDimensions] = Field(None, description="Objeto que contiene las dimensiones técnicas del producto.")
    oem_codes: List[OEMCode] = Field(default_factory=list, description="Lista de códigos de equivalencia del fabricante original (OEM).")
    cross_references: List[CrossReference] = Field(default_factory=list, description="Lista de códigos de equivalencia de otras marcas (aftermarket).")
    applications: List[Application] = Field(default_factory=list, description="Lista de vehículos en los que se puede utilizar el producto.")
    main_image_url: Optional[str] = Field(None, description="URL de la imagen principal del producto.", example="https://example.com/image.jpg")
    image_urls: List[str] = Field(default_factory=list, description="Lista de URLs de imágenes adicionales.")

class ProductCreate(ProductBase):
    """DTO de Entrada para la creación de un nuevo producto."""
    pass

class ProductUpdate(BaseModel):
    """DTO de Entrada para la actualización de un producto."""
    name: Optional[str] = Field(None, min_length=3)
    brand: Optional[str] = Field(None, min_length=2)
    description: Optional[str] = None
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
    """Modelo que representa el documento completo como se almacena y lee de MongoDB."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    is_active: bool = Field(True, description="Indica si el producto está activo y disponible para la venta.")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

class ProductOut(BaseModel):
    """
    DTO de Salida para la lista de productos. Es explícito y optimizado para la DataGrid.
    Define exactamente qué campos se envían al frontend en la vista de lista.
    """
    id: PyObjectId = Field(..., alias="_id")
    sku: str
    brand: str
    cost: float
    price: float
    stock_quantity: int
    dimensions: Optional[FilterDimensions] = None
    is_active: bool

    @field_serializer('id', when_used='json')
    def serialize_id(self, id_obj: BsonObjectId) -> str:
        """Convierte el ObjectId a string solo durante la serialización a JSON."""
        return str(id_obj)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={BsonObjectId: str} # Proporciona un codificador global para ObjectId
    )

class ProductOutDetail(ProductOut):
    """

    DTO de Salida para la vista detallada de un producto.
    Hereda de ProductOut y añade los campos más pesados o detallados.
    """
    name: str
    description: Optional[str] = None
    category: ProductCategory
    product_type: FilterType
    shape: Optional[ProductShape] = None
    points_on_sale: float
    weight_g: Optional[float] = None
    oem_codes: List[OEMCode] = Field(default_factory=list)
    cross_references: List[CrossReference] = Field(default_factory=list)
    applications: List[Application] = Field(default_factory=list)
    main_image_url: Optional[str] = None
    image_urls: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

# ==============================================================================
# SECCIÓN 5: MODELOS PARA FUNCIONALIDADES ESPECÍFICAS
# ==============================================================================

class CatalogFilterPayload(BaseModel):
    """Define los filtros que el cliente puede enviar para generar un catálogo o búsqueda."""
    search_term: Optional[str] = Field(None, description="Término de búsqueda general (SKU, nombre, etc.).")
    product_types: Optional[List[FilterType]] = Field(None, description="Lista de tipos de filtro para acotar la búsqueda.")
    view_type: str = Field('client', description="Define la vista del catálogo ('client' o 'distributor').")