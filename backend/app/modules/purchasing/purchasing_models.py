# /backend/app/modules/purchasing/purchasing_models.py

"""
Define los modelos de datos de Pydantic para el Módulo de Compras (Purchasing).
...
"""

# ==============================================================================
# SECCIÓN 1: IMPORTACIONES
# ==============================================================================
import logging
# --- CORRECCIÓN --- Se añaden 'Dict' y 'Any' a la importación.
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timezone
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict, root_validator


from app.models.shared import PyObjectId
from app.modules.crm.supplier_models import SupplierOut

# --- Se añade un logger para depuración ---
logger = logging.getLogger(__name__)

# ==============================================================================
# SECCIÓN 2: ENUMS PARA ESTADOS Y TIPOS
# ==============================================================================
# (Sin cambios en esta sección)

class PurchaseOrderStatus(str, Enum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    PARTIALLY_RECEIVED = "partially_received"
    FULLY_RECEIVED = "fully_received"
    BILLED = "billed"
    CANCELLED = "cancelled"

class PurchaseBillStatus(str, Enum):
    UNPAID = "unpaid"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"

# ==============================================================================
# SECCIÓN 3: MODELOS PARA ITEMS (Sub-documentos)
# ==============================================================================
# (Sin cambios en esta sección)

class PurchaseOrderItemCreate(BaseModel):
    product_id: PyObjectId
    quantity_ordered: int = Field(..., gt=0)
    unit_cost: float = Field(..., ge=0)
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

class PurchaseOrderItem(PurchaseOrderItemCreate):
    sku: str
    name: str

class GoodsReceiptItem(BaseModel):
    product_id: PyObjectId
    sku: str
    name: str
    quantity_ordered: int = Field(..., gt=0)
    quantity_received: int = Field(..., ge=0)
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

class PurchaseBillItem(BaseModel):
    product_id: PyObjectId
    sku: str
    name: str
    quantity_billed: int = Field(..., gt=0)
    unit_cost: float = Field(..., ge=0)
    subtotal: float
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)

# ==============================================================================
# SECCIÓN 4: MODELOS PARA LA ORDEN DE COMPRA (PURCHASE ORDER)
# ==============================================================================
# (Sin cambios en Create, Update, InDB)

class PurchaseOrderCreate(BaseModel):
    supplier_id: PyObjectId
    order_date: date
    expected_delivery_date: Optional[date] = None
    notes: Optional[str] = ""
    items: List[PurchaseOrderItemCreate]

class PurchaseOrderUpdate(BaseModel):
    expected_delivery_date: Optional[date] = None
    notes: Optional[str] = None
    items: Optional[List[PurchaseOrderItemCreate]] = None

class PurchaseOrderInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    order_number: str
    supplier_id: PyObjectId
    created_by_id: PyObjectId
    order_date: datetime
    expected_delivery_date: Optional[datetime] = None
    notes: Optional[str] = ""
    items: List[PurchaseOrderItem]
    total_amount: float
    status: PurchaseOrderStatus = PurchaseOrderStatus.DRAFT
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    receipt_ids: List[PyObjectId] = []
    bill_ids: List[PyObjectId] = []
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})

class PurchaseOrderOut(BaseModel):
    """Modelo de la Orden de Compra para respuestas de la API."""
    id: PyObjectId = Field(..., alias="_id")
    order_number: str
    supplier: Optional[SupplierOut] = None
    supplier_id: PyObjectId
    created_by_id: PyObjectId
    order_date: datetime
    expected_delivery_date: Optional[datetime] = None
    notes: Optional[str] = ""
    items: List[PurchaseOrderItem]
    total_amount: float
    status: PurchaseOrderStatus
    created_at: datetime
    updated_at: datetime
    receipt_ids: List[PyObjectId] = []
    bill_ids: List[PyObjectId] = []

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={PyObjectId: str}
    )

    @root_validator(pre=True)
    @classmethod
    def debug_check_supplier_data(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        """
        Este validador se usa solo para depuración. Imprime los datos que
        recibe el modelo antes de la validación final.
        """
        order_num = values.get('order_number', 'N/A')
        logger.info(f"[DEBUG_MODEL_PURCHASING] Validando PurchaseOrderOut para la orden: {order_num}")
        
        if 'supplier' in values:
            supplier_data = values['supplier']
            if supplier_data is not None:
                logger.info(f"[DEBUG_MODEL_PURCHASING] -> El campo 'supplier' está PRESENTE y no es nulo.")
                logger.info(f"[DEBUG_MODEL_PURCHASING] -> Tipo de 'supplier': {type(supplier_data)}")
                logger.info(f"[DEBUG_MODEL_PURCHASING] -> Contenido de 'supplier': {supplier_data}")
            else:
                logger.warning(f"[DEBUG_MODEL_PURCHASING] -> El campo 'supplier' está presente, pero es NULO.")
        else:
            logger.error(f"[DEBUG_MODEL_PURCHASING] -> ¡ERROR CRÍTICO! El campo 'supplier' está AUSENTE en los datos de entrada.")
        
        logger.info(f"[DEBUG_MODEL_PURCHASING] -> Datos completos recibidos por el modelo: {values}")
        return values

# ... (El resto del archivo permanece sin cambios)
# ==============================================================================
# SECCIÓN 5: MODELOS PARA LA RECEPCIÓN DE MERCANCÍA (GOODS RECEIPT)
# ==============================================================================

class GoodsReceiptCreate(BaseModel):
    purchase_order_id: PyObjectId
    received_date: date
    notes: Optional[str] = ""
    items: List[GoodsReceiptItem]

class GoodsReceiptInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    receipt_number: str
    purchase_order_id: PyObjectId
    supplier_id: PyObjectId
    created_by_id: PyObjectId
    received_date: datetime
    notes: Optional[str] = ""
    items: List[GoodsReceiptItem]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})

class GoodsReceiptOut(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    receipt_number: str
    purchase_order_id: PyObjectId
    supplier: Optional[SupplierOut] = None
    supplier_id: PyObjectId
    created_by_id: PyObjectId
    received_date: datetime
    notes: Optional[str] = ""
    items: List[GoodsReceiptItem]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})

# ==============================================================================
# SECCIÓN 6: MODELOS PARA LA FACTURA DE COMPRA (PURCHASE BILL)
# ==============================================================================

class PurchaseBillCreate(BaseModel):
    purchase_order_id: PyObjectId
    supplier_invoice_number: str
    invoice_date: date
    due_date: date
    notes: Optional[str] = ""
    items: List[PurchaseBillItem]

class PurchaseBillInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    bill_number: str
    purchase_order_id: PyObjectId
    supplier_id: PyObjectId
    created_by_id: PyObjectId
    supplier_invoice_number: str
    invoice_date: datetime
    due_date: datetime
    notes: Optional[str] = ""
    items: List[PurchaseBillItem]
    total_amount: float
    paid_amount: float = 0.0
    status: PurchaseBillStatus = PurchaseBillStatus.UNPAID
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})

class PurchaseBillOut(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    bill_number: str
    purchase_order_id: PyObjectId
    supplier: Optional[SupplierOut] = None
    supplier_id: PyObjectId
    created_by_id: PyObjectId
    supplier_invoice_number: str
    invoice_date: datetime
    due_date: datetime
    notes: Optional[str] = ""
    items: List[PurchaseBillItem]
    total_amount: float
    paid_amount: float
    status: PurchaseBillStatus
    created_at: datetime
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True, json_encoders={PyObjectId: str})