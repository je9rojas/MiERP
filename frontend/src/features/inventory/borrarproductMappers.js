// frontend/src/features/inventory/productMappers.js

/**
 * @file Módulo de Mapeo para la entidad Producto.
 * @description Centraliza la lógica de transformación de datos entre el formulario
 * del producto (vista) y los DTOs esperados por la API del backend (controlador).
 * Este es el único lugar donde se debe definir cómo se "traducen" los datos.
 */

// ==============================================================================
// SECCIÓN 1: FUNCIONES DE UTILIDAD PRIVADAS
// ==============================================================================

/**
 * Convierte un valor de formulario (generalmente string) a un número o null.
 * @param {string|number|null|undefined} value El valor del formulario.
 * @returns {number|null} El valor convertido a número, o null si está vacío.
 */
const _toNumberOrNull = (value) => {
    if (value === '' || value === null || value === undefined) {
        return null;
    }
    return Number(value);
};

/**
 * Procesa el sub-objeto de dimensiones, convirtiendo valores y eliminando los vacíos.
 * @param {object} formDimensions El objeto de dimensiones del formulario.
 * @returns {object|null} Un objeto de dimensiones limpio, o null si está completamente vacío.
 */
const _mapDimensions = (formDimensions) => {
    if (!formDimensions) {
        return null;
    }

    const mappedDimensions = Object.entries(formDimensions)
        .map(([key, value]) => {
            // El campo 'g' (rosca) es un string, los demás son numéricos.
            const mappedValue = key === 'g' ? (value || null) : _toNumberOrNull(value);
            return [key, mappedValue];
        })
        .filter(([, value]) => value !== null); // Eliminar campos que quedaron nulos.

    if (mappedDimensions.length === 0) {
        return null; // Si no hay ninguna dimensión, enviar null.
    }

    return Object.fromEntries(mappedDimensions);
};

/**
 * Procesa el sub-array de aplicaciones, convirtiendo años y limpiando entradas vacías.
 * @param {Array<object>} formApplications El array de aplicaciones del formulario.
 * @returns {Array<object>} Un array de aplicaciones limpio y formateado para la API.
 */
const _mapApplications = (formApplications) => {
    if (!formApplications || formApplications.length === 0) {
        return [];
    }
    return formApplications
        .filter(app => app.brand || app.model) // Ignorar filas que el usuario dejó vacías.
        .map(app => {
            const yearFrom = parseInt(app.year_from, 10);
            const yearTo = parseInt(app.year_to, 10) || yearFrom;
            const years = [];

            if (!isNaN(yearFrom)) {
                for (let y = yearFrom; y <= yearTo; y++) {
                    years.push(y);
                }
            }
            return {
                brand: app.brand,
                model: app.model,
                engine: app.engine,
                years: years,
            };
        });
};


// ==============================================================================
// SECCIÓN 2: MAPERS PÚBLICOS EXPORTADOS
// ==============================================================================

/**
 * Mapea los datos del formulario al DTO `ProductCreate` esperado por la API (POST).
 * @param {object} formValues Los valores crudos del formulario de Formik.
 * @returns {object} El payload listo para la API de creación.
 */
export const mapFormToCreateAPI = (formValues) => {
    return {
        sku: formValues.sku,
        name: formValues.name,
        brand: formValues.brand,
        description: formValues.description,
        category: formValues.category,
        product_type: formValues.product_type,
        shape: formValues.shape || null,
        main_image_url: formValues.main_image_url || null,
        price: _toNumberOrNull(formValues.price),
        weight_g: _toNumberOrNull(formValues.weight_g),
        points_on_sale: _toNumberOrNull(formValues.points_on_sale),
        // Los datos del lote inicial se envían para que el orquestador los use.
        stock_quantity: _toNumberOrNull(formValues.stock_quantity),
        average_cost: _toNumberOrNull(formValues.average_cost),
        // Mapeo de campos anidados
        dimensions: _mapDimensions(formValues.dimensions),
        applications: _mapApplications(formValues.applications),
        oem_codes: formValues.oem_codes.filter(oem => oem.brand || oem.code),
        cross_references: formValues.cross_references.filter(ref => ref.brand || ref.code),
    };
};

/**
 * Mapea los datos del formulario al DTO `ProductUpdate` esperado por la API (PATCH).
 * @param {object} formValues Los valores crudos del formulario de Formik.
 * @returns {object} El payload listo para la API de actualización.
 */
export const mapFormToUpdateAPI = (formValues) => {
    // Para PATCH, la lógica es casi idéntica, pero no incluimos campos que no deben actualizarse.
    const payload = mapFormToCreateAPI(formValues);

    // Los siguientes campos no se envían en una actualización de catálogo.
    delete payload.sku; // El SKU es el identificador, no se puede cambiar.
    delete payload.stock_quantity;
    delete payload.average_cost;

    return payload;
};