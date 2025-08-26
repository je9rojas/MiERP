// /frontend/src/features/crm/api/suppliersAPI.js

/**
 * @file Contiene todas las funciones para interactuar con los endpoints de proveedores del backend.
 *
 * Este módulo encapsula las llamadas de Axios a los endpoints de proveedores,
 * proporcionando una capa de abstracción entre la red y la interfaz de usuario.
 *
 * Todas las respuestas de la API son procesadas por una capa de mapeo genérica para
 * estandarizar la estructura de datos (ej. '_id' a 'id'). Esto asegura
 * que los componentes reciban un modelo de datos consistente y predecible.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import api from '../../../app/axiosConfig';
// Se importan los mapeadores genéricos desde la nueva ubicación centralizada.
import { mapPaginatedResponse, mapItemToId } from '../../../utils/dataMappers';

// ==============================================================================
// SECCIÓN 2: FUNCIONES DE LA API
// ==============================================================================

/**
 * Obtiene una lista paginada y filtrada de proveedores desde el backend.
 * @param {object} params - Objeto con los parámetros de consulta (ej. { page: 1, pageSize: 10, search: 'texto' }).
 * @returns {Promise<object>} Una promesa que resuelve a la respuesta paginada y ya mapeada.
 */
export const getSuppliersAPI = async (params) => {
  const response = await api.get('/suppliers', { params });
  // Se aplica el mapeador a la respuesta paginada para estandarizar los IDs.
  return mapPaginatedResponse(response.data);
};

/**
 * Obtiene los datos de un único proveedor por su ID.
 * @param {string} supplierId - El ID del proveedor a obtener.
 * @returns {Promise<object>} Los datos del proveedor, ya mapeados.
 */
export const getSupplierByIdAPI = async (supplierId) => {
  const response = await api.get(`/suppliers/${supplierId}`);
  // Se aplica el mapeador a la respuesta para estandarizar el ID.
  return mapItemToId(response.data);
};

/**
 * Envía los datos de un nuevo proveedor al backend para su creación.
 * @param {object} supplierData - Los datos del proveedor del formulario.
 * @returns {Promise<object>} La respuesta de la API con el proveedor creado y ya mapeado.
 */
export const createSupplierAPI = async (supplierData) => {
  const response = await api.post('/suppliers', supplierData);
  // Se aplica el mapeador a la respuesta para estandarizar el ID.
  return mapItemToId(response.data);
};

/**
 * Envía los datos actualizados de un proveedor al backend.
 * @param {string} supplierId - El ID del proveedor a actualizar.
 * @param {object} supplierData - Los datos actualizados del proveedor.
 * @returns {Promise<object>} El proveedor con los datos actualizados y ya mapeado.
 */
export const updateSupplierAPI = async (supplierId, supplierData) => {
  const response = await api.put(`/suppliers/${supplierId}`, supplierData);
  // Se aplica el mapeador a la respuesta para estandarizar el ID.
  return mapItemToId(response.data);
};

/**
 * Envía una petición para desactivar (soft delete) un proveedor por su ID.
 * Esta función no devuelve contenido, por lo que no requiere mapeo.
 * @param {string} supplierId - El ID del proveedor a desactivar.
 * @returns {Promise<void>} Una promesa que se resuelve cuando la operación ha finalizado.
 */
export const deactivateSupplierAPI = async (supplierId) => {
  await api.delete(`/suppliers/${supplierId}`);
};