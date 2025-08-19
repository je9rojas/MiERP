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
    
    stock_quantity: yup.number()
        .transform(transformToNumberOrNull)
        .typeError('El stock debe ser un número.')
        .integer('El stock debe ser un número entero.')
        .min(0, 'El stock no puede ser negativo.')
        .nullable(),

    average_cost: yup.number()
        .transform(transformToNumberOrNull)
        .typeError('El costo debe ser un número.')
        .min(0, 'El costo no puede ser negativo.')
        .nullable(),

    price: yup.number().transform(transformToNumberOrNull).typeError('El precio debe ser un número.').min(0, 'El precio no puede ser negativo.').required('El precio de venta es obligatorio.'),
    weight_g: yup.number().transform(transformToNumberOrNull).typeError('El peso debe ser un número.').min(0, 'El peso no puede ser negativo.').nullable(),
    main_image_url: yup.string().trim().url('Debe ser una URL válida (ej. https://...).').nullable(),
    
    dimensions: yup.object().shape({
        a: yup.number().transform(transformToNumberOrNull).typeError('Debe ser un número.').nullable().min(0, 'No puede ser negativo.'),
        b: yup.number().transform(transformToNumberOrNull).typeError('Debe ser un número.').nullable().min(0, 'No puede ser negativo.'),
        c: yup.number().transform(transformToNumberOrNull).typeError('Debe ser un número.').nullable().min(0, 'No puede ser negativo.'),
        h: yup.number().transform(transformToNumberOrNull).typeError('Debe ser un número.').nullable().min(0, 'No puede ser negativo.'),
        f: yup.number().transform(transformToNumberOrNull).typeError('Debe ser un número.').nullable().min(0, 'No puede ser negativo.'),
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
    }).test('brand-and-code-are-required-together', 'La marca y el código son obligatorios si se completa uno de ellos.', (value) => {
        const { brand, code } = value || {};
        return !((brand && !code) || (!brand && code));
    })),
    
    cross_references: yup.array().of(yup.object().shape({
        brand: yup.string().trim(),
        code: yup.string().trim()
    }).test('brand-and-code-are-required-together', 'La marca y el código son obligatorios si se completa uno de ellos.', (value) => {
        const { brand, code } = value || {};
        return !((brand && !code) || (!brand && code));
    })),
    
    applications: yup.array().of(yup.object().shape({
        brand: yup.string().when(['model', 'engine'], {
            is: (model, engine) => Boolean((model && model.trim()) || (engine && engine.trim())),
            then: (schema) => schema.required('La marca es obligatoria si se ingresan otros datos.'),
        }),
        model: yup.string().nullable(),
        engine: yup.string().nullable(),
    })),
}).test(
    'stock-and-cost-required-together',
    'Si se ingresa un stock inicial, el costo es requerido (y viceversa).',
    (value) => {
        const { stock_quantity, average_cost } = value || {};
        const stockExists = stock_quantity !== null && stock_quantity > 0;
        const costExists = average_cost !== null && average_cost >= 0;
        return !((stockExists && !costExists) || (!stockExists && costExists));
    }
);

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

export const purchaseBillFormValidationSchema = yup.object().shape({
    supplier_invoice_number: yup.string().trim().required('El número de factura del proveedor es obligatorio.'),
    received_date: yup.date().required('La fecha de recepción es requerida.').typeError('Formato de fecha inválido.'),
    items: yup.array().of(yup.object().shape({
        quantity_received: yup.number()
            .min(0, 'La cantidad no puede ser negativa.')
            .typeError('La cantidad debe ser un número.')
            .required('La cantidad recibida es requerida.')
            .test(
                'is-less-than-or-equal-to-ordered',
                'No puede recibir más de lo que se ordenó.',
                function(value) {
                    // 'this.parent' se refiere al objeto item actual (ej. { quantity_ordered: 10, quantity_received: 12 })
                    return value <= this.parent.quantity_ordered;
                }
            ),
        unit_cost: yup.number()
            .min(0, 'El costo no puede ser negativo.')
            .typeError('El costo debe ser un número.')
            .required('El costo real es requerido.'),
    })).min(1, 'La recepción debe contener al menos un ítem.'),
});

// ==============================================================================
// SECCIÓN 6: ESQUEMAS DEL MÓDULO DE VENTAS
// ==============================================================================

export const salesOrderFormValidationSchema = yup.object().shape({
    customer: yup.object()
        .nullable()
        .required('Debe seleccionar un cliente.'),
    
    order_date: yup.date()
        .required('La fecha de la orden es requerida.')
        .typeError('Formato de fecha inválido.'),
    
    notes: yup.string().nullable(),

    items: yup.array().of(
        yup.object().shape({
            product: yup.object()
                .nullable()
                .required('Debe seleccionar un producto.'),
            quantity: yup.number()
                .min(1, 'La cantidad debe ser al menos 1.')
                .typeError('La cantidad debe ser un número.')
                .required('La cantidad es requerida.'),
            // --- CORRECCIÓN CRÍTICA Y FINAL ---
            // Se añade la validación para el campo `unit_price` que ahora
            // existe en el formulario. Esto alinea el esquema con la UI.
            unit_price: yup.number()
                .min(0, 'El precio no puede ser negativo.')
                .typeError('El precio debe ser un número.')
                .required('El precio es requerido.'),
        })
    ).min(1, 'La orden debe contener al menos un producto.'),
});


