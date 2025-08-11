// frontend/src/features/purchasing/mappers/purchaseOrderMappers.js

/**
 * @file Mappers para el módulo de Compras.
 * @description Estas funciones transforman los datos crudos recibidos de la API
 * a un formato consistente y predecible que los componentes del frontend pueden usar
 * de manera segura. La principal tarea es estandarizar los identificadores a 'id'.
 */

/**
 * Mapea un único objeto para asegurar que tenga una propiedad 'id'.
 * Si el objeto tiene '_id' pero no 'id', copia el valor de '_id' a 'id'.
 * @param {object} item - El objeto individual a mapear (ej. un producto, un proveedor).
 * @returns {object} El objeto con la propiedad 'id' garantizada.
 */
const mapItemToId = (item) => {
    if (!item) return null;
    // Si el item tiene _id pero no tiene una propiedad id, la creamos.
    if (item._id && typeof item.id === 'undefined') {
        return {
            ...item,
            id: item._id,
        };
    }
    return item;
};

/**
 * Mapea un array de objetos usando la función mapItemToId.
 * @param {Array<object>} items - El array de objetos a mapear.
 * @returns {Array<object>} El array con todos sus objetos mapeados.
 */
const mapArrayToId = (items) => {
    if (!Array.isArray(items)) return [];
    return items.map(mapItemToId);
};

/**
 * Mapeador específico para una Orden de Compra.
 * Estandariza el ID de la propia orden, el ID del proveedor anidado y los IDs
 * de todos los productos en la lista de items.
 * @param {object} purchaseOrder - La orden de compra cruda de la API.
 * @returns {object} La orden de compra con todos sus IDs estandarizados.
 */
export const mapPurchaseOrderResponse = (purchaseOrder) => {
    if (!purchaseOrder) return null;
    
    // Mapea la orden principal
    let mappedOrder = mapItemToId(purchaseOrder);

    // Mapea el proveedor si existe
    if (mappedOrder.supplier) {
        mappedOrder.supplier = mapItemToId(mappedOrder.supplier);
    }

    // Mapea los productos dentro del array de items
    if (mappedOrder.items) {
        // Importante: No mapeamos el 'item' en sí, sino el producto DENTRO del item si lo tuviera.
        // La estandarización principal se hará en la lista de productos general.
        // Aquí solo nos aseguramos de que los datos que vienen con la OC sean consistentes.
        mappedOrder.items = mappedOrder.items.map(item => mapItemToId(item));
    }
    
    return mappedOrder;
};

/**
 * Mapeador para una respuesta paginada (ej. lista de productos, lista de proveedores).
 * Mapea cada objeto dentro del array 'items' de la respuesta.
 * @param {object} paginatedResponse - La respuesta paginada de la API (ej. { items: [...], total_count: X }).
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

// ==============================================================================
// SECCIÓN DE EXPORTACIÓN ADICIONAL
// ==============================================================================
// CORRECCIÓN: Exportamos 'mapArrayToId' para que pueda ser usado directamente
// por otros módulos cuando la respuesta de la API es un array simple.
export { mapArrayToId };