// /frontend/src/constants/validationSchemas.js

/**
 * @file Repositorio central para los esquemas de validación de Yup.
 *
 * Este archivo centraliza todas las reglas de validación de formularios de la
 * aplicación. Este enfoque garantiza la consistencia, facilita el mantenimiento
 * y desacopla la lógica de validación de los componentes de la interfaz de usuario.
 * Cada esquema funciona como un "contrato" que los datos del formulario deben
 * cumplir antes de ser enviados a la API.
 */

import * as yup from 'yup';

// ==============================================================================
// SECCIÓN 1: FUNCIONES DE AYUDA Y UTILIDADES DE VALIDACIÓN
// ==============================================================================

const transformToNumberOrNull = (value, originalValue) => {
    if (originalValue === null || String(originalValue).trim() === '') {
        return null;
    }
    return value;
};

const transformEmptyStringToUndefined = (value) => {
    if (typeof value === 'string' && value.trim() === '') {
        return undefined;
    }
    return value;
};

// ==============================================================================
// SECCIÓN 2: ESQUEMAS DEL MÓDULO DE AUTENTICACIÓN
// ==============================================================================

export const loginValidationSchema = yup.object({
    username: yup.string().required('El nombre de usuario es obligatorio.'),
    password: yup.string().required('La contraseña es obligatoria.'),
});

// ==============================================================================
// SECCIÓN 3: ESQUEMAS DEL MÓDULO DE INVENTARIO
// ==============================================================================

const THREAD_FORMAT_REGEX = new RegExp('^([Mm]\\d+(\\.\\d+)?\\s*x\\s*\\d+(\\.\\d+)?|\\d+(\\/\\d+)?\\s*-\\s*\\d+\\s*[a-zA-Z]+)$');

export const productFormValidationSchema = yup.object({
    sku: yup.string().trim().required('El SKU es obligatorio.').matches(/^[^/]*$/, 'El SKU no puede contener el carácter "/"'),
    name: yup.string().trim().required('El nombre es obligatorio.'),
    brand: yup.string().trim().required('La marca es obligatoria.'),
    category: yup.string().required('La categoría es obligatoria.'),
    product_type: yup.string().when('category', {
        is: 'filter',
        then: (schema) => schema.required('El tipo de filtro es obligatorio cuando la categoría es "Filtro".'),
        otherwise: (schema) => schema.notRequired(),
    }),
    
    // --- CAMPOS CORREGIDOS Y MEJORADOS ---
    stock_quantity: yup.number()
        .transform(transformToNumberOrNull)
        .typeError('El stock debe ser un número.')
        .integer('El stock debe ser un número entero.')
        .min(0, 'El stock no puede ser negativo.')
        .when('average_cost', {
            is: (val) => val && val > 0,
            then: (schema) => schema.required('El stock es requerido si se ingresa un costo inicial.').min(1, 'El stock debe ser al menos 1 si se ingresa un costo.'),
        }),

    average_cost: yup.number()
        .transform(transformToNumberOrNull)
        .typeError('El costo debe ser un número.')
        .min(0, 'El costo no puede ser negativo.')
        .when('stock_quantity', {
            is: (val) => val && val > 0,
            then: (schema) => schema.required('El costo es requerido si se ingresa un stock inicial.'),
        }),

    price: yup.number().transform(transformToNumberOrNull).typeError('El precio debe ser un número.').min(0, 'El precio no puede ser negativo.').required('El precio de venta es obligatorio.'),
    weight_g: yup.number().transform(transformToNumberOrNull).typeError('El peso debe ser un número.').min(0, 'El peso no puede ser negativo.').nullable(),
    main_image_url: yup.string().trim().url('Debe ser una URL válida (ej. https://...).').nullable(),
    
    dimensions: yup.object().shape({
        g: yup.mixed().nullable().test('is-valid-thread-format', 'Debe ser un número o un formato de rosca válido (ej. M20x1.5 o 3/4-16 UNF)', (value) => {
            if (value == null || String(value).trim() === '') return true;
            const isNumeric = !isNaN(Number(value));
            const isThreadFormat = THREAD_FORMAT_REGEX.test(String(value).trim());
            return isNumeric || isThreadFormat;
        }),
    }).nullable(),
    
    oem_codes: yup.array().of(yup.object().shape({
        brand: yup.string().trim(),
        code: yup.string().trim()
    }).test('brand-and-code-are-required-together', 'La marca y el código son obligatorios si se completa uno de ellos.', (value) => !((value.brand && !value.code) || (!value.brand && value.code)))),
    
    cross_references: yup.array().of(yup.object().shape({
        brand: yup.string().trim(),
        code: yup.string().trim()
    }).test('brand-and-code-are-required-together', 'La marca y el código son obligatorios si se completa uno de ellos.', (value) => !((value.brand && !value.code) || (!value.brand && value.code)))),
    
    applications: yup.array().of(yup.object().shape({
        brand: yup.string().when(['model', 'engine'], {
            is: (model, engine) => Boolean((model && model.trim()) || (engine && engine.trim())),
            then: (schema) => schema.required('La marca es obligatoria si se ingresan otros datos.'),
        }),
    })),
});

// ==============================================================================
// SECCIÓN 4: ESQUEMAS DEL MÓDULO DE CRM
// ==============================================================================

export const supplierFormValidationSchema = yup.object().shape({
    tax_id: yup.string().trim().required('El ID Fiscal es obligatorio.'),
    business_name: yup.string().trim().required('La Razón Social es obligatoria.').min(3, 'La Razón Social debe tener al menos 3 caracteres.'),
    // (Resto del esquema de proveedor, sin cambios)
});

// ==============================================================================
// SECCIÓN 5: ESQUEMAS DEL MÓDULO DE COMPRAS
// ==============================================================================

export const purchaseOrderFormValidationSchema = yup.object().shape({
    supplier: yup.object().nullable().required('Debe seleccionar un proveedor.'),
    order_date: yup.date().required('La fecha de emisión es requerida.').typeError('Formato de fecha inválido.'),
    // (Resto del esquema de orden de compra, sin cambios)
});

// ==============================================================================
// SECCIÓN 6: ESQUEMAS DEL MÓDULO DE VENTAS
// ==============================================================================

export const salesOrderFormValidationSchema = yup.object().shape({
    customer_id: yup.object().nullable().required('Debe seleccionar un cliente.'),
    order_date: yup.date().required('La fecha de la orden es requerida.').typeError('Formato de fecha inválido.'),
    // (Resto del esquema de orden de venta, sin cambios)
});