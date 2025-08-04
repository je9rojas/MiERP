/**
 * @file Repositorio de funciones de utilidad para el manejo de errores en la aplicación.
 * Centralizar esta lógica permite un manejo de errores consistente y mantenible a lo largo
 * de todos los módulos del sistema (Inventario, CRM, Compras, etc.).
 */

/**
 * Formatea un objeto de error proveniente de una llamada de API (Axios) en un
 * mensaje legible y presentable para el usuario final en una notificación o alerta.
 *
 * @param {object} error El objeto de error capturado en un bloque catch.
 *        Se espera que tenga una estructura como la de un error de Axios
 *        (ej. `error.response.data.detail`).
 *
 * @returns {string} Un mensaje de error formateado y listo para ser mostrado.
 *                   Retorna un mensaje genérico si no puede interpretar el error.
 */
export const formatApiError = (error) => {
    // Extraemos el objeto 'detail' de la respuesta del backend, que es donde FastAPI
    // suele colocar los mensajes de error.
    const errorDetail = error.response?.data?.detail;

    const defaultErrorMessage = 'Ocurrió un error inesperado. Por favor, contacte a soporte.';

    // Caso 1: Error de validación de Pydantic.
    // FastAPI devuelve un array de objetos cuando la validación de un modelo falla.
    if (Array.isArray(errorDetail)) {
        return errorDetail
            .map(err => {
                // err.loc es un array como ['body', 'nombre_del_campo']
                const fieldName = err.loc && err.loc.length > 1 ? `'${err.loc[1]}'` : 'un campo';
                // err.msg es el mensaje de error de Pydantic
                return `Campo ${fieldName}: ${err.msg}`;
            })
            .join('; '); // Une múltiples errores en una sola cadena para mayor claridad.
    }
    
    // Caso 2: Error de negocio manejado explícitamente en el backend.
    // Estos son los errores que lanzamos con HTTPException(detail="...").
    if (typeof errorDetail === 'string') {
        return errorDetail; // ej. "El SKU ya existe en la base de datos."
    }
    
    // Caso 3: Otros errores (de red, de servidor no controlados, etc.).
    // Se utiliza el mensaje del objeto de error de JavaScript como último recurso.
    return error.message || defaultErrorMessage;
};