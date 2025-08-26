// /frontend/src/features/sales/mappers/salesMappers.js

/**
 * @file Mappers para el módulo de Ventas.
 * @description Este archivo centraliza la lógica de transformación de datos
 * para el flujo de ventas, convirtiendo los datos entre la UI y la API.
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
// SECCIÓN 1: MAPEADORES DE ORDEN DE VENTA
// ==============================================================================

// ------------------------------------------------------------------------------
// Sub-sección 1.1: Mapeadores de API a UI (Formulario)
// ------------------------------------------------------------------------------

/**
 * Transforma los datos de una Orden de Venta (recibidos de la API) a la
 * estructura de objeto que el formulario de Formik (SalesOrderForm) espera
 * para sus 'initialValues'.
 *
 * @param {object} orderData - El objeto de la orden de venta tal como llega de la API.
 * @param {Array<object>} allProducts - Un array con todos los productos disponibles en el sistema.
 * @returns {object} Un objeto formateado y listo para ser usado por Formik.
 */
export const mapSalesOrderToFormValues = (orderData, allProducts) => {
    if (!orderData) {
        return null;
    }

    // Se crea un mapa de productos para búsquedas eficientes (O(1) en promedio).
    const productsMap = new Map(allProducts.map(p => [p.id, p]));

    const mappedItems = (orderData.items || []).map(item => {
        // Para cada ítem de la orden, se busca el objeto de producto completo.
        const productObject = productsMap.get(item.product_id);
        
        return {
            // El Autocomplete del formulario espera un objeto 'product' completo.
            product: productObject || null, 
            quantity: item.quantity,
            unit_price: item.unit_price,
        };
    });
    
    // (CORREGIDO) Se estandariza el objeto 'customer' para que siempre use 'id'.
    // El objeto 'customer' anidado en la orden de venta viene con '_id', mientras que
    // la lista de 'customerOptions' usa 'id'. Esta función unifica el formato.
    const standardizedCustomer = orderData.customer 
        ? { ...orderData.customer, id: orderData.customer._id } 
        : null;

    return {
        // Se utiliza el objeto de cliente estandarizado.
        customer: standardizedCustomer,
        
        // Se asegura que la fecha sea un objeto Date válido.
        order_date: orderData.order_date ? new Date(orderData.order_date) : new Date(),

        notes: orderData.notes || '',
        
        // Se asigna el array de ítems ya transformado.
        items: mappedItems.length > 0 ? mappedItems : [{ product: null, quantity: 1, unit_price: 0 }],
    };
};


// ------------------------------------------------------------------------------
// Sub-sección 1.2: Mapeadores de UI (Formulario) a API
// ------------------------------------------------------------------------------

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
        items: formValues.items
            .filter(item => (Number(item.quantity_shipped) || 0) > 0)
            .map(item => ({
                product_id: item.product_id,
                sku: item.sku,
                name: item.name,
                quantity_ordered: Number(item.quantity) || 0,
                quantity_shipped: Number(item.quantity_shipped) || 0,
            })),
    };
};

// ==============================================================================
// SECCIÓN 3: MAPEADORES DE DESPACHO (API -> UI)
// ==============================================================================

/**
 * Transforma un único objeto de despacho de la API a un formato plano
 * que el DataGrid puede consumir directamente.
 * @param {object} shipment - El objeto de despacho recibido de la API.
 * @returns {object} Un objeto aplanado para la fila del DataGrid.
 */
export const mapShipmentToDataGridRow = (shipment) => {
    return {
        id: shipment._id,
        shipmentNumber: shipment.shipment_number || 'N/A',
        salesOrderNumber: shipment.sales_order_id || 'N/A',
        customerName: shipment.customer?.business_name || 'Cliente no encontrado',
        shipmentDate: shipment.shipping_date 
            ? new Date(shipment.shipping_date).toLocaleDateString() 
            // Maneja el caso de que la fecha sea nula o inválida
            : 'N/A',
        itemCount: shipment.items?.length || 0,
        createdByName: shipment.created_by?.name || 'Usuario desconocido',
        status: shipment.status || 'Sin estado',
    };
};

/**
 * Transforma la respuesta paginada completa de la API de despachos,
 * aplicando el mapeo a cada ítem.
 * @param {object} response - La respuesta de la API { total_count, items }.
 * @returns {object} La respuesta transformada para ser usada en la UI.
 */
export const mapPaginatedShipmentsForUI = (response) => {
    if (!response || !Array.isArray(response.items)) {
        return { total_count: 0, items: [] };
    }

    return {
        total_count: response.total_count,
        items: response.items.map(mapShipmentToDataGridRow),
    };
};