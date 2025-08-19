// /frontend/src/constants/tempSalesValidation.js
// ARCHIVO TEMPORAL PARA DEPURACIÓN

import * as yup from 'yup';

/**
 * Esquema de validación aislado para el formulario de Órdenes de Venta.
 * Se utiliza para descartar dependencias circulares en el archivo principal.
 */
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
            // Se añade unit_price para que el esquema sea completo
            unit_price: yup.number()
                .min(0, 'El precio no puede ser negativo.')
                .typeError('El precio debe ser un número.')
                .required('El precio es requerido.'),
        })
    ).min(1, 'La orden debe contener al menos un producto.'),
});