// /frontend/src/constants/validationSchemas.js
// Repositorio central para los esquemas de validación de Yup.

import * as yup from 'yup';

export const loginSchema = yup.object({
  username: yup
    .string()
    .required('El nombre de usuario es obligatorio.'),
  password: yup
    .string()
    .required('La contraseña es obligatoria.'),
});

// En el futuro, aquí añadirás el esquema para productos, proveedores, etc.
export const productSchema = yup.object({
  sku: yup.string().required('El SKU es obligatorio.'),
  name: yup.string().required('El nombre es obligatorio.'),
  brand: yup.string().required('La marca es obligatoria.'),
  category: yup.string().required('El producto es obligatorio.'),
  cost: yup.number().min(0, 'El costo no puede ser negativo.').required('El costo es obligatorio.'),
  price: yup.number().min(0, 'El precio no puede ser negativo.').required('El precio es obligatorio.'),
  // ... más validaciones
});