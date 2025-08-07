// /frontend/src/features/sales/pages/NewSalesOrderPage.js

/**
 * @file Página contenedora para el formulario de creación de una nueva Orden de Venta.
 *
 * Este componente actúa como el "cerebro" de la página, orquestando la
 * lógica de alto nivel para la creación de una venta. Sus responsabilidades son:
 * - Renderizar el componente de formulario reutilizable `SalesOrderForm`.
 * - Gestionar el estado de envío a través de React Query `useMutation`.
 * - Transformar los datos del formulario al formato requerido por la API.
 * - Manejar la comunicación con la API para crear la nueva orden.
 * - Proporcionar retroalimentación al usuario (notificaciones de éxito/error).
 * - Gestionar la navegación post-creación.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Container, Paper, Box, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import SalesOrderForm from '../components/SalesOrderForm';
import { createSalesOrderAPI } from '../api/salesAPI';
import { formatApiError } from '../../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const NewSalesOrderPage = () => {
    // --- 2.1: Hooks y Gestión de Estado ---
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // --- 2.2: Lógica de Mutación para Crear la Orden de Venta ---
    const { mutate: createSalesOrder, isPending: isSubmitting } = useMutation({
        mutationFn: createSalesOrderAPI,
        onSuccess: () => {
            enqueueSnackbar('Orden de Venta creada exitosamente!', { variant: 'success' });
            
            // Invalida las consultas relevantes para que los datos se refresquen
            // en las páginas correspondientes.
            queryClient.invalidateQueries({ queryKey: ['salesOrdersList'] });
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Para actualizar el stock visible
            
            navigate('/ventas/ordenes'); // Redirige a la futura página de lista
        },
        onError: (error) => {
            console.error("Error al crear la orden de venta:", error);
            const userFriendlyErrorMessage = formatApiError(error);
            enqueueSnackbar(userFriendlyErrorMessage, {
                variant: 'error',
                persist: true,
            });
        }
    });

    // --- 2.3: Manejador de Envío del Formulario ---
    const handleFormSubmit = useCallback((formValues) => {
        // Se transforman los datos del formulario al payload que la API espera.
        const payload = {
            customer_id: formValues.customer_id?._id,
            order_date: formValues.order_date,
            notes: formValues.notes,
            shipping_address: formValues.shipping_address,
            items: formValues.items
                .filter(item => item.product?._id) // Asegurarse de que solo se envíen ítems con producto
                .map(item => ({
                    product_id: item.product._id,
                    quantity: Number(item.quantity)
                })),
        };
        
        // Doble verificación para evitar llamadas a la API con datos incompletos
        if (!payload.customer_id || payload.items.length === 0) {
            enqueueSnackbar('Por favor, seleccione un cliente y añada al menos un producto.', { variant: 'warning' });
            return;
        }

        createSalesOrder(payload);
    }, [createSalesOrder, enqueueSnackbar]);

    // --- 2.4: Renderizado de la UI ---
    return (
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Crear Nueva Orden de Venta
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Seleccione un cliente y añada los productos para registrar una nueva venta.
                    </Typography>
                </Box>
                
                <SalesOrderForm
                    onSubmit={handleFormSubmit}
                    isSubmitting={isSubmitting}
                />
            </Paper>
        </Container>
    );
};

export default NewSalesOrderPage;