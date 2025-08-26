// File: /frontend/src/features/purchasing/api/purchasingAPI.js

/**
 * @file Contiene todas las funciones para interactuar con los endpoints del Módulo de Compras.
 *
 * Este módulo actúa como una capa de abstracción sobre las llamadas de red (Axios) para
 * las entidades del flujo "Procure-to-Pay": Órdenes de Compra, Recepciones de Mercancía
 * y Facturas de Compra.
 *
 * Se aplica una capa de mapeo (Capa Anticorrupción) a las respuestas para estandarizar
 * el modelo de datos antes de que sean utilizados por la aplicación.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import api from '../../../app/axiosConfig';
import { mapPaginatedApiResponse, mapApiToFrontend } from '../../../utils/dataMappers';

// ==============================================================================
// SECCIÓN 2: FUNCIONES DE API PARA ÓRDENES DE COMPRA (PURCHASE ORDERS)
// ==============================================================================

/**
 * Obtiene una lista paginada y filtrada de órdenes de compra.
 * @param {object} params - Parámetros de consulta.
 * @returns {Promise<object>} Respuesta paginada y transformada.
 */
export const getPurchaseOrdersAPI = async (params) => {
  const response = await api.get('/purchasing/orders', { params });
  return mapPaginatedApiResponse(response.data);
};

/**
 * Obtiene los datos detallados de una única orden de compra por su ID.
 * @param {string} orderId - El ID de la orden de compra.
 * @returns {Promise<object>} Los datos de la orden de compra transformados.
 */
export const getPurchaseOrderByIdAPI = async (orderId) => {
  const response = await api.get(`/purchasing/orders/${orderId}`);
  return mapApiToFrontend(response.data);
};

/**
 * Envía los datos de una nueva orden de compra al backend para su creación.
 * @param {object} purchaseOrderData - El payload del formulario.
 * @returns {Promise<object>} La orden de compra creada y transformada.
 */
export const createPurchaseOrderAPI = async (purchaseOrderData) => {
  const response = await api.post('/purchasing/orders', purchaseOrderData);
  return mapApiToFrontend(response.data);
};

/**
 * Envía los datos actualizados de una orden de compra para su modificación.
 * @param {string} orderId - El ID de la orden a actualizar.
 * @param {object} updateData - El payload con los campos a actualizar.
 * @returns {Promise<object>} La orden de compra actualizada y transformada.
 */
export const updatePurchaseOrderAPI = async (orderId, updateData) => {
  const response = await api.patch(`/purchasing/orders/${orderId}`, updateData);
  return mapApiToFrontend(response.data);
};

/**
 * Envía una petición para cambiar el estado de una orden de compra.
 * @param {string} orderId - El ID de la orden.
 * @param {string} newStatus - El nuevo estado objetivo.
 * @returns {Promise<object>} La orden de compra actualizada y transformada.
 */
export const updatePurchaseOrderStatusAPI = async (orderId, newStatus) => {
  const response = await api.patch(`/purchasing/orders/${orderId}/status`, { new_status: newStatus });
  return mapApiToFrontend(response.data);
};

// ==============================================================================
// SECCIÓN 3: FUNCIONES DE API PARA RECEPCIONES DE MERCANCÍA (GOODS RECEIPTS)
// ==============================================================================

/**
 * Envía los datos de una nueva recepción de mercancía al backend.
 * @param {string} orderId - El ID de la Orden de Compra de origen.
 * @param {object} receiptData - El payload con los datos de la recepción.
 * @returns {Promise<object>} La recepción de mercancía creada y transformada.
 */
export const createGoodsReceiptAPI = async (orderId, receiptData) => {
  const response = await api.post(`/purchasing/orders/${orderId}/receipts`, receiptData);
  return mapApiToFrontend(response.data);
};

/**
 * Obtiene una lista paginada y filtrada de recepciones de mercancía.
 * @param {object} params - Parámetros de consulta.
 * @returns {Promise<object>} Respuesta paginada y transformada.
 */
export const getGoodsReceiptsAPI = async (params) => {
  const response = await api.get('/purchasing/receipts', { params });
  return mapPaginatedApiResponse(response.data);
};

/**
 * Obtiene los datos detallados de una única recepción de mercancía por su ID.
 * @param {string} receiptId - El ID de la recepción a obtener.
 * @returns {Promise<object>} Los datos de la recepción transformados.
 */
export const getGoodsReceiptByIdAPI = async (receiptId) => {
  const response = await api.get(`/purchasing/receipts/${receiptId}`);
  return mapApiToFrontend(response.data);
};


// ==============================================================================
// SECCIÓN 4: FUNCIONES DE API PARA FACTURAS DE COMPRA (PURCHASE BILLS)
// ==============================================================================

/**
 * Envía los datos de una nueva factura de compra al backend para su creación.
 * @param {object} billData - El payload con los datos de la factura.
 * @returns {Promise<object>} La factura de compra creada y transformada.
 */
export const createPurchaseBillAPI = async (billData) => {
  const response = await api.post('/purchasing/bills', billData);
  return mapApiToFrontend(response.data);
};

/**
 * Obtiene una lista paginada y filtrada de facturas de compra.
 * @param {object} params - Parámetros de consulta.
 * @returns {Promise<object>} Respuesta paginada y transformada.
 */
export const getPurchaseBillsAPI = async (params) => {
  const response = await api.get('/purchasing/bills', { params });
  return mapPaginatedApiResponse(response.data);
};

/**
 * Obtiene los datos detallados de una única factura de compra por su ID.
 * @param {string} billId - El ID de la factura a obtener.
 * @returns {Promise<object>} Los datos de la factura transformados.
 */
export const getPurchaseBillByIdAPI = async (billId) => {
  const response = await api.get(`/purchasing/bills/${billId}`);
  return mapApiToFrontend(response.data);
};