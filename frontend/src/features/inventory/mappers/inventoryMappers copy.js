// File: /frontend/src/features/inventory/mappers/inventoryMappers.js

/**
 * @file Módulo de Mapeo para la entidad Producto.
 * @description Centraliza la lógica de transformación de datos entre el formulario
 * del producto (vista) y los DTOs esperados por la API del backend (controlador),
 * así como la preparación de datos de la API para ser consumidos por el formulario.
 */

// ==============================================================================
// SECCIÓN 1: FUNCIONES DE UTILIDAD PRIVADAS
// ==============================================================================

const toNumberOrNull = (value) => {
    if (value === '' || value === null || value === undefined || isNaN(Number(value))) return null;
    return Number(value);
};

const mapDimensionsToAPI = (formDimensions) => {
    if (!formDimensions) return null;
    const mapped = Object.fromEntries(
        Object.entries(formDimensions)
            .map(([key, value]) => [key, key === 'g' ? (value || null) : toNumberOrNull(value)])
            .filter(([, value]) => value !== null)
    );
    return Object.keys(mapped).length > 0 ? mapped : null;
};

const mapApplicationsToAPI = (formApplications) => {
    if (!formApplications) return [];
    return formApplications
        .filter(app => app.brand || app.model)
        .map(app => {
            const { year_from, year_to, ...restOfApp } = app;
            const years = [];
            const yearFromNum = parseInt(year_from, 10);
            const yearToNum = parseInt(year_to, 10) || yearFromNum;
            if (!isNaN(yearFromNum)) {
                for (let y = yearFromNum; y <= yearToNum; y++) {
                    years.push(y);
                }
            }
            return { ...restOfApp, years };
        });
};

// ==============================================================================
// SECCIÓN 2: MAPERS PÚBLICOS EXPORTADOS
// ==============================================================================

/**
 * Mapea los datos de un producto (recibidos de la API) a la estructura que
 * el formulario de Formik espera para sus 'initialValues'.
 * @param {object} product - El objeto del producto tal como llega de la capa de API.
 * @returns {object} Un objeto formateado y listo para ser usado por Formik.
 */
export const mapProductToFormValues = (product) => {
    if (!product) return null;

    const formatValue = (value) => (value === null || value === undefined ? '' : String(value));
    
    const applications = (product.applications || []).map(app => ({
        ...app,
        year_from: formatValue(app.years?.length ? Math.min(...app.years) : ''),
        year_to: formatValue(app.years?.length ? Math.max(...app.years) : ''),
    }));

    return {
        sku: product.sku || '',
        name: product.name || '',
        brand: product.brand || '',
        category: product.category || '',
        product_type: product.product_type || 'n_a',
        shape: product.shape || '',
        description: product.description || '',
        main_image_url: product.main_image_url || '',
        price: formatValue(product.price),
        weight_g: formatValue(product.weight_g),
        points_on_sale: formatValue(product.points_on_sale),
        stock_quantity: formatValue(product.stock_quantity),
        average_cost: formatValue(product.average_cost),
        dimensions: product.dimensions || { a: '', b: '', c: '', g: '', h: '', f: '' },
        oem_codes: product.oem_codes?.length ? product.oem_codes : [{ brand: '', code: '' }],
        cross_references: product.cross_references?.length ? product.cross_references : [{ brand: '', code: '' }],
        applications: applications.length ? applications : [{ brand: '', model: '', year_from: '', year_to: '', engine: '' }],
    };
};

/**
 * Mapea los datos del formulario al DTO `ProductCreate` esperado por la API (POST).
 * @param {object} formValues Los valores crudos del formulario de Formik.
 * @returns {object} El payload listo para la API de creación.
 */
export const mapFormToCreatePayload = (formValues) => {
    return {
        sku: formValues.sku,
        name: formValues.name,
        brand: formValues.brand,
        description: formValues.description,
        category: formValues.category,
        product_type: formValues.product_type,
        shape: formValues.shape || null,
        main_image_url: formValues.main_image_url || null,
        price: toNumberOrNull(formValues.price),
        weight_g: toNumberOrNull(formValues.weight_g),
        points_on_sale: toNumberOrNull(formValues.points_on_sale),
        initial_quantity: toNumberOrNull(formValues.initial_quantity),
        initial_cost: toNumberOrNull(formValues.initial_cost),
        dimensions: mapDimensionsToAPI(formValues.dimensions),
        applications: mapApplicationsToAPI(formValues.applications),
        oem_codes: (formValues.oem_codes || []).filter(oem => oem.brand || oem.code),
        cross_references: (formValues.cross_references || []).filter(ref => ref.brand || ref.code),
    };
};

/**
 * Mapea los datos del formulario al DTO `ProductUpdate` esperado por la API (PATCH).
 * @param {object} formValues Los valores crudos del formulario de Formik.
 * @returns {object} El payload listo para la API de actualización.
 */
export const mapFormToUpdatePayload = (formValues) => {
    const payload = mapFormToCreatePayload(formValues);

    delete payload.sku;
    delete payload.initial_quantity;
    delete payload.initial_cost;
    
    return payload;
};