// frontend/src/features/purchasing/api/purchasingAPI.js

/**
 * @file Contiene todas las funciones para interactuar con los endpoints del Módulo de Compras.
 *
 * Este módulo actúa como una capa de abstracción sobre las llamadas de red (Axios),
 * centralizando la lógica de comunicación para las Órdenes de Compra y las
 * Recepciones/Facturas de Compra.
 *
 * Se aplica una capa de mapeo a las respuestas para estandarizar el modelo de datos
 * (ej. '_id' a 'id') antes de ser entregado a la aplicación, lo que asegura
 * consistencia y reduce la complejidad en los componentes.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import api from '../../../app/axiosConfig';
// Se importan los mapeadores para transformar las respuestas complejas de las órdenes y facturas.
import { mapPaginatedResponse, mapPurchaseOrderResponse } from '../mappers/purchaseOrderMappers';

// ==============================================================================
// SECCIÓN 2: FUNCIONES DE API PARA ÓRDENES DE COMPRA (PURCHASE ORDERS)
// ==============================================================================

/**
 * Obtiene una lista paginada y filtrada de órdenes de compra.
 * @param {object} params - Objeto con parámetros de consulta (ej. { page, pageSize, search }).
 * @returns {Promise<object>} Una promesa que resuelve con la respuesta paginada y ya mapeada.
 */
export const getPurchaseOrdersAPI = async (params) => {
    // CORRECCIÓN: Se actualiza la URL al nuevo prefijo de la API.
    const response = await api.get('/purchasing/orders', { params });
    return mapPaginatedResponse(response.data);
};

/**
 * Obtiene los datos detallados de una única orden de compra por su ID.
 * @param {string} orderId - El ID de la orden de compra a obtener.
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de compra, ya mapeados.
 */
export const getPurchaseOrderByIdAPI = async (orderId) => {
    // CORRECCIÓN: Se actualiza la URL al nuevo prefijo de la API.
    const response = await api.get(`/purchasing/orders/${orderId}`);
    return mapPurchaseOrderResponse(response.data);
};

/**
 * Envía los datos de una nueva orden de compra al backend para su creación.
 * @param {object} purchaseOrderData - El payload con los datos de la orden de compra desde el formulario.
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de compra recién creada y ya mapeada.
 */
export const createPurchaseOrderAPI = async (purchaseOrderData) => {
    // CORRECCIÓN: Se actualiza la URL al nuevo prefijo de la API.
    const response = await api.post('/purchasing/orders', purchaseOrderData);
    return mapPurchaseOrderResponse(response.data);
};

/**
 * Envía los datos actualizados de una orden de compra para su modificación.
 * @param {string} orderId - El ID de la orden de compra a actualizar.
 * @param {object} updateData - El payload con los campos a actualizar.
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de compra actualizada y mapeada.
 */
export const updatePurchaseOrderAPI = async (orderId, updateData) => {
    // CORRECCIÓN: Se actualiza la URL al nuevo prefijo de la API.
    const response = await api.patch(`/purchasing/orders/${orderId}`, updateData);
    return mapPurchaseOrderResponse(response.data);
};

/**
 * Envía una petición para cambiar el estado de una orden de compra (ej. aprobar, cancelar).
 * @param {string} orderId - El ID de la orden de compra.
 * @param {string} action - La acción a realizar (ej. 'approve', 'cancel').
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de compra actualizada y mapeada.
 */
export const updatePurchaseOrderStatusAPI = async (orderId, action) => {
    // CORRECCIÓN: Se actualiza la URL al nuevo prefijo de la API.
    const response = await api.post(`/purchasing/orders/${orderId}/status`, { action });
    return mapPurchaseOrderResponse(response.data);
};

// ==============================================================================
// SECCIÓN 3: FUNCIONES DE API PARA RECEPCIÓN/FACTURA DE COMPRA (PURCHASE BILL)
// ==============================================================================

/**
 * Envía los datos de una nueva recepción/factura al backend para su procesamiento.
 * @param {string} orderId - El ID de la Orden de Compra de origen.
 * @param {object} billData - El payload con los datos de la recepción (número de factura, ítems recibidos, etc.).
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la factura de compra recién creada y ya mapeada.
 */
export const registerReceiptAPI = async (orderId, billData) => {
    const response = await api.post(`/purchasing/orders/${orderId}/register-receipt`, billData);
    // Reutilizamos el mapeador, ya que la estructura de la respuesta es similar y se beneficia de la estandarización.
    return mapPurchaseOrderResponse(response.data);
};

/**
 * Obtiene los datos detallados de una única factura de compra por su ID.
 * @param {string} billId - El ID de la factura de compra a obtener.
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la factura de compra, ya mapeados.
 */
export const getPurchaseBillByIdAPI = async (billId) => {
    const response = await api.get(`/purchasing/bills/${billId}`);
    return mapPurchaseOrderResponse(response.data);
};