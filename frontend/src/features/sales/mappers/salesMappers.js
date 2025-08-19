// frontend/src/features/sales/mappers/salesMappers.js

/**
 * @file Mappers para el módulo de Ventas.
 * @description Este archivo centraliza la lógica de transformación de datos
 * para el flujo de ventas, convirtiendo los datos del estado de la UI (formularios)
 * al formato de payload (DTO) que espera el backend.
 */

// ==============================================================================
// SECCIÓN 1: MAPEADORES DE ORDEN DE VENTA (UI -> API)
// ==============================================================================

/**
 * Transforma los valores del formulario de nueva Orden de Venta al payload
 * que espera la API para su creación.
 * @param {object} formValues - Los valores del formulario de Formik.
 * @returns {object} El payload para la API de creación de Órdenes de Venta.
 */
export const mapFormValuesToCreatePayload = (formValues) => {
    return {
        customer_id: formValues.customer?.id,
        order_date: formValues.order_date.toISOString(),
        notes: formValues.notes,
        shipping_address: formValues.shipping_address,
        items: formValues.items.map(item => ({
            product_id: item.product?.id,
            quantity: Number(item.quantity) || 0,
            unit_price: Number(item.unit_price) || 0,
        })),
    };
};

/**
 * Transforma los valores del formulario de edición de Orden de Venta al payload
 * que espera la API para su actualización.
 * @param {object} formValues - Los valores del formulario de Formik.
 * @returns {object} El payload para la API de actualización de Órdenes de Venta.
 */
export const mapFormValuesToUpdatePayload = (formValues) => {
    return {
        customer_id: formValues.customer?.id,
        order_date: formValues.order_date.toISOString(),
        notes: formValues.notes,
        shipping_address: formValues.shipping_address,
        items: formValues.items.map(item => ({
            product_id: item.product?.id,
            quantity: Number(item.quantity) || 0,
            unit_price: Number(item.unit_price) || 0,
        })),
    };
};


// ==============================================================================
// SECCIÓN 2: MAPEADORES DE DESPACHO (UI -> API)
// ==============================================================================

/**
 * Transforma los valores del formulario de Despacho al payload que espera la API.
 * @param {object} formValues - Los valores del formulario de Formik.
 * @returns {object} El payload para la API de creación de Despachos.
 */
export const mapFormValuesToShipmentPayload = (formValues) => {
    return {
        shipping_date: formValues.shipping_date.toISOString(),
        notes: formValues.notes,
        // Filtra solo los ítems que se van a despachar y mapea al formato de la API.
        items: formValues.items
            .filter(item => Number(item.quantity_shipped) > 0)
            .map(item => ({
                product_id: item.product_id, // El ID del producto ya viene como string
                sku: item.sku,
                name: item.name,
                quantity_ordered: item.quantity, // La cantidad original de la OV
                quantity_shipped: Number(item.quantity_shipped),
            })),
    };
};