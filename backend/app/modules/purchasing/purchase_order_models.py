# /backend/app/modules/purchasing/purchase_order_models.py
# MODELOS DE DATOS PARA LA ENTIDAD 'ORDEN DE COMPRA'

from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime, timezone

# Asumimos que PyObjectId está en un archivo de modelos compartidos
from app.models.shared import PyObjectId

# --- SECCIÓN 1: MODELOS DE SOPORTE (SUB-DOCUMENTOS) ---

class PurchaseOrderItemBase(BaseModel):
    """
    Define los campos base que el frontend envía para cada ítem de una orden.
    Usa 'product_id' como un string para simplificar la entrada de datos.
    """
    product_id: str = Field(..., description="ID del producto que se está comprando.")
    quantity_ordered: int = Field(..., gt=0, description="Cantidad pedida al proveedor.")
    unit_cost: float = Field(..., ge=0, description="Costo unitario de compra del producto en esta orden.")

class PurchaseOrderItemInDB(PurchaseOrderItemBase):
    """
    Representa un ítem como se guarda en la base de datos.
    Se enriquece con datos del producto para evitar consultas ('joins') complejas en el futuro.
    """
    product_sku: str
    product_name: str

# --- SECCIÓN 2: ARQUITECTURA DE MODELOS PRINCIPALES DE LA ORDEN DE COMPRA ---

# 2.1: Modelo de Entrada para CREACIÓN (DTO)
class PurchaseOrderCreate(BaseModel):
    """Define los datos que el frontend DEBE enviar para crear una orden de compra."""
    supplier_id: str = Field(..., description="ID del proveedor al que se le realiza la compra.")
    order_date: datetime
    expected_delivery_date: Optional[datetime] = None
    items: List[PurchaseOrderItemBase] = Field(..., min_length=1, description="Lista de productos a comprar.")
    notes: Optional[str] = None

# 2.2: Modelo de Entrada para ACTUALIZACIÓN (DTO)
class PurchaseOrderUpdate(BaseModel):
    """Define los campos que se pueden actualizar de una orden. Todos son opcionales."""
    order_date: Optional[datetime] = None
    expected_delivery_date: Optional[datetime] = None
    status: Optional[Literal["draft", "approved", "partially_received", "completed", "cancelled"]] = None
    items: Optional[List[PurchaseOrderItemBase]] = None
    notes: Optional[str] = None

# 2.3: Modelo de Base de Datos (La "Fuente de la Verdad")
class PurchaseOrderInDB(BaseModel):
    """Representa el documento completo de la Orden de Compra como se almacena en MongoDB."""
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    order_number: str # Este campo será generado por el servicio para asegurar unicidad.
    
    supplier_id: PyObjectId
    supplier_name: str # Campo desnormalizado para referencia rápida.
    
    order_date: datetime
    expected_delivery_date: Optional[datetime] = None
    
    status: Literal["draft", "approved", "partially_received", "completed", "cancelled"] = "draft"
    
    items: List[PurchaseOrderItemInDB] # Usa el modelo enriquecido.
    
    # Campos calculados que se guardarán en la base de datos.
    subtotal: float
    tax_amount: float
    total_amount: float
    
    notes: Optional[str] = None
    
    # Campos de auditoría gestionados por el servidor.
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        from_attributes = True
        populate_by_name = True
        # Asegura que ObjectId y datetime se conviertan a formatos JSON estándar.
        json_encoders = { PyObjectId: str, datetime: lambda dt: dt.isoformat() }

# 2.4: Modelo de Salida (DTO)
class PurchaseOrderOut(PurchaseOrderInDB):
    """Define la estructura de datos que la API devuelve al frontend."""
    pass

# --- ALIAS PARA COMPATIBILIDAD Y CLARIDAD ---
# Hacemos que el nombre genérico 'PurchaseOrder' apunte al modelo de salida,
# que es el que se usa más comúnmente como tipo de respuesta en las rutas.
PurchaseOrder = PurchaseOrderOut