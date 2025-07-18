# /backend/app/modules/inventory/product_models.py
# MODELOS DE DATOS PARA LA ENTIDAD 'PRODUCTO' CON ARQUITECTURA PROFESIONAL

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum
from app.models.shared import PyObjectId


# --- SECCIÓN 1: ENUMS PARA CATEGORIZACIÓN ESTANDARIZADA ---
# Usar Enums previene errores de tipeo y asegura la consistencia de los datos.

class ProductCategory(str, Enum):
    """Define la categoría principal del producto."""
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
    """Define la forma física, principalmente para filtros."""
    PANEL = "panel"
    ROUND = "round"
    OVAL = "oval"
    CARTRIDGE = "cartridge"         # Elemento
    SPIN_ON = "spin_on"             # Roscado / Sellado
    IN_LINE_DIESEL = "in_line_diesel"
    IN_LINE_GASOLINE = "in_line_gasoline"
    NOT_APPLICABLE = "n_a"


# --- SECCIÓN 2: MODELOS DE SOPORTE PARA DATOS ANIDADOS ---

class OEMCode(BaseModel):
    """Representa un código de Equipo Original (del fabricante del vehículo)."""
    brand: str = Field(..., description="Marca del vehículo, ej. 'Toyota', 'General Motors'")
    code: str = Field(..., description="Código de la pieza de equipo original, ej. '90915-YZZE1'")

class CrossReference(BaseModel):
    """Representa una equivalencia con otra marca (Aftermarket)."""
    brand: str = Field(..., description="Marca de la competencia, ej. 'FRAM', 'Mann-Filter'")
    code: str = Field(..., description="Código de la pieza de la competencia, ej. 'PH4967'")

class Application(BaseModel):
    """Representa un vehículo en el que se puede usar el producto."""
    brand: str
    model: str
    years: List[int] = Field(default_factory=list)
    engine: Optional[str] = None


# --- SECCIÓN 3: ARQUITECTURA DE MODELOS PRINCIPALES ---

# 3.1: Modelo de Entrada para CREACIÓN (DTO)
class ProductCreate(BaseModel):
    """Define los datos que el frontend DEBE enviar para crear un producto."""
    sku: str
    name: str
    brand: str
    description: Optional[str] = None
    
    category: ProductCategory
    product_type: FilterType = Field(default=FilterType.NOT_APPLICABLE)
    shape: Optional[ProductShape] = Field(default=None)
    
    cost: float = Field(..., ge=0)
    price: float = Field(..., ge=0)
    stock_quantity: int = Field(0, ge=0)
    points_on_sale: float = Field(0.0, ge=0)
    weight_kg: Optional[float] = Field(None, ge=0)
    
    specifications: Optional[Dict[str, Any]] = None
    oem_codes: Optional[List[OEMCode]] = None
    cross_references: Optional[List[CrossReference]] = None
    applications: Optional[List[Application]] = None
    main_image_url: Optional[str] = None

# 3.2: Modelo de Entrada para ACTUALIZACIÓN (DTO)
class ProductUpdate(BaseModel):
    """Define los campos que se pueden actualizar de un producto. Todos son opcionales."""
    name: Optional[str] = None
    brand: Optional[str] = None
    description: Optional[str] = None
    category: Optional[ProductCategory] = None
    product_type: Optional[FilterType] = None
    shape: Optional[ProductShape] = None
    cost: Optional[float] = Field(None, ge=0)
    price: Optional[float] = Field(None, ge=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    points_on_sale: Optional[float] = Field(None, ge=0)
    weight_kg: Optional[float] = Field(None, ge=0)
    specifications: Optional[Dict[str, Any]] = None
    oem_codes: Optional[List[OEMCode]] = None
    cross_references: Optional[List[CrossReference]] = None
    applications: Optional[List[Application]] = None
    main_image_url:  Optional[str] = None
    is_active: Optional[bool] = None

# 3.3: Modelo de Base de Datos (La "Fuente de la Verdad")
class ProductInDB(BaseModel):
    """Representa el documento completo del producto como se almacena en MongoDB."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    sku: str
    name: str
    brand: str
    description: Optional[str] = None
    
    category: ProductCategory
    product_type: FilterType
    shape: Optional[ProductShape] = None
    
    cost: float
    price: float
    stock_quantity: int
    points_on_sale: float
    weight_kg: Optional[float] = Field(None, ge=0)
    
    specifications: Dict[str, Any] = Field(default_factory=dict)
    oem_codes: List[OEMCode] = Field(default_factory=list)
    cross_references: List[CrossReference] = Field(default_factory=list)
    applications: List[Application] = Field(default_factory=list)
    image_urls: List[str] = Field(default_factory=list)
    main_image_url: Optional[str] = None
    
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = { PyObjectId: str }

# 3.4: Modelo de Salida (DTO)
class ProductOut(ProductInDB):
    """Define la estructura de datos que la API devuelve al frontend."""
    pass


# --- SECCIÓN 4: MODELOS PARA FUNCIONALIDADES ESPECÍFICAS ---

class CatalogFilterPayload(BaseModel):
    """Define los filtros que el frontend envía para generar un catálogo."""
    search_term: Optional[str] = None
    product_types: Optional[List[str]] = None
    view_type: str = 'client' # Puede ser 'client' o 'seller'

# ... (tus otros modelos)