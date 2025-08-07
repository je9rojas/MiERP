// /frontend/src/api/purchasingAPI.js

import api from '../../../app/axiosConfig';

/**
 * Obtiene una lista paginada y filtrada de órdenes de compra.
 * @param {object} params - Parámetros de consulta (page, pageSize, search, status).
 * @returns {Promise<object>} - La respuesta de la API con { items: [], total: 0 }.
 */
export const getPurchaseOrdersAPI = async (params) => {
  const response = await api.get('/purchasing/purchase-orders', { params });
  return response.data;
};

/**
 * Obtiene los datos de una única orden de compra por su ID.
 * @param {string} id - El ID de la orden de compra.
 * @returns {Promise<object>} - Los datos de la orden de compra.
 */
export const getPurchaseOrderByIdAPI = async (id) => {
  const response = await api.get(`/purchasing/purchase-orders/${id}`);
  return response.data;
};

/**
 * Envía los datos de una nueva orden de compra para su creación.
 * @param {object} poData - Los datos de la orden de compra.
 * @returns {Promise<object>} - La respuesta de la API con la orden creada.
 */
export const createPurchaseOrderAPI = async (poData) => {
  const response = await api.post('/purchasing/purchase-orders', poData);
  return response.data;
};

/**
 * Envía la petición para aprobar una orden de compra y generar su factura.
 * @param {string} poId - El ID de la orden a aprobar.
 * @returns {Promise<object>} - La respuesta de la API con la factura generada.
 */
export const approvePurchaseOrderAPI = async (poId) => {
  const response = await api.post(`/purchasing/purchase-orders/${poId}/approve`);
  return response.data;
};

// En el futuro, podrías añadir más funciones aquí, como:
// export const updatePurchaseOrderAPI = (id, payload) => api.put(`/purchasing/purchase-orders/${id}`, payload);
// export const cancelPurchaseOrderAPI = (id) => api.post(`/purchasing/purchase-orders/${id}/cancel`);