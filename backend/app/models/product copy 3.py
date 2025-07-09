# /backend/app/models/product.py
# ARQUITECTURA DE MODELOS FINAL, ROBUSTA Y ESCALABLE

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
from enum import Enum

# --- Clase de Ayuda para ObjectId de MongoDB ---
# Permite que Pydantic valide y serialice correctamente los IDs de MongoDB.
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, _):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema, _):
        field_schema.update(type="string")


# --- Enumeraciones para Estandarizar Datos ---
# Usar Enums previene errores de tipeo y asegura la consistencia de los datos.
class ProductType(str, Enum):
    FILTER_AIR = "filter_air"
    FILTER_OIL = "filter_oil"
    FILTER_FUEL = "filter_fuel"
    FILTER_CABIN = "filter_cabin"
    LUBRICANT = "lubricant"
    SPARE_PART = "spare_part"


# --- Modelos de Soporte para Datos Anidados ---

class CrossReference(BaseModel):
    """Representa un código de producto equivalente de otra marca."""
    brand: str = Field(..., description="Marca de la referencia, ej. 'FRAM'")
    code: str = Field(..., description="Código de la referencia, ej. 'CA-9494'")


class Application(BaseModel):
    """Representa un vehículo en el que se puede usar el producto."""
    brand: str = Field(..., description="Marca del vehículo, ej. 'Toyota'")
    model: str = Field(..., description="Modelo del vehículo, ej. 'Hilux'")
    years: List[int] = Field(default_factory=list, description="Años de aplicación, ej. [2018, 2019, 2020]")
    engine: Optional[str] = Field(None, description="Descripción del motor, ej. '2.4L 2GD-FTV'")


# --- ARQUITECTURA DE MODELOS PRINCIPALES ---

# 1. Modelo de Entrada (DTO - Data Transfer Object):
# Define los datos que el frontend DEBE enviar para crear un producto.
class ProductCreate(BaseModel):
    sku: str = Field(..., description="SKU (Stock Keeping Unit) único del producto.")
    name: str = Field(..., description="Nombre descriptivo y comercial del producto.")
    description: Optional[str] = Field(None, description="Descripción detallada del producto.")
    brand: str = Field(..., description="Marca del producto, ej. 'Filtrow', 'Mobil'.")
    product_type: ProductType
    cost: float = Field(..., ge=0, description="Costo de adquisición del producto. Debe ser 0 o mayor.")
    price: float = Field(..., ge=0, description="Precio de venta al público. Debe ser 0 o mayor.")
    stock_quantity: int = Field(0, ge=0, description="Cantidad inicial de stock al crear el producto.")
    points_on_sale: int = Field(0, ge=0, description="Puntos que otorga al cliente o vendedor por su venta.")
    specifications: Optional[Dict[str, Any]] = Field(None, description="Atributos específicos como dimensiones, viscosidad, etc.")
    cross_references: Optional[List[CrossReference]] = Field(None, description="Lista de códigos de referencia de otras marcas.")
    applications: Optional[List[Application]] = Field(None, description="Lista de vehículos compatibles.")


# 2. Modelo de Base de Datos (La "Fuente de la Verdad"):
# Representa el documento COMPLETO como se almacena en MongoDB.
# Contiene todos los campos, incluyendo los generados por el servidor.
class ProductInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    sku: str
    name: str
    description: Optional[str] = None
    brand: str
    product_type: ProductType
    cost: float
    price: float
    stock_quantity: int
    points_on_sale: int
    specifications: Dict[str, Any] = Field(default_factory=dict)
    cross_references: List[CrossReference] = Field(default_factory=list)
    applications: List[Application] = Field(default_factory=list)
    image_urls: List[str] = Field(default_factory=list)
    
    # --- Campos con Valores por Defecto Gestionados por el Servidor ---
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = {ObjectId: str} # Asegura que los ObjectId se conviertan a string al serializar a JSON.


# 3. Modelo de Salida (DTO - Data Transfer Object):
# Define los datos que la API devuelve al frontend.
# En este caso, es seguro mostrar todos los campos del modelo de la base de datos.
class ProductOut(ProductInDB):
    pass