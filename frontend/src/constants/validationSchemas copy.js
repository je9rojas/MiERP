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
    // (Resto del esquema de producto, sin cambios)
});

// ==============================================================================
// SECCIÓN 4: ESQUEMAS DEL MÓDULO DE CRM
// ==============================================================================

export const supplierFormValidationSchema = yup.object().shape({
    tax_id: yup.string().trim().required('El ID Fiscal es obligatorio.'),
    business_name: yup.string().trim().required('La Razón Social es obligatoria.').min(3, 'La Razón Social debe tener al menos 3 caracteres.'),
    trade_name: yup.string().trim().nullable(),
    address: yup.string().trim().nullable(),
    phone: yup.string().trim().nullable(),
    emails: yup.array().of(yup.object().shape({
        address: yup.string().transform(transformEmptyStringToUndefined).email('Debe ser un correo electrónico válido.'),
        purpose: yup.string(),
    })).nullable(),
    contact_person: yup.object().shape({
        name: yup.string().trim().nullable(),
        email: yup.string().transform(transformEmptyStringToUndefined).email('Debe ser un correo electrónico de contacto válido.').nullable(),
        phone: yup.string().trim().nullable(),
        position: yup.string().trim().nullable(),
    }).nullable(),
});

// ==============================================================================
// SECCIÓN 5: ESQUEMAS DEL MÓDULO DE COMPRAS
// ==============================================================================

export const purchaseOrderFormValidationSchema = yup.object().shape({
    supplier: yup.object().nullable().required('Debe seleccionar un proveedor.'),
    order_date: yup.date().required('La fecha de emisión es requerida.').typeError('Formato de fecha inválido.'),
    items: yup.array().of(yup.object().shape({
        product: yup.object().nullable().required('Debe seleccionar un producto.'),
        quantity_ordered: yup.number().min(1, 'La cantidad debe ser mayor a 0.').typeError('La cantidad debe ser un número.').required('La cantidad es requerida.'),
        unit_cost: yup.number().min(0, 'El costo no puede ser negativo.').typeError('El costo debe ser un número.').required('El costo es requerido.'),
    })).min(1, 'Debe añadir al menos un producto a la orden.'),
});

// ==============================================================================
// SECCIÓN 6: ESQUEMAS DEL MÓDULO DE VENTAS
// ==============================================================================

export const salesOrderFormValidationSchema = yup.object().shape({
    customer_id: yup.object().nullable().required('Debe seleccionar un cliente.'),
    order_date: yup.date().required('La fecha de la orden es requerida.').typeError('Formato de fecha inválido.'),
    items: yup.array()
        .of(yup.object().shape({
            product: yup.object().nullable().required('Debe seleccionar un producto.'),
            quantity: yup.number()
                .min(1, 'La cantidad debe ser al menos 1.')
                .typeError('La cantidad debe ser un número.')
                .required('La cantidad es requerida.'),
            // Nota: El 'unit_price' no se valida aquí porque se obtiene del backend, no del input del usuario.
        }))
        .min(1, 'La orden debe contener al menos un producto.'),
});