# /backend/app/models/product.py
# ARQUITECTURA FINAL CON BÚSQUEDA POR FORMA Y ESPECIFICACIONES FLEXIBLES

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

# --- Enumeraciones para Estandarizar Datos ---

class ProductType(str, Enum):
    """Define la categoría general del producto."""
    FILTER = "filter"
    LUBRICANT = "lubricant"
    SPARE_PART = "spare_part"
    # Puedes añadir más tipos generales en el futuro

# --- ¡NUEVO ENUM PARA LA FORMA! ---
class ProductShape(str, Enum):
    """Define la forma o sub-tipo específico, especialmente para filtros."""
    # Formas de Aire
    PANEL = "panel"
    ROUND = "round"
    OVAL = "oval"
    # Formas de Combustible y Aceite
    CARTRIDGE = "cartridge"
    SPIN_ON = "spin_on"
    # Formas de Combustible
    IN_LINE_DIESEL = "in_line_diesel"
    IN_LINE_GASOLINE = "in_line_gasoline"
    # Genérico (para productos que no tienen una forma definida como lubricantes)
    NOT_APPLICABLE = "n_a"

# --- Modelos de Soporte para Datos Anidados (sin cambios) ---
class CrossReference(BaseModel):
    brand: str = Field(...)
    code: str = Field(...)

class Application(BaseModel):
    brand: str = Field(...)
    model: str = Field(...)
    years: List[int] = Field(default_factory=list)
    engine: Optional[str] = None

# --- ARQUITECTURA DE MODELOS PRINCIPALES ---

# 1. Modelo de Entrada para CREACIÓN
class ProductCreate(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    brand: str
    product_type: ProductType # Ahora es más genérico
    
    # --- CAMBIO CLAVE ---
    # La forma es ahora un campo obligatorio si el tipo es 'filter'
    shape: Optional[ProductShape] = Field(ProductShape.NOT_APPLICABLE, description="Forma o sub-tipo del producto. Requerido para filtros.")
    
    cost: float = Field(..., ge=0)
    price: float = Field(..., ge=0)
    stock_quantity: int = Field(0, ge=0)
    points_on_sale: int = Field(0, ge=0)
    
    # Las especificaciones ahora contienen solo las medidas
    specifications: Optional[Dict[str, Any]] = Field(None, description="Medidas y otros datos técnicos, ej. {'A': 100, 'B': 50}")
    
    cross_references: Optional[List[CrossReference]] = None
    applications: Optional[List[Application]] = None

# 2. Modelo de Entrada para ACTUALIZACIÓN
class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    brand: Optional[str] = None
    product_type: Optional[ProductType] = None
    shape: Optional[ProductShape] = None # Se puede actualizar la forma
    cost: Optional[float] = Field(None, ge=0)
    price: Optional[float] = Field(None, ge=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    points_on_sale: Optional[int] = Field(None, ge=0)
    specifications: Optional[Dict[str, Any]] = None
    cross_references: Optional[List[CrossReference]] = None
    applications: Optional[List[Application]] = None
    image_urls: Optional[List[str]] = None
    is_active: Optional[bool] = None

# 3. Modelo de Base de Datos (La "Fuente de la Verdad")
class ProductInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    sku: str
    name: str
    description: Optional[str] = None
    brand: str
    product_type: ProductType
    
    # --- CAMPO ESTRUCTURADO PARA BÚSQUEDA ---
    shape: ProductShape
    
    cost: float
    price: float
    stock_quantity: int
    points_on_sale: int
    
    # --- CAMPO FLEXIBLE PARA DATOS VARIABLES ---
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

# 4. Modelo de Salida
class ProductOut(ProductInDB):
    pass