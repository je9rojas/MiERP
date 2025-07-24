// /frontend/src/features/crm/api/suppliersAPI.js

/**
 * @file Contiene todas las funciones para interactuar con los endpoints de proveedores del backend.
 * Abstrae las llamadas de red (Axios) para que los componentes de la interfaz de usuario
 * no necesiten conocer los detalles de la implementación de la API.
 */

import api from '../../../app/axiosConfig';

/**
 * Obtiene una lista paginada y filtrada de proveedores desde el backend.
 * @param {object} params - Objeto con los parámetros de consulta (ej. { page: 1, pageSize: 10, search: 'texto' }).
 * @returns {Promise<object>} - Una promesa que resuelve a la respuesta de la API (ej. { items: [], total: 0 }).
 */
export const getSuppliersAPI = async (params) => {
  const response = await api.get('/suppliers', { params });
  return response.data;
};

/**
 * Obtiene los datos de un único proveedor por su ID.
 * @param {string} supplierId - El ID del proveedor a obtener.
 * @returns {Promise<object>} - Los datos del proveedor.
 */
export const getSupplierByIdAPI = async (supplierId) => {
  const response = await api.get(`/suppliers/${supplierId}`);
  return response.data;
};

/**
 * Envía los datos de un nuevo proveedor al backend para su creación.
 * @param {object} supplierData - Los datos del proveedor del formulario.
 * @returns {Promise<object>} - La respuesta de la API con el proveedor creado.
 */
export const createSupplierAPI = async (supplierData) => {
  const response = await api.post('/suppliers', supplierData);
  return response.data;
};

/**
 * Envía los datos actualizados de un proveedor al backend.
 * @param {string} supplierId - El ID del proveedor a actualizar.
 * @param {object} supplierData - Los datos actualizados del proveedor.
 * @returns {Promise<object>} - El proveedor con los datos actualizados.
 */
export const updateSupplierAPI = async (supplierId, supplierData) => {
  const response = await api.put(`/suppliers/${supplierId}`, supplierData);
  return response.data;
};

/**
 * Envía una petición para desactivar (soft delete) un proveedor por su ID.
 * @param {string} supplierId - El ID del proveedor a desactivar.
 * @returns {Promise<void>}
 */
export const deactivateSupplierAPI = async (supplierId) => {
  await api.delete(`/suppliers/${supplierId}`);
};