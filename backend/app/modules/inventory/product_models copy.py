# /backend/app/modules/inventory/product_models.py

"""
Define los modelos de datos de Pydantic para la entidad maestra 'Producto'.

Un 'Producto' en este contexto es una entidad de catálogo que contiene la
información descriptiva y estática. Los datos transaccionales como el stock
y el costo se manejan a través de un modelo de Lotes de Inventario.
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================

from pydantic import BaseModel, Field, ConfigDict, field_serializer
from typing import List, Optional, Union
from datetime import datetime, timezone
from enum import Enum
from bson import ObjectId as BsonObjectId

from app.models.shared import PyObjectId

# ==============================================================================
# SECCIÓN 2: ENUMS Y MODELOS DE SOPORTE
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
    """
    Modelo base con la información de catálogo de un producto.
    Contiene todos los campos que son comunes entre la creación y la lectura.
    """
    sku: str = Field(..., min_length=1, description="Código de Referencia Único (SKU).")
    name: str = Field(..., min_length=3, description="Nombre descriptivo del producto.")
    brand: str = Field(..., min_length=2, description="Marca del producto.")
    description: Optional[str] = Field(None, description="Descripción detallada del producto.")
    category: ProductCategory
    product_type: FilterType = FilterType.NOT_APPLICABLE
    shape: Optional[ProductShape] = None
    
    # --- CORRECCIÓN CRÍTICA ---
    # Se eliminan los 'Field(0, ...)' para que Pydantic tome el valor de la base de datos
    # en lugar de asignar un valor por defecto durante la validación.
    stock_quantity: int = 0
    average_cost: float = 0.0
    total_value: float = 0.0
    
    price: float = Field(..., ge=0, description="Precio de venta al público.")
    points_on_sale: float = Field(0.0, ge=0, description="Puntos generados por la venta.")
    weight_g: Optional[float] = Field(None, ge=0, description="Peso del producto en gramos.")
    
    dimensions: Optional[FilterDimensions] = None
    oem_codes: List[OEMCode] = Field(default_factory=list)
    cross_references: List[CrossReference] = Field(default_factory=list)
    applications: List[Application] = Field(default_factory=list)
    
    main_image_url: Optional[str] = None
    image_urls: List[str] = Field(default_factory=list)

class ProductCreate(ProductBase):
    """DTO para crear un nuevo producto."""
    pass

class ProductUpdate(BaseModel):
    """DTO para actualizar la información de catálogo de un producto."""
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
    """Modelo que representa el documento completo como se almacena en MongoDB."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    is_active: bool = Field(True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={BsonObjectId: str})

class ProductOut(ProductBase):
    """DTO de Salida para exponer la información del producto."""
    id: PyObjectId = Field(..., alias="_id")
    is_active: bool
    created_at: datetime
    updated_at: datetime

    @field_serializer('id')
    def serialize_id(self, id_obj: BsonObjectId, _info) -> str:
        return str(id_obj)

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)