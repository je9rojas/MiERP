// /frontend/src/constants/validationSchemas.js

/**
 * @file Repositorio central para todos los esquemas de validación de Yup de la aplicación.
 * Centralizar los esquemas aquí permite su reutilización, facilita el mantenimiento y
 * asegura que las reglas de validación del frontend sean consistentes en todo el sistema.
 */

import * as yup from 'yup';

// --- SECCIÓN 1: ESQUEMAS DE AUTENTICACIÓN ---

export const loginSchema = yup.object({
  username: yup.string().required('El nombre de usuario es obligatorio.'),
  password: yup.string().required('La contraseña es obligatoria.'),
});


// --- SECCIÓN 2: ESQUEMAS DEL MÓDULO DE INVENTARIO ---

export const productSchema = yup.object({
  // --- 2.1: Campos Principales del Producto ---
  sku: yup
    .string()
    .trim()
    .required('El SKU es obligatorio.')
    .matches(/^[^/]*$/, 'El SKU no puede contener el carácter "/"'),
  
  name: yup
    .string()
    .trim()
    .required('El nombre es obligatorio.'),
  
  brand: yup
    .string()
    .trim()
    .required('La marca es obligatoria.'),
  
  category: yup
    .string()
    .required('La categoría del producto es obligatoria.'),
  
  product_type: yup
    .string()
    .when('category', {
      is: 'filter',
      then: (schema) => schema.required('El tipo de filtro es obligatorio.'),
      otherwise: (schema) => schema.notRequired(),
    }),
    
  cost: yup
    .number()
    .typeError('El costo debe ser un número.')
    .min(0, 'El costo no puede ser negativo.')
    .required('El costo es obligatorio.'),
  
  price: yup
    .number()
    .typeError('El precio debe ser un número.')
    .min(0, 'El precio no puede ser negativo.')
    .required('El precio es obligatorio.'),

  weight_g: yup
    .number()
    .typeError('El peso debe ser un número.')
    .min(0, 'El peso no puede ser negativo.')
    .nullable(),  

  main_image_url: yup
    .string()
    .url('Debe ser una URL válida (ej. https://...)')
    .nullable(),

  // --- 2.2: Sub-esquema para Aplicaciones de Vehículos (CORREGIDO) ---
  applications: yup.array().of(
    yup.object().shape({
      /**
       * Lógica de validación condicional para la marca.
       * La marca se vuelve obligatoria si el usuario ha introducido
       * CUALQUIER otro dato en la misma fila de aplicación (modelo o años).
       * Esto evita errores en filas completamente vacías pero asegura que
       * una aplicación parcialmente rellenada tenga al menos una marca.
       */
      brand: yup.string().when(['model', 'year_from', 'year_to'], {
          is: (model, year_from, year_to) => Boolean(model || year_from || year_to),
          then: (schema) => schema.required('La marca es obligatoria si se ingresan otros datos de aplicación.'),
          otherwise: (schema) => schema.notRequired()
      }),
      
      // El modelo es siempre opcional.
      model: yup.string(),
      
      // El año "desde" es siempre opcional.
      year_from: yup.number()
        .transform(value => (isNaN(value) ? undefined : value))
        .nullable()
        .integer('Debe ser un año válido')
        .min(1900, 'El año debe ser mayor a 1900'),
      
      // El año "hasta" es opcional, pero si existe, debe ser mayor o igual al año "desde".
      year_to: yup.number()
        .transform(value => (isNaN(value) ? undefined : value))
        .nullable()
        .integer('Debe ser un año válido')
        .when('year_from', (year_from, schema) => {
          if (year_from && !isNaN(year_from)) {
            return schema.min(year_from, 'El año "hasta" debe ser mayor o igual al año "desde"');
          }
          return schema;
        }),
    })
  ),
});

// --- SECCIÓN 3: ESQUEMAS DE OTROS MÓDULOS (Ejemplos) ---
// Aquí podrías añadir los esquemas para Clientes, Proveedores, Órdenes de Compra, etc.