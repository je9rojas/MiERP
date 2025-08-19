// frontend/src/features/purchasing/mappers/purchaseOrderMappers.js

/**
 * @file Mappers específicos para el Módulo de Compras (Purchasing).
 *
 * @description Este archivo centraliza la lógica de transformación de datos
 * desde los formularios de la UI del módulo de Compras hacia los payloads que
 * la API del backend espera recibir. Sigue el principio de Separación de Concerns,
 * aislando esta lógica de "traducción" de los componentes y las llamadas a la API.
 */

// ==============================================================================
// SECCIÓN 1: MAPEADORES DE PAYLOAD (UI -> API)
// ==============================================================================

// --------------------------------------------------------------------------
// Sub-sección 1.1: Mapeadores de Órdenes de Compra (Purchase Order)
// --------------------------------------------------------------------------

/**
 * Transforma los valores del formulario de creación de OC al payload de la API.
 */
export const mapFormValuesToCreatePayload = (formValues) => {
  return {
    supplier_id: formValues.supplier?.id,
    order_date: formValues.order_date.toISOString().split('T')[0],
    expected_delivery_date: formValues.expected_delivery_date
      ? formValues.expected_delivery_date.toISOString().split('T')[0]
      : null,
    notes: formValues.notes,
    items: formValues.items.map(item => ({
      product_id: item.product?.id,
      quantity_ordered: Number(item.quantity_ordered) || 0,
      unit_cost: Number(item.unit_cost) || 0,
    })),
  };
};

/**
 * Transforma los valores del formulario de actualización de OC al payload de la API.
 */
export const mapFormValuesToUpdatePayload = (formValues) => {
  return {
    expected_delivery_date: formValues.expected_delivery_date
      ? formValues.expected_delivery_date.toISOString().split('T')[0]
      : null,
    notes: formValues.notes,
    items: formValues.items.map(item => ({
      product_id: item.product?.id,
      quantity_ordered: Number(item.quantity_ordered) || 0,
      unit_cost: Number(item.unit_cost) || 0,
    })),
  };
};

// --------------------------------------------------------------------------
// Sub-sección 1.2: Mapeadores de Recepción de Mercancía (Goods Receipt)
// --------------------------------------------------------------------------

/**
 * Transforma los valores del formulario de recepción al payload de la API.
 * @param {object} formValues - Los valores del formulario de Formik.
 * @param {string} orderId - El ID de la Orden de Compra asociada.
 * @returns {object} El payload para el endpoint `POST /purchasing/orders/{id}/receipts`.
 */
export const mapFormValuesToGoodsReceiptPayload = (formValues, orderId) => {
  return {
    // --- CORRECCIÓN CRÍTICA ---
    // Se añade el campo `purchase_order_id`, que es requerido por el backend.
    purchase_order_id: orderId,
    
    received_date: formValues.received_date.toISOString().split('T')[0],
    notes: formValues.notes,
    items: formValues.items
      // Se asegura de enviar solo los ítems que realmente se están recibiendo.
      .filter(item => Number(item.quantity_received) > 0)
      // Se asegura de que todos los campos requeridos por el modelo `GoodsReceiptItem` estén presentes.
      .map(item => ({
        product_id: item.product_id,
        sku: item.sku,
        name: item.name,
        quantity_ordered: Number(item.quantity_ordered),
        quantity_received: Number(item.quantity_received),
      })),
  };
};

// --------------------------------------------------------------------------
// Sub-sección 1.3: Mapeadores de Factura de Compra (Purchase Bill)
// --------------------------------------------------------------------------

/**
 * Transforma los valores del formulario de factura al payload de la API.
 */
export const mapFormValuesToBillPayload = (formValues) => {
  return {
    purchase_order_id: formValues.purchase_order_id,
    supplier_invoice_number: formValues.supplier_invoice_number,
    invoice_date: formValues.invoice_date.toISOString().split('T')[0],
    due_date: formValues.due_date.toISOString().split('T')[0],
    notes: formValues.notes,
    items: formValues.items.map(item => ({
      product_id: item.product_id,
      sku: item.sku,
      name: item.name,
      quantity_billed: Number(item.quantity_billed),
      unit_cost: Number(item.unit_cost),
      subtotal: Number(item.quantity_billed) * Number(item.unit_cost),
    })),
  };
};