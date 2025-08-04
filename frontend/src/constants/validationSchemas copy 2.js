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
// SECCIÓN 1: ESQUEMAS DEL MÓDULO DE AUTENTICACIÓN
// ==============================================================================

/**
 * Esquema para la validación del formulario de inicio de sesión.
 */
export const loginValidationSchema = yup.object({
  username: yup.string().required('El nombre de usuario es obligatorio.'),
  password: yup.string().required('La contraseña es obligatoria.'),
});


// ==============================================================================
// SECCIÓN 2: ESQUEMAS DEL MÓDULO DE INVENTARIO
// ==============================================================================

// --- 2.1: Lógica y Patrones de Ayuda para Productos ---

/**
 * Expresión regular para validar formatos de rosca comunes.
 * Permite formatos como "M20x1.5" o "UNC 1/2-13".
 */
const THREAD_FORMAT_REGEX = /^[a-z0-9\s/.-]+x[0-9.]+/i;

/**
 * Transforma un valor de entrada en un número o `null`.
 * Esencial para manejar campos de número que pueden estar vacíos en un formulario.
 * @param {any} value El valor actual del campo.
 * @param {any} originalValue El valor original del campo.
 * @returns {number|null}
 */
const transformToNumberOrNull = (value, originalValue) => {
  if (originalValue === null || originalValue === '') {
    return null;
  }
  return value;
};


// --- 2.2: Esquema Principal para el Formulario de Productos ---

/**
 * Esquema de validación completo para el formulario de creación y edición de productos.
 * Contiene reglas para todos los campos principales, así como para los sub-esquemas
 * anidados como dimensiones, referencias y aplicaciones.
 */
export const productFormValidationSchema = yup.object({

  // --- Campos Principales ---
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
      then: (schema) => schema.required('El tipo de filtro es obligatorio cuando la categoría es "Filtro".'),
      otherwise: (schema) => schema.notRequired(),
    }),

  cost: yup
    .number()
    .transform(transformToNumberOrNull)
    .typeError('El costo debe ser un número válido.')
    .min(0, 'El costo no puede ser un valor negativo.')
    .required('El costo es obligatorio.'),

  price: yup
    .number()
    .transform(transformToNumberOrNull)
    .typeError('El precio debe ser un número válido.')
    .min(0, 'El precio no puede ser un valor negativo.')
    .required('El precio es obligatorio.'),

  weight_g: yup
    .number()
    .transform(transformToNumberOrNull)
    .typeError('El peso debe ser un número válido.')
    .min(0, 'El peso no puede ser un valor negativo.')
    .nullable(),

  main_image_url: yup
    .string()
    .trim()
    .url('Debe ser una URL válida (ej. https://...).')
    .nullable(),

  // --- Sub-Esquema para Dimensiones ---
  dimensions: yup.object().shape({
    a: yup.number().transform(transformToNumberOrNull).typeError('Debe ser un número.').nullable().min(0, 'No puede ser negativo.'),
    b: yup.number().transform(transformToNumberOrNull).typeError('Debe ser un número.').nullable().min(0, 'No puede ser negativo.'),
    c: yup.number().transform(transformToNumberOrNull).typeError('Debe ser un número.').nullable().min(0, 'No puede ser negativo.'),
    h: yup.number().transform(transformToNumberOrNull).typeError('Debe ser un número.').nullable().min(0, 'No puede ser negativo.'),
    f: yup.number().transform(transformToNumberOrNull).typeError('Debe ser un número.').nullable().min(0, 'No puede ser negativo.'),
    g: yup
      .mixed() // Permite múltiples tipos (string o number).
      .nullable()
      .test(
        'is-valid-thread-format',
        'Debe ser un número o un formato de rosca válido (ej. M20x1.5)',
        (value) => {
          if (value == null || String(value).trim() === '') return true; // Permite campos vacíos.
          const isNumeric = !isNaN(Number(value));
          const isThreadFormat = THREAD_FORMAT_REGEX.test(value);
          return isNumeric || isThreadFormat;
        }
      ),
  }).nullable(),

  // --- Sub-Esquema para Códigos OEM ---
  oem_codes: yup.array().of(
    yup.object().shape({
      brand: yup.string().when('code', {
        is: (code) => Boolean(code && code.trim()),
        then: (schema) => schema.required('La marca es obligatoria si se ingresa un código.'),
      }),
      code: yup.string().when('brand', {
        is: (brand) => Boolean(brand && brand.trim()),
        then: (schema) => schema.required('El código es obligatorio si se ingresa una marca.'),
      }),
    })
  ),

  // --- Sub-Esquema para Referencias Cruzadas ---
  cross_references: yup.array().of(
    yup.object().shape({
      brand: yup.string().when('code', {
        is: (code) => Boolean(code && code.trim()),
        then: (schema) => schema.required('La marca es obligatoria si se ingresa un código.'),
      }),
      code: yup.string().when('brand', {
        is: (brand) => Boolean(brand && brand.trim()),
        then: (schema) => schema.required('El código es obligatorio si se ingresa una marca.'),
      }),
    })
  ),

  // --- Sub-Esquema para Aplicaciones de Vehículos ---
  applications: yup.array().of(
    yup.object().shape({
      brand: yup.string().when(['model', 'engine', 'years'], {
        is: (model, engine, years) => Boolean((model && model.trim()) || (engine && engine.trim()) || (years && years.length > 0)),
        then: (schema) => schema.required('La marca es obligatoria si se ingresan otros datos de aplicación.'),
      }),
      model: yup.string(),
      engine: yup.string(),
      // 'years' será manejado directamente en el componente del formulario,
      // ya que la validación de un rango es más compleja que el esquema simple.
      // Si se requiriera, se añadiría una validación personalizada aquí.
    })
  ),
});


// ==============================================================================
// SECCIÓN 3: ESQUEMAS DEL MÓDULO DE CRM (Ejemplos)
// ==============================================================================

// NOTA: Aquí se añadirían futuros esquemas para Clientes, Proveedores, etc.
// export const customerValidationSchema = yup.object({ ... });
// export const supplierValidationSchema = yup.object({ ... });