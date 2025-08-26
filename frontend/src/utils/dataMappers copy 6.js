// /frontend/src/utils/dataMappers.js

/**
 * @file Utilidades genéricas para la transformación de datos (Mappers).
 *
 * @description Este archivo centraliza funciones comunes para mapear datos entre
 * la API y la UI, siguiendo el principio DRY (Don't Repeat Yourself). La principal
 * responsabilidad es normalizar las respuestas de la API, como la conversión de
 * `_id` a `id`, para que sean compatibles con los componentes del frontend
 * (ej. MUI DataGrid) de manera consistente en toda la aplicación.
 */

// ==============================================================================
// SECCIÓN 1: MAPEADORES DE RESPUESTA (API -> UI)
// ==============================================================================

/**
 * Mapea un único objeto de la API a un formato compatible con la UI.
 * Copia el valor de `_id` a `id` y luego elimina el `_id` original.
 * @param {object | null} item - El objeto individual recibido de la API.
 * @returns {object | null} El objeto transformado, o null si la entrada es nula.
 */
export const mapItemToId = (item) => {
  if (!item) {
    return null;
  }
  
  // Se procesan tanto el objeto principal como los objetos anidados.
  const processItem = (currentItem) => {
    if (!currentItem || typeof currentItem !== 'object' || currentItem === null) {
      return currentItem;
    }
    
    // Procesa recursivamente si es un array
    if (Array.isArray(currentItem)) {
      return currentItem.map(processItem);
    }
    
    const transformed = { ...currentItem };
    
    // Transforma el _id principal
    if (transformed._id) {
      transformed.id = transformed._id;
      delete transformed._id;
    }
    
    // Procesa recursivamente las propiedades del objeto
    for (const key in transformed) {
      if (Object.prototype.hasOwnProperty.call(transformed, key)) {
        transformed[key] = processItem(transformed[key]);
      }
    }
    
    return transformed;
  };
  
  return processItem(item);
};


/**
 * Aplica la transformación `mapItemToId` a cada elemento de un array.
 * @param {Array<object>} items - El array de objetos recibido de la API.
 * @returns {Array<object>} El array con todos sus objetos transformados.
 */
export const mapArrayToId = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map(mapItemToId);
};

/**
 * Mapea una respuesta paginada completa de la API, aplicando la transformación
 * `mapArrayToId` a la lista de ítems.
 * @param {object} paginatedResponse - El objeto de respuesta paginada de la API.
 * @returns {object} La respuesta paginada con sus ítems transformados.
 */
export const mapPaginatedResponse = (paginatedResponse) => {
  if (!paginatedResponse || !paginatedResponse.items) {
    return { items: [], total_count: 0 };
  }
  
  return {
    ...paginatedResponse,
    items: mapArrayToId(paginatedResponse.items),
  };
};