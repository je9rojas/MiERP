// /frontend/src/constants/validationSchemas.js
// REPOSITORIO CENTRAL PARA LOS ESQUEMAS DE VALIDACIÓN DE YUP

import * as yup from 'yup';

export const loginSchema = yup.object({
  username: yup.string().required('El nombre de usuario es obligatorio.'),
  password: yup.string().required('La contraseña es obligatoria.'),
});


// --- ¡NUEVO ESQUEMA PARA PRODUCTOS! ---
export const productSchema = yup.object({
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
  
  // Validación condicional: 'product_type' es requerido solo si 'category' es 'filter'
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

  weight_kg: yup.number() // <-- AÑADE ESTO
    .min(0, 'El peso no puede ser negativo')
    .nullable(),  

   main_image_url: yup.string().url('Debe ser una URL válida (ej. https://...)').nullable(),


});