from pydantic import BaseModel, Field
from typing import List, Optional, Union, Literal

# --- MODELOS DE DIMENSIONES ESPECÍFICAS ---
# Cada clase representa un conjunto de medidas válidas para un tipo/forma de filtro.

class PanelDimensions(BaseModel):
    A: int = Field(..., description="Largo total en mm")
    B: int = Field(..., description="Ancho total en mm")
    H: int = Field(..., description="Altura/Espesor en mm")

class RoundAirDimensions(BaseModel):
    A: int = Field(..., description="Diámetro exterior superior en mm")
    B: int = Field(..., description="Diámetro interior superior en mm")
    C: Optional[int] = Field(None, description="Diámetro exterior inferior en mm")
    D: Optional[int] = Field(None, description="Diámetro interior inferior en mm")
    H: int = Field(..., description="Altura en mm")

class FuelCartridgeDimensions(BaseModel):
    A: int = Field(..., description="Diámetro exterior en mm")
    B: int = Field(..., description="Diámetro interior superior en mm")
    C: Optional[int] = Field(None, description="Diámetro interior inferior en mm")
    H: int = Field(..., description="Altura en mm")

class FuelHousingDimensions(BaseModel):
    A: int = Field(..., description="Altura total en mm")
    B: Optional[int] = Field(None, description="Diámetro exterior del cuerpo en mm")
    C: str = Field(..., description="Rosca")
    F: int = Field(..., description="Diámetro exterior de la junta en mm")
    G: int = Field(..., description="Diámetro interior de la junta en mm")
    H: int = Field(..., description="Diámetro total de la base en mm")
    
class FuelLinealDimensions(BaseModel):
    A: int = Field(..., description="Largo total en mm")
    F: int = Field(..., description="Diámetro del tubo de entrada en mm")
    G: int = Field(..., description="Diámetro del tubo de salida en mm")
    H: int = Field(..., description="Diámetro del cuerpo en mm")

class OilCartridgeDimensions(FuelCartridgeDimensions): # Reutiliza la misma estructura
    pass

class OilHousingDimensions(BaseModel):
    A: int = Field(..., description="Altura total en mm")
    B: str = Field(..., description="Rosca")
    C: int = Field(..., description="Diámetro exterior de la junta en mm")
    G: int = Field(..., description="Diámetro interior de la junta en mm")
    H: int = Field(..., description="Diámetro total del cuerpo en mm")

class CabinRoundDimensions(BaseModel):
    A: int = Field(..., description="Diámetro exterior en mm")
    B: Optional[int] = Field(None, description="Diámetro interior en mm")
    H: int = Field(..., description="Altura en mm")

# --- UNIÓN DE TODOS LOS MODELOS DE DIMENSIONES ---
# Este campo puede ser de cualquiera de los tipos definidos aquí.
AllDimensions = Union[
    PanelDimensions, RoundAirDimensions, FuelCartridgeDimensions,
    FuelHousingDimensions, FuelLinealDimensions, OilCartridgeDimensions,
    OilHousingDimensions, CabinRoundDimensions
]

# --- CAMPO DISCRIMINADOR (LA CLAVE DE LA ARQUITECTURA) ---
# Este campo nos dirá qué tipo de dimensión esperar.
DimensionSchemaKey = Literal[
    'panel', 'round_air', 'fuel_cartridge', 'fuel_housing',
    'fuel_lineal', 'oil_cartridge', 'oil_housing', 'cabin_round'
]


# --- MODELO PRINCIPAL DEL PRODUCTO ---
class Product(BaseModel):
    id: str = Field(..., alias="_id")
    main_code: str = Field(..., description="Código principal o SKU del producto")
    name: str = Field(..., description="Nombre descriptivo del producto")
    product_type: Literal["aire", "combustible", "aceite", "habitaculo"]
    
    # El discriminador que nos dice qué estructura de dimensiones usar.
    dimension_schema: DimensionSchemaKey
    
    # El campo que contiene las dimensiones, validado contra la Unión.
    dimensions: AllDimensions
    
    cross_references: List[str] = Field(default_factory=list, description="Códigos alternativos")
    
    # Datos para el vendedor/uso interno
    stock_quantity: int = Field(default=0)
    price: float = Field(default=0.0)
    points: int = Field(default=0)
    
    image_url: Optional[str] = Field(None, description="URL de la foto del producto")
    # URL para el diagrama de dimensiones, basado en el schema_key
    dimension_diagram_url: Optional[str] = Field(None)

    class Config:
        # Pydantic V2 usa 'from_attributes' en lugar de 'orm_mode'
        from_attributes = True 
        # Y 'validate_by_name' en lugar de 'allow_population_by_field_name'
        validate_by_name = True

