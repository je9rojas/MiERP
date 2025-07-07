// /frontend/src/api/purchasingAPI.js

import api from './axiosConfig';

/**
 * Llama al backend para crear una nueva Orden de Compra.
 * @param {object} payload - El objeto completo de la orden de compra.
 * @returns {Promise<AxiosResponse>}
 */
export const createPurchaseOrderAPI = (payload) => {
  // El endpoint del backend será algo como '/purchase-orders'
  return api.post('/purchase-orders', payload);
};

// En el futuro, aquí añadirías más funciones como:
// export const getPurchaseOrdersAPI = () => api.get('/purchase-orders');
// export const getPurchaseOrderByIdAPI = (id) => api.get(`/purchase-orders/${id}`);