// frontend/src/features/sales/mappers/salesMappers.js

/**
 * @file Mappers para el módulo de Ventas.
 * @description Este archivo centraliza la lógica de transformación de datos
 * para el flujo de ventas, convirtiendo los datos del estado de la UI (formularios)
 * al formato de payload (DTO) que espera el backend.
 */

// ==============================================================================
// SECCIÓN 0: FUNCIONES DE AYUDA
// ==============================================================================

/**
 * Formatea un objeto Date de JavaScript a un string 'YYYY-MM-DD' para la API.
 * Pydantic v2 es estricto y requiere este formato para los campos de tipo `date`.
 * @param {Date} date - El objeto de fecha del formulario.
 * @returns {string} La fecha formateada como un string.
 */
const formatDateForAPI = (date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        // Retorna la fecha actual como fallback si la fecha es inválida.
        return new Date().toISOString().split('T')[0];
    }
    // Extrae de forma segura la parte YYYY-MM-DD del formato ISO.
    return date.toISOString().split('T')[0];
};

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
        order_date: formatDateForAPI(formValues.order_date),
        notes: formValues.notes || '',
        shipping_address: formValues.shipping_address || '',
        items: formValues.items
            .filter(item => item.product?.id && (Number(item.quantity) || 0) > 0)
            .map(item => ({
                product_id: item.product.id,
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
        order_date: formatDateForAPI(formValues.order_date),
        notes: formValues.notes || '',
        shipping_address: formValues.shipping_address || '',
        items: formValues.items
            .filter(item => item.product?.id && (Number(item.quantity) || 0) > 0)
            .map(item => ({
                product_id: item.product.id,
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
        shipping_date: formatDateForAPI(formValues.shipping_date),
        notes: formValues.notes || '',
        // Filtra solo los ítems que se van a despachar y mapea al formato de la API.
        items: formValues.items
            .filter(item => (Number(item.quantity_shipped) || 0) > 0)
            .map(item => ({
                product_id: item.product_id,
                sku: item.sku,
                name: item.name,
                // [SOLUCIÓN] Se utiliza 'item.quantity' que contiene la cantidad original
                // de la orden y se asegura que la conversión a número sea robusta.
                quantity_ordered: Number(item.quantity) || 0,
                quantity_shipped: Number(item.quantity_shipped) || 0,
            })),
    };
};