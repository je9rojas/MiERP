// /frontend/src/features/sales/pages/NewSalesOrderPage.js

/**
 * @file Página contenedora para el formulario de creación de una nueva Orden de Venta.
 *
 * Este componente actúa como el "cerebro" de la página, orquestando la
 * lógica de alto nivel para la creación de una venta. Sus responsabilidades son:
 * - Obtener los datos necesarios para el formulario (listas de clientes y productos).
 * - Renderizar el componente de formulario reutilizable `SalesOrderForm`.
 * - Gestionar el estado de envío a través de React Query `useMutation`.
 * - Transformar los datos del formulario al formato requerido por la API.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Container, Paper, Box, Typography, Alert, CircularProgress } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import SalesOrderForm from '../components/SalesOrderForm';
import { createSalesOrderAPI } from '../api/salesAPI';
import { getCustomersAPI } from '../../crm/api/customersAPI';
import { getProductsAPI } from '../../inventory/api/productsAPI';
import { formatApiError } from '../../../utils/errorUtils';
import PageHeader from '../../../components/common/PageHeader';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const NewSalesOrderPage = () => {
    // --- 2.1: Hooks y Gestión de Estado ---
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // --- 2.2: Lógica de Obtención de Datos para el Formulario ---
    const {
        data: customersData,
        isLoading: isLoadingCustomers,
        isError: isErrorCustomers,
        error: errorCustomers
    } = useQuery({
        queryKey: ['customersForSelect', { page: 1, pageSize: 1000 }],
        queryFn: () => getCustomersAPI({ page: 1, pageSize: 1000 }),
        initialData: { items: [] },
    });

    const {
        data: productsData,
        isLoading: isLoadingProducts,
        isError: isErrorProducts,
        error: errorProducts
    } = useQuery({
        queryKey: ['productsForSelect', { page: 1, pageSize: 1000 }],
        queryFn: () => getProductsAPI({ page: 1, pageSize: 1000, search: '' }),
        initialData: { items: [] },
    });

    // --- 2.3: Lógica de Mutación para Crear la Orden de Venta ---
    const { mutate: createSalesOrder, isPending: isSubmitting } = useMutation({
        mutationFn: createSalesOrderAPI,
        onSuccess: (newOrder) => {
            enqueueSnackbar(`Orden de Venta #${newOrder.order_number || ''} creada exitosamente.`, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
            navigate('/ventas/ordenes');
        },
        onError: (error) => {
            enqueueSnackbar(formatApiError(error), { variant: 'error', persist: true });
        }
    });

    // --- 2.4: Manejador de Envío del Formulario ---
    const handleFormSubmit = useCallback((formValues) => {
        const payload = {
            customer_id: formValues.customer?.id,
            order_date: formValues.order_date.toISOString(),
            notes: formValues.notes || null,
            shipping_address: formValues.shipping_address || null, // Asumiendo que este campo existe en el form
            items: formValues.items
                .filter(item => item.product?.id && Number(item.quantity) > 0)
                .map(item => ({
                    product_id: item.product.id,
                    quantity: Number(item.quantity),
                    // --- CORRECCIÓN CRÍTICA ---
                    // Se toma el `unit_price` directamente del ítem del formulario,
                    // que es el valor que el usuario ve y puede editar.
                    // Esto "congela" el precio de la venta.
                    unit_price: Number(item.unit_price),
                })),
        };
        
        if (!payload.customer_id || payload.items.length === 0) {
            enqueueSnackbar('Por favor, seleccione un cliente y añada al menos un producto con cantidad mayor a cero.', { variant: 'warning' });
            return;
        }

        createSalesOrder(payload);
    }, [createSalesOrder, enqueueSnackbar]);

    // --- 2.5: Renderizado de la UI ---
    const isLoading = isLoadingCustomers || isLoadingProducts;
    const isError = isErrorCustomers || isErrorProducts;
    const error = errorCustomers || errorProducts;

    return (
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <PageHeader
                title="Crear Nueva Orden de Venta"
                subtitle="Seleccione un cliente y añada los productos para registrar una nueva venta."
                showAddButton={false}
            />
            
            <Paper sx={{ p: { xs: 2, md: 4 }, mt: 3, borderRadius: 2, boxShadow: 3 }}>
                {isLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                        <Typography sx={{ ml: 2 }}>Cargando datos del formulario...</Typography>
                    </Box>
                )}

                {isError && (
                    <Alert severity="error" sx={{ my: 2 }}>
                        {`Error al cargar los datos: ${formatApiError(error)}`}
                    </Alert>
                )}
                
                {!isLoading && !isError && (
                     <SalesOrderForm
                        onSubmit={handleFormSubmit}
                        isSubmitting={isSubmitting}
                        customerOptions={customersData.items}
                        productsOptions={productsData.items}
                    />
                )}
            </Paper>
        </Container>
    );
};

export default NewSalesOrderPage;