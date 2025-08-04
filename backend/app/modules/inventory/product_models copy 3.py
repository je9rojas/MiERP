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
from bson import ObjectId as BsonObjectId

from app.models.shared import PyObjectId


# ==============================================================================
# SECCIÓN 2: ENUMS PARA CATEGORIZACIÓN ESTANDARIZADA
# ==============================================================================

class ProductCategory(str, Enum):
    FILTER = "filter"
    BATTERY = "battery"
    OIL = "oil"
    SPARE_PART = "spare_part"

class FilterType(str, Enum):
    AIR = "air"
    OIL = "oil"
    CABIN = "cabin"
    FUEL = "fuel"
    NOT_APPLICABLE = "n_a"

class ProductShape(str, Enum):
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
    """Modelo fuertemente tipado para las dimensiones de los filtros."""
    a: Optional[float] = Field(None)
    b: Optional[float] = Field(None)
    c: Optional[float] = Field(None)
    g: Optional[str] = Field(None)
    h: Optional[float] = Field(None)
    f: Optional[float] = Field(None)
    model_config = ConfigDict(extra='forbid')

class OEMCode(BaseModel):
    brand: str
    code: str

class CrossReference(BaseModel):
    brand: str
    code: str

class Application(BaseModel):
    brand: str
    model: Optional[str] = None
    years: List[int] = Field(default_factory=list)
    engine: Optional[str] = None


# ==============================================================================
# SECCIÓN 4: ARQUITECTURA DE MODELOS PRINCIPALES DE PRODUCTO (DTOs)
# ==============================================================================

class ProductBase(BaseModel):
    """
    Modelo base con todos los campos que definen un producto.
    Es la fuente de la verdad para la estructura de un producto.
    """
    sku: str = Field(..., min_length=1)
    name: str = Field(..., min_length=3)
    brand: str = Field(..., min_length=2)
    description: Optional[str] = None
    category: ProductCategory
    product_type: FilterType = FilterType.NOT_APPLICABLE
    shape: Optional[ProductShape] = None
    cost: float = Field(..., ge=0)
    price: float = Field(..., ge=0)
    stock_quantity: int = Field(0, ge=0)
    points_on_sale: float = Field(0.0, ge=0)
    weight_g: Optional[float] = Field(None, ge=0)
    # --- LA DEFINICIÓN CORRECTA Y CRÍTICA ESTÁ AQUÍ ---
    dimensions: Optional[FilterDimensions] = None
    oem_codes: List[OEMCode] = Field(default_factory=list)
    cross_references: List[CrossReference] = Field(default_factory=list)
    applications: List[Application] = Field(default_factory=list)
    main_image_url: Optional[str] = None
    image_urls: List[str] = Field(default_factory=list)

class ProductCreate(ProductBase):
    """
    DTO de Entrada para la creación de un nuevo producto.
    Hereda su estructura directamente de ProductBase, asegurando que el campo
    'dimensions' es aceptado como un objeto, no como un string.
    """
    pass

class ProductUpdate(BaseModel):
    """DTO de Entrada para la actualización de un producto (PATCH)."""
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
    """Modelo que representa el documento completo como se almacena en MongoDB."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    is_active: bool = Field(True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

class ProductOut(ProductBase):
    """DTO de Salida que expone todos los campos de un producto a la API."""
    id: PyObjectId = Field(..., alias="_id")
    is_active: bool
    created_at: datetime
    updated_at: datetime

    @field_serializer('id', when_used='json')
    def serialize_id(self, id_obj: BsonObjectId) -> str:
        """Convierte el ObjectId a string solo durante la serialización a JSON."""
        return str(id_obj)

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

class ProductOutDetail(ProductOut):
    """Actualmente, este DTO es un alias de ProductOut."""
    pass

# ==============================================================================
# SECCIÓN 5: MODELOS PARA FUNCIONALIDADES ESPECÍFICAS
# ==============================================================================

class CatalogFilterPayload(BaseModel):
    search_term: Optional[str] = None
    product_types: Optional[List[FilterType]] = None
    view_type: str = Field('client')