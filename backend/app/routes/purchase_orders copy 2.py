# /backend/app/routes/purchase_orders.py
# CÓDIGO COMPLETO Y CORREGIDO CON NUEVAS RUTAS - LISTO PARA COPIAR Y PEGAR

from fastapi import APIRouter, Depends, Body, HTTPException, status
from typing import List, Optional

# --- CAMBIO: Importar los modelos/esquemas desde su ubicación correcta ---
from app.models.purchase_order import PurchaseOrderCreate, PurchaseOrderInDB

router = APIRouter(
    prefix="/purchase-orders",
    tags=["Purchase Orders"]
)

@router.post("/", response_model=PurchaseOrderInDB, status_code=status.HTTP_201_CREATED)
async def create_purchase_order(order_data: PurchaseOrderCreate):
    """
    Crea una nueva Orden de Compra en estado 'BORRADOR'.
    La lógica real guardaría en la base de datos y calcularía los totales.
    """
    print("Payload recibido:", order_data.dict())
    
    # --- Lógica de simulación (reemplazar con lógica de BD) ---
    # 1. Calcular totales
    subtotal = sum(item.quantity * item.unit_cost for item in order_data.items)
    tax_amount = subtotal * (order_data.tax_percentage / 100)
    total_amount = subtotal + tax_amount + order_data.other_charges
    
    # 2. Generar número de orden y ID
    # 3. Guardar en la base de datos...
    
    # Devolvemos un objeto que simula lo que se guardó
    new_order_data = order_data.dict()
    new_order_data.update({
        "_id": "simulated_id_12345",
        "id": "simulated_id_12345",
        "order_number": "OC-2023-005",
        "status": "BORRADOR",
        "subtotal": subtotal,
        "tax_amount": tax_amount,
        "total_amount": total_amount,
    })
    
    return new_order_data

@router.get("/", response_model=List[PurchaseOrderInDB])
async def get_all_purchase_orders():
    """
    Lista todas las órdenes de compra.
    (Devolverá datos de ejemplo hasta conectar la BD)
    """
    # TODO: Implementar la llamada a la base de datos real.
    return []

# --- NUEVA RUTA PARA CONFIRMAR UNA ORDEN ---
class ConfirmOrderPayload(BaseModel):
    supplier_invoice_code: str

@router.put("/{order_id}/confirm", response_model=PurchaseOrderInDB)
async def confirm_purchase_order(
    order_id: str, 
    payload: ConfirmOrderPayload = Body(...)
):
    """
    Confirma una orden de compra que está en 'BORRADOR'.
    Actualiza el estado a 'CONFIRMADA' y asigna el N° de factura.
    """
    print(f"Confirmando orden {order_id} con factura {payload.supplier_invoice_code}")
    # 1. Buscar la orden en la BD por order_id.
    # 2. Verificar que su estado sea 'BORRADOR'. Si no, lanzar HTTPException.
    # 3. Actualizar el estado a 'CONFIRMADA' y el supplier_invoice_code.
    # 4. Guardar los cambios en la BD.
    # 5. Devolver la orden actualizada.
    
    # Simulación de respuesta
    # ... buscar y devolver la orden actualizada
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Función no implementada")

# --- NUEVA RUTA PARA RECIBIR MERCANCÍA ---
@router.post("/{order_id}/receive", response_model=PurchaseOrderInDB)
async def receive_purchase_order_items(order_id: str):
    """
    Registra la recepción de mercancía de una orden 'CONFIRMADA'.
    Actualiza el estado a 'RECIBIDA_TOTAL' o 'RECIBIDA_PARCIAL'.
    ¡AQUÍ SE ACTUALIZA EL STOCK DEL INVENTARIO!
    """
    print(f"Recibiendo mercancía para la orden {order_id}")
    # 1. Buscar la orden en la BD.
    # 2. Verificar que su estado sea 'CONFIRMADA'.
    # 3. Para cada item en la orden:
    #    a. Buscar el producto en la tabla de inventario.
    #    b. Incrementar su stock por la cantidad recibida.
    #    c. Guardar el cambio en el inventario.
    # 4. Actualizar el estado de la OC a 'RECIBIDA_TOTAL'.
    # 5. Guardar y devolver la OC actualizada.
    
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Función no implementada")