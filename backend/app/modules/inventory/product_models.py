# /backend/app/models/product.py
# ARQUITECTURA FINAL CON LA JERARQUÍA CORRECTA: CATEGORÍA -> TIPO -> FORMA

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
from enum import Enum

# --- Clase de Ayuda para ObjectId de MongoDB ---
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls): yield cls.validate
    @classmethod
    def validate(cls, v, _):
        if not ObjectId.is_valid(v): raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema, _): field_schema.update(type="string")

# --- SECCIÓN 1: ENUMS PARA LA CATEGORIZACIÓN ---
# Esta es la implementación correcta de la jerarquía que definiste.

class ProductCategory(str, Enum):
    """Define la categoría principal del producto ("Producto")."""
    FILTER = "filter"
    BATTERY = "battery"
    OIL = "oil"
    SPARE_PART = "spare_part"

class FilterType(str, Enum):
    """Define el tipo específico para la categoría 'filter' ("Tipo de producto")."""
    AIR = "air"
    OIL = "oil"
    CABIN = "cabin"
    FUEL = "fuel"
    NOT_APPLICABLE = "n_a"

class ProductShape(str, Enum):
    """Define la forma física, principalmente para filtros ("Forma")."""
    PANEL = "panel"
    ROUND = "round"
    OVAL = "oval"
    CARTRIDGE = "cartridge" # Elemento
    SPIN_ON = "spin_on" # Roscado
    IN_LINE_DIESEL = "in_line_diesel"
    IN_LINE_GASOLINE = "in_line_gasoline"
    NOT_APPLICABLE = "n_a"

# --- SECCIÓN 2: MODELOS DE SOPORTE (sin cambios) ---
class CrossReference(BaseModel):
    brand: str
    code: str

class Application(BaseModel):
    brand: str
    model: str
    years: List[int] = Field(default_factory=list)
    engine: Optional[str] = None

# --- SECCIÓN 3: ARQUITECTURA DE MODELOS PRINCIPALES (CORREGIDA) ---

class ProductCreate(BaseModel):
    """Modelo para recibir datos al crear un producto. Este es el 'contrato' de la API."""
    sku: str
    name: str
    brand: str
    description: Optional[str] = None
    
    # --- JERARQUÍA CORRECTA ---
    category: ProductCategory
    product_type: FilterType = Field(default=FilterType.NOT_APPLICABLE)
    shape: Optional[ProductShape] = Field(default=None) # La forma es opcional
    
    cost: float = Field(..., ge=0)
    price: float = Field(..., ge=0)
    stock_quantity: int = Field(0, ge=0)
    points_on_sale: int = Field(0, ge=0)
    specifications: Optional[Dict[str, Any]] = None
    cross_references: Optional[List[CrossReference]] = None
    applications: Optional[List[Application]] = None

class ProductUpdate(BaseModel):
    """Modelo para recibir datos al actualizar. Todos los campos son opcionales."""
    name: Optional[str] = None
    brand: Optional[str] = None
    description: Optional[str] = None
    category: Optional[ProductCategory] = None
    product_type: Optional[FilterType] = None
    shape: Optional[ProductShape] = None
    cost: Optional[float] = Field(None, ge=0)
    price: Optional[float] = Field(None, ge=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    points_on_sale: Optional[int] = Field(None, ge=0)
    specifications: Optional[Dict[str, Any]] = None
    cross_references: Optional[List[CrossReference]] = None
    applications: Optional[List[Application]] = None
    image_urls: Optional[List[str]] = None
    is_active: Optional[bool] = None

class ProductInDB(BaseModel):
    """Modelo que representa el documento completo en la base de datos (La Fuente de la Verdad)."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    sku: str
    name: str
    brand: str
    description: Optional[str] = None
    
    # --- JERARQUÍA CORRECTA EN LA DB ---
    category: ProductCategory
    product_type: FilterType
    shape: Optional[ProductShape] = None
    
    cost: float
    price: float
    stock_quantity: int
    points_on_sale: int
    specifications: Dict[str, Any] = Field(default_factory=dict)
    cross_references: List[CrossReference] = Field(default_factory=list)
    applications: List[Application] = Field(default_factory=list)
    image_urls: List[str] = Field(default_factory=list)
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = {ObjectId: str}

class ProductOut(ProductInDB):
    """Modelo de salida que se envía al frontend."""
    pass