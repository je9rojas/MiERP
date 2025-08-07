// /frontend/src/features/purchasing/api/purchasingAPI.js

/**
 * @file Contiene todas las funciones para interactuar con los endpoints de Órdenes de Compra del backend.
 *
 * Este módulo actúa como una capa de abstracción sobre las llamadas de red (Axios),
 * proporcionando un conjunto de funciones claras y reutilizables para que los
 * componentes y hooks del módulo de compras puedan solicitar o enviar datos
 * sin conocer los detalles de la implementación de la API.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import api from '../../../app/axiosConfig';

// ==============================================================================
// SECCIÓN 2: FUNCIONES DE LA API
// ==============================================================================

/**
 * Obtiene una lista paginada y filtrada de órdenes de compra.
 * @param {object} params - Objeto con parámetros de consulta (ej. { page, pageSize, search, status }).
 * @returns {Promise<object>} Una promesa que resuelve con la respuesta paginada (ej. { items: [], total_count: 0 }).
 */
export const getPurchaseOrdersAPI = async (params) => {
    const response = await api.get('/purchase-orders', { params });
    return response.data;
};

/**
 * Obtiene los datos detallados de una única orden de compra por su ID.
 * @param {string} orderId - El ID de la orden de compra a obtener.
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de compra.
 */
export const getPurchaseOrderByIdAPI = async (orderId) => {
    const response = await api.get(`/purchase-orders/${orderId}`);
    return response.data;
};

/**
 * Envía los datos de una nueva orden de compra al backend para su creación.
 * @param {object} purchaseOrderData - El payload con los datos de la orden de compra desde el formulario.
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de compra recién creada.
 */
export const createPurchaseOrderAPI = async (purchaseOrderData) => {
    const response = await api.post('/purchase-orders', purchaseOrderData);
    return response.data;
};

/**
 * Envía los datos actualizados de una orden de compra para su modificación.
 * @param {string} orderId - El ID de la orden de compra a actualizar.
 * @param {object} updateData - El payload con los campos a actualizar.
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de compra actualizada.
 */
export const updatePurchaseOrderAPI = async (orderId, updateData) => {
    const response = await api.patch(`/purchase-orders/${orderId}`, updateData);
    return response.data;
};

/**
 * Envía una petición para cambiar el estado de una orden de compra (ej. aprobar, cancelar).
 * @param {string} orderId - El ID de la orden de compra.
 * @param {string} action - La acción a realizar (ej. 'approve', 'cancel').
 * @returns {Promise<object>} Una promesa que resuelve con los datos de la orden de compra actualizada.
 */
export const updatePurchaseOrderStatusAPI = async (orderId, action) => {
    const response = await api.post(`/purchase-orders/${orderId}/status`, { action });
    return response.data;
};