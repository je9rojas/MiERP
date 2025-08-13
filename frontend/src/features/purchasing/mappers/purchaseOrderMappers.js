// frontend/src/features/purchasing/mappers/purchaseOrderMappers.js

/**
 * @file Mappers para el módulo de Compras.
 * @description Este archivo centraliza toda la lógica de transformación de datos para
 * el módulo de compras. Contiene funciones para dos direcciones de flujo:
 * 1. API -> UI: Transforma respuestas crudas de la API a un formato consistente
 *    y predecible para los componentes (ej. estandarizar '_id' a 'id').
 * 2. UI -> API: Transforma los valores de los formularios (Formik) al formato de
 *    payload (DTO) que espera el backend.
 * Este enfoque desacopla la lógica de transformación de los componentes y las llamadas a la API.
 */

// ==============================================================================
// SECCIÓN 1: MAPEADORES (API -> UI)
// ==============================================================================

/**
 * Mapea un único objeto para asegurar que tenga una propiedad 'id'.
 * @param {object} item - El objeto individual a mapear.
 * @returns {object} El objeto con la propiedad 'id' garantizada.
 */
const mapItemToId = (item) => {
    if (!item) return null;
    if (item._id && typeof item.id === 'undefined') {
        return { ...item, id: item._id };
    }
    return item;
};

/**
 * Mapea un array de objetos usando la función mapItemToId.
 * @param {Array<object>} items - El array de objetos a mapear.
 * @returns {Array<object>} El array con todos sus objetos mapeados.
 */
export const mapArrayToId = (items) => {
    if (!Array.isArray(items)) return [];
    return items.map(mapItemToId);
};

/**
 * Mapeador para una respuesta paginada (ej. lista de órdenes, lista de proveedores).
 * @param {object} paginatedResponse - La respuesta paginada de la API.
 * @returns {object} La respuesta paginada con sus items mapeados.
 */
export const mapPaginatedResponse = (paginatedResponse) => {
    if (!paginatedResponse || !paginatedResponse.items) {
        return { items: [], total_count: 0 };
    }
    return {
        ...paginatedResponse,
        items: mapArrayToId(paginatedResponse.items),
    };
};

/**
 * Mapeador específico para una respuesta de Orden de Compra o Factura de Compra.
 * @param {object} responseData - La orden o factura cruda de la API.
 * @returns {object} El objeto con todos sus IDs internos estandarizados.
 */
export const mapPurchaseOrderResponse = (responseData) => {
    if (!responseData) return null;
    
    let mappedData = mapItemToId(responseData);

    if (mappedData.supplier) {
        mappedData.supplier = mapItemToId(mappedData.supplier);
    }
    if (mappedData.items) {
        mappedData.items = mapArrayToId(mappedData.items);
    }
    
    return mappedData;
};


// ==============================================================================
// SECCIÓN 2: MAPEADORES (UI / Formulario -> API / Payload)
// ==============================================================================

/**
 * Transforma los valores del formulario de nueva OC al payload que espera la API.
 * @param {object} formValues - Los valores del formulario de Formik.
 * @returns {object} El payload para la API de creación de OC.
 */
export const mapFormValuesToCreatePayload = (formValues) => {
    return {
        supplier_id: formValues.supplier?.id,
        order_date: formValues.order_date.toISOString(),
        expected_delivery_date: formValues.expected_delivery_date ? formValues.expected_delivery_date.toISOString() : null,
        notes: formValues.notes,
        items: formValues.items.map(item => ({
            product_id: item.product?.id,
            quantity_ordered: Number(item.quantity_ordered) || 0,
            unit_cost: Number(item.unit_cost) || 0,
        })),
    };
};

/**
 * Transforma los valores del formulario de edición de OC al payload que espera la API.
 * @param {object} formValues - Los valores del formulario de Formik.
 * @returns {object} El payload para la API de actualización de OC.
 */
export const mapFormValuesToUpdatePayload = (formValues) => {
    return {
        expected_delivery_date: formValues.expected_delivery_date ? formValues.expected_delivery_date.toISOString() : null,
        notes: formValues.notes,
        items: formValues.items.map(item => ({
            product_id: item.product?.id,
            quantity_ordered: Number(item.quantity_ordered) || 0,
            unit_cost: Number(item.unit_cost) || 0,
        })),
    };
};

/**
 * Transforma los valores del formulario de recepción al payload que espera la API.
 * @param {object} formValues - Los valores del formulario de Formik.
 * @returns {object} El payload para la API de registro de recepción/factura.
 */
export const mapFormValuesToReceiptPayload = (formValues) => {
    return {
        supplier_invoice_number: formValues.supplier_invoice_number,
        received_date: formValues.received_date.toISOString(),
        notes: formValues.notes,
        // Filtra solo los ítems que se recibieron y mapea al formato de la API.
        items: formValues.items
            .filter(item => Number(item.quantity_received) > 0)
            .map(item => ({
                product_id: item.product_id, // Aquí el id ya es un string
                sku: item.sku,
                name: item.name,
                quantity_ordered: item.quantity_ordered,
                quantity_received: Number(item.quantity_received),
                unit_cost: Number(item.unit_cost),
            })),
    };
};