# /backend/app/modules/inventory/product_models.py

"""
Define los modelos de datos de Pydantic para la entidad maestra 'Producto'.

Este módulo se enfoca exclusivamente en la definición del catálogo de productos.
Sigue un estricto principio de Separación de Concerns:
1.  Los modelos de Catálogo (`ProductBase`, `ProductCreate`) definen las
    propiedades inherentes y estáticas de un producto.
2.  Los modelos de Estado (`ProductInDB`, `ProductOut`) representan el producto
    completo, incluyendo los campos transaccionales (ej. stock) que son
    calculados y gestionados por otros servicios.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Union

from pydantic import BaseModel, ConfigDict, Field

from app.models.shared import PyObjectId

# ==============================================================================
# SECCIÓN 2: ENUMS Y MODELOS DE SOPORTE PARA PROPIEDADES DEL PRODUCTO
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

class FilterDimensions(BaseModel):
    a: Optional[float] = None
    b: Optional[float] = None
    c: Optional[float] = None
    g: Optional[Union[str, float]] = None
    h: Optional[float] = None
    f: Optional[float] = None
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
# SECCIÓN 3: ARQUITECTURA DE MODELOS DE PRODUCTO
# ==============================================================================

class ProductBase(BaseModel):
    """Modelo base con la información de catálogo de un producto."""
    sku: str = Field(..., min_length=1, description="Código de Referencia Único (SKU).")
    name: str = Field(..., min_length=3, description="Nombre descriptivo del producto.")
    brand: str = Field(..., min_length=2, description="Marca del producto.")
    description: Optional[str] = Field(None, description="Descripción detallada del producto.")
    category: ProductCategory
    product_type: FilterType = Field(default=FilterType.NOT_APPLICABLE)
    shape: Optional[ProductShape] = None
    price: float = Field(..., ge=0, description="Precio de venta al público.")
    points_on_sale: float = Field(default=0.0, ge=0, description="Puntos generados por la venta.")
    weight_g: Optional[float] = Field(None, ge=0, description="Peso del producto en gramos.")
    dimensions: Optional[FilterDimensions] = None
    oem_codes: List[OEMCode] = Field(default_factory=list)
    cross_references: List[CrossReference] = Field(default_factory=list)
    applications: List[Application] = Field(default_factory=list)
    main_image_url: Optional[str] = None
    image_urls: List[str] = Field(default_factory=list)

class ProductCreate(ProductBase):
    """Data Transfer Object (DTO) para crear un nuevo producto en el catálogo."""
    pass

class ProductUpdate(BaseModel):
    """DTO para actualizar la información de catálogo de un producto existente."""
    name: Optional[str] = Field(None, min_length=3)
    brand: Optional[str] = Field(None, min_length=2)
    description: Optional[str] = None
    category: Optional[ProductCategory] = None
    product_type: Optional[FilterType] = None
    shape: Optional[ProductShape] = None
    price: Optional[float] = Field(None, ge=0)
    points_on_sale: Optional[float] = Field(None, ge=0)
    weight_g: Optional[float] = Field(None, ge=0)
    dimensions: Optional[FilterDimensions] = None
    oem_codes: Optional[List[OEMCode]] = None
    cross_references: Optional[List[CrossReference]] = None
    applications: Optional[List[Application]] = None
    main_image_url: Optional[str] = None
    is_active: Optional[bool] = None

class ProductInDB(ProductBase):
    """Modelo que representa el producto como se almacena en MongoDB."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    stock_quantity: int = Field(default=0)
    average_cost: float = Field(default=0.0)
    total_value: float = Field(default=0.0)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})

class ProductOut(ProductBase):
    """DTO de Salida para exponer la información completa del producto al cliente."""
    id: PyObjectId = Field(..., alias="_id")
    stock_quantity: int = Field(default=0)
    average_cost: float = Field(default=0.0)
    total_value: float = Field(default=0.0)
    is_active: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})