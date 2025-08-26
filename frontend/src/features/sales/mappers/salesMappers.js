// File: /frontend/src/features/sales/mappers/salesMappers.js

/**
 * @file Mappers para el módulo de Ventas.
 * @description Este archivo centraliza la lógica de transformación de datos
 * para el flujo de ventas, convirtiendo los datos desde los formularios de la UI
 * hacia los payloads que la API del backend espera recibir.
 */

// ==============================================================================
// SECCIÓN 1: FUNCIONES DE AYUDA
// ==============================================================================

/**
 * Formatea un objeto Date a un string 'YYYY-MM-DD' de forma segura.
 * @param {Date|null|undefined} date - El objeto Date del formulario.
 * @returns {string|null} La fecha formateada o null si la entrada es inválida.
 */
const formatDateForAPI = (date) => {
    if (date instanceof Date && !isNaN(date)) {
        return date.toISOString().split('T')[0];
    }
    return null;
};

// ==============================================================================
// SECCIÓN 2: MAPEADORES DE ORDEN DE VENTA
// ==============================================================================

// ------------------------------------------------------------------------------
// Sub-sección 2.1: Mapeadores de API a UI (Formulario)
// ------------------------------------------------------------------------------

/**
 * Transforma los datos de una Orden de Venta (recibidos de la API) a la
 * estructura que el formulario de Formik (SalesOrderForm) espera.
 *
 * @param {object} orderData - El objeto de la orden de venta ya transformado por la capa de API.
 * @param {Array<object>} allProducts - Un array con todos los productos disponibles.
 * @returns {object|null} Un objeto formateado y listo para ser usado por Formik.
 */
export const mapSalesOrderToFormValues = (orderData, allProducts) => {
    if (!orderData) {
        return null;
    }

    const productsMap = new Map(allProducts.map(p => [p.id, p]));

    const mappedItems = (orderData.items || []).map(item => ({
        product: productsMap.get(item.product_id) || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
    }));
    
    // La capa de API ya se ha encargado de mapear `_id` a `id` y de enriquecer
    // el objeto `customer`. Ya no se necesita lógica de transformación aquí.
    return {
        customer: orderData.customer || null,
        order_date: orderData.order_date ? new Date(orderData.order_date) : new Date(),
        notes: orderData.notes || '',
        shipping_address: orderData.shipping_address || '',
        items: mappedItems.length > 0 ? mappedItems : [{ product: null, quantity: 1, unit_price: 0 }],
    };
};

// ------------------------------------------------------------------------------
// Sub-sección 2.2: Mapeadores de UI (Formulario) a API
// ------------------------------------------------------------------------------

/**
 * Transforma los valores del formulario de nueva Orden de Venta al payload de la API.
 */
export const mapFormValuesToCreatePayload = (formValues) => {
    return {
        customer_id: formValues.customer?.id || null,
        order_date: formatDateForAPI(formValues.order_date),
        notes: formValues.notes || '',
        shipping_address: formValues.shipping_address || '',
        items: (formValues.items || [])
            .filter(item => item.product?.id && Number(item.quantity) > 0)
            .map(item => ({
                product_id: item.product.id,
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price) || 0,
            })),
    };
};

/**
 * Transforma los valores del formulario de edición de Orden de Venta al payload de la API.
 */
export const mapFormValuesToUpdatePayload = (formValues) => {
    return {
        order_date: formatDateForAPI(formValues.order_date),
        notes: formValues.notes || '',
        shipping_address: formValues.shipping_address || '',
        items: (formValues.items || [])
            .filter(item => item.product?.id && Number(item.quantity) > 0)
            .map(item => ({
                product_id: item.product.id,
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price) || 0,
            })),
    };
};

// ==============================================================================
// SECCIÓN 3: MAPEADORES DE DESPACHO (UI -> API)
// ==============================================================================

/**
 * Transforma los valores del formulario de Despacho al payload que espera la API.
 */
export const mapFormValuesToShipmentPayload = (formValues) => {
    return {
        shipping_date: formatDateForAPI(formValues.shipping_date),
        notes: formValues.notes || '',
        items: (formValues.items || [])
            .filter(item => Number(item.quantity_shipped) > 0)
            .map(item => ({
                product_id: item.product_id,
                sku: item.sku,
                name: item.name,
                quantity_ordered: Number(item.quantity_ordered),
                quantity_shipped: Number(item.quantity_shipped),
            })),
    };
};