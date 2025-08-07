// /frontend/src/features/crm/api/customersAPI.js
import api from '../../../app/axiosConfig';

/**
 * Obtiene una lista paginada de clientes.
 */
export const getCustomersAPI = async (params) => {
    const response = await api.get('/customers', { params });
    return response.data;
};