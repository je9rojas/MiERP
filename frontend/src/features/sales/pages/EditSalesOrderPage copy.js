// frontend/src/features/sales/pages/EditSalesOrderPage.js

/**
 * @file Página para ver, editar, confirmar y despachar una Orden de Venta.
 *
 * @description Este componente orquesta el flujo de gestión de una OV individual,
 * manejando la obtención de datos, la renderización del formulario y las acciones
 * de estado como "Confirmar" y "Crear Despacho".
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Container, Paper, Box, CircularProgress, Typography, Alert, Button, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

// Hooks, API, Componentes y Mappers
import { getSalesOrderByIdAPI, confirmSalesOrderAPI, updateSalesOrderAPI } from '../api/salesAPI';
import { getCustomersAPI } from '../../crm/api/customersAPI';
import { getProductsAPI } from '../../inventory/api/productsAPI';
import { mapFormValuesToUpdatePayload } from '../mappers/salesMappers'; // Se usa el mapper correcto de ventas
import SalesOrderForm from '../components/SalesOrderForm';
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const EditSalesOrderPage = () => {
    // Sub-sección 2.1: Hooks y Estado
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // Sub-sección 2.2: Lógica de Obtención de Datos (Queries Paralelas)
    const [orderQuery, customersQuery, productsQuery] = useQueries({
        queries: [
            { queryKey: ['salesOrder', orderId], queryFn: () => getSalesOrderByIdAPI(orderId), enabled: !!orderId },
            { queryKey: ['customersListForForm'], queryFn: () => getCustomersAPI({ page: 1, pageSize: 1000 }), select: (data) => data.items || [], staleTime: 300000 },
            { queryKey: ['productsListForForm'], queryFn: () => getProductsAPI({ page: 1, pageSize: 1000 }), select: (data) => data.items || [], staleTime: 300000 },
        ]
    });

    const isLoading = orderQuery.isLoading || customersQuery.isLoading || productsQuery.isLoading;
    const isError = orderQuery.isError || customersQuery.isError || productsQuery.isError;
    const error = orderQuery.error || customersQuery.error || productsQuery.error;
    
    // Sub-sección 2.3: Lógica de Mutaciones
    const { mutate: updateSalesOrder, isPending: isUpdating } = useMutation({
        mutationFn: (payload) => updateSalesOrderAPI(orderId, payload),
        onSuccess: (data) => {
            enqueueSnackbar(`Orden de Venta ${data?.order_number || ''} actualizada.`, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['salesOrder', orderId] });
        },
        onError: (err) => enqueueSnackbar(formatApiError(err), { variant: 'error', persist: true }),
    });
    
    const { mutate: confirmOrder, isPending: isConfirming } = useMutation({
        mutationFn: () => confirmSalesOrderAPI(orderId),
        onSuccess: (data) => {
            enqueueSnackbar(`Orden de Venta ${data?.order_number || ''} confirmada exitosamente.`, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['salesOrdersList'] });
            queryClient.invalidateQueries({ queryKey: ['salesOrder', orderId] });
        },
        onError: (err) => enqueueSnackbar(formatApiError(err), { variant: 'error', persist: true }),
    });
    
    const isSubmitting = isUpdating || isConfirming;

    // Sub-sección 2.4: Manejadores de Eventos
    const handleUpdateSalesOrder = useCallback((formValues) => {
        const payload = mapFormValuesToUpdatePayload(formValues);
        updateSalesOrder(payload);
    }, [updateSalesOrder]);
    
    const handleConfirmOrder = useCallback(() => confirmOrder(), [confirmOrder]);

    const handleNavigateToShipment = useCallback(() => {
        navigate(`/ventas/ordenes/${orderId}/despachar`);
    }, [navigate, orderId]);

    // Sub-sección 2.5: Renderizado
    if (isLoading) {
        return (
            <Container maxWidth="md">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                    <CircularProgress size={40} />
                    <Typography sx={{ ml: 2 }}>Cargando datos de la orden...</Typography>
                </Box>
            </Container>
        );
    }

    if (isError) {
        return <Container maxWidth="md" sx={{ mt: 4 }}><Alert severity="error">{formatApiError(error)}</Alert></Container>;
    }
    
    const salesOrder = orderQuery.data;
    const isReadOnly = salesOrder?.status !== 'draft';
    const canBeShipped = ['confirmed', 'partially_shipped'].includes(salesOrder?.status);

    return (
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
                <PageHeader
                    title={isReadOnly ? `Detalles de OV: ${salesOrder?.order_number || ''}` : `Editar OV: ${salesOrder?.order_number || ''}`}
                    subtitle={isReadOnly ? "Revise los detalles de la orden para confirmar o despachar." : "Modifique los detalles de la solicitud de venta."}
                    showAddButton={false}
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 2, gap: 2 }}>
                    {salesOrder?.status === 'draft' && (
                        <Button
                            variant="contained"
                            startIcon={<CheckCircleIcon />}
                            onClick={handleConfirmOrder}
                            disabled={isSubmitting}
                        >
                            {isConfirming ? 'Confirmando...' : 'Confirmar Orden'}
                        </Button>
                    )}
                    {canBeShipped && (
                        <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<LocalShippingIcon />}
                            onClick={handleNavigateToShipment}
                        >
                            Crear Despacho
                        </Button>
                    )}
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Box>
                    {salesOrder && (
                        <SalesOrderForm
                            initialData={salesOrder}
                            onSubmit={handleUpdateSalesOrder}
                            isSubmitting={isUpdating}
                            isReadOnly={isReadOnly}
                            customersOptions={customersQuery.data || []}
                            isLoadingCustomers={customersQuery.isLoading}
                            productsOptions={productsQuery.data || []}
                            isLoadingProducts={productsQuery.isLoading}
                        />
                    )}
                </Box>
            </Paper>
        </Container>
    );
};

export default EditSalesOrderPage;