// File: /frontend/src/features/purchasing/mappers/purchaseOrderMappers.js

/**
 * @file Mappers específicos para el Módulo de Compras (Purchasing).
 *
 * @description Este archivo centraliza la lógica de transformación de datos
 * para el flujo de compras, convirtiendo datos entre la UI y la API.
 */

// ==============================================================================
// SECCIÓN 1: FUNCIONES DE AYUDA
// ==============================================================================

const formatDateForAPI = (date) => {
    if (date instanceof Date && !isNaN(date)) {
        return date.toISOString().split('T')[0];
    }
    return null;
};

// ==============================================================================
// SECCIÓN 2: MAPEADORES (API -> UI)
// ==============================================================================

/**
 * Transforma los datos de una Orden de Compra (de la API) a la estructura
 * que el formulario (PurchaseOrderForm) espera para sus 'initialValues'.
 * @param {object} orderData - El objeto de la orden de compra ya transformado por la capa de API.
 * @param {Array<object>} allProducts - Un array con todos los productos disponibles.
 * @returns {object|null} Un objeto formateado y listo para ser usado por Formik.
 */
export const mapPurchaseOrderToFormValues = (orderData, allProducts) => {
    if (!orderData) return null;

    const productsMap = new Map(allProducts.map(p => [p.id, p]));

    const mappedItems = (orderData.items || []).map(item => ({
        product: productsMap.get(item.product_id) || null,
        quantity_ordered: item.quantity_ordered,
        unit_cost: item.unit_cost,
    }));

    return {
        supplier: orderData.supplier || null,
        order_date: orderData.order_date ? new Date(orderData.order_date) : new Date(),
        expected_delivery_date: orderData.expected_delivery_date ? new Date(orderData.expected_delivery_date) : null,
        notes: orderData.notes || '',
        items: mappedItems.length > 0 ? mappedItems : [{ product: null, quantity_ordered: 1, unit_cost: 0 }],
    };
};

// ==============================================================================
// SECCIÓN 3: MAPEADORES (UI -> API)
// ==============================================================================

/**
 * Transforma los valores del formulario de creación de OC al payload de la API.
 */
export const mapFormValuesToCreatePayload = (formValues) => {
  return {
    supplier_id: formValues.supplier?.id || null,
    order_date: formatDateForAPI(formValues.order_date),
    expected_delivery_date: formatDateForAPI(formValues.expected_delivery_date),
    notes: formValues.notes || '',
    items: (formValues.items || [])
        .filter(item => item.product?.id && Number(item.quantity_ordered) > 0)
        .map(item => ({
            product_id: item.product.id,
            quantity_ordered: Number(item.quantity_ordered),
            unit_cost: Number(item.unit_cost) || 0,
        })),
  };
};

/**
 * Transforma los valores del formulario de actualización de OC al payload de la API.
 */
export const mapFormValuesToUpdatePayload = (formValues) => {
  return {
    expected_delivery_date: formatDateForAPI(formValues.expected_delivery_date),
    notes: formValues.notes || '',
    items: (formValues.items || [])
        .filter(item => item.product?.id && Number(item.quantity_ordered) > 0)
        .map(item => ({
            product_id: item.product.id,
            quantity_ordered: Number(item.quantity_ordered),
            unit_cost: Number(item.unit_cost) || 0,
        })),
  };
};

/**
 * Transforma los valores del formulario de recepción al payload de la API.
 */
export const mapFormValuesToGoodsReceiptPayload = (formValues, orderId) => {
  return {
    purchase_order_id: orderId,
    received_date: formatDateForAPI(formValues.received_date),
    notes: formValues.notes || '',
    items: (formValues.items || [])
      .filter(item => Number(item.quantity_received) > 0)
      .map(item => ({
        product_id: item.product_id,
        sku: item.sku,
        name: item.name,
        quantity_ordered: Number(item.quantity_ordered),
        quantity_received: Number(item.quantity_received),
      })),
  };
};

/**
 * Transforma los valores del formulario de factura al payload de la API.
 */
export const mapFormValuesToBillPayload = (formValues, orderId) => {
  return {
    purchase_order_id: orderId,
    supplier_invoice_number: formValues.supplier_invoice_number,
    invoice_date: formatDateForAPI(formValues.invoice_date),
    due_date: formatDateForAPI(formValues.due_date),
    notes: formValues.notes || '',
    items: (formValues.items || [])
      .filter(item => Number(item.quantity_billed) > 0)
      .map(item => ({
        product_id: item.product_id,
        sku: item.sku,
        name: item.name,
        quantity_billed: Number(item.quantity_billed),
        unit_cost: Number(item.unit_cost),
        subtotal: Number(item.quantity_billed) * Number(item.unit_cost),
      })),
  };
};