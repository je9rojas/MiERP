// /frontend/src/api/supplierAPI.js
// CÓDIGO COMPLETO - LISTO PARA COPIAR Y PEGAR

import api from '../app/axiosConfig';
/**
 * Busca proveedores en el backend basándose en un término de búsqueda.
 * @param {string} query - El texto que el usuario ha escrito para buscar.
 * @returns {Promise<Array>} - Una promesa que resuelve con un array de objetos de proveedor.
 */
export const searchSuppliersAPI = async (query) => {
  try {
    // Hacemos una petición GET al endpoint /suppliers
    // Pasamos el término de búsqueda como un "query parameter"
    // La URL final será, por ejemplo: /api/suppliers?query=proveedor
    const response = await api.get('/suppliers', {
      params: {
        query: query
      }
    });
    // La API de Axios devuelve los datos dentro de la propiedad `data`
    return response.data;
  } catch (error) {
    // Si hay un error, lo mostramos en la consola y lanzamos la excepción
    // para que el componente que llama pueda manejarlo.
    console.error("Error al buscar proveedores:", error);
    throw error;
  }
};

// En el futuro, aquí podrías añadir más funciones como:
// export const getSupplierByIdAPI = (id) => api.get(`/suppliers/${id}`);
// export const createSupplierAPI = (supplierData) => api.post('/suppliers', supplierData);