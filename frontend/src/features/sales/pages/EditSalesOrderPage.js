/**
 * @file Página contenedora para la gestión de una Orden de Venta individual.
 * @description Este componente orquesta el flujo completo para ver, editar, confirmar y despachar una OV.
 * Actúa como un "componente inteligente" que maneja la obtención de datos, las mutaciones de estado
 * y la renderización de los componentes de UI correspondientes.
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

import { getSalesOrderByIdAPI, confirmSalesOrderAPI, updateSalesOrderAPI } from '../api/salesAPI';
import { getCustomersAPI } from '../../crm/api/customersAPI';
import { getProductsAPI } from '../../inventory/api/productsAPI';
import { mapFormValuesToUpdatePayload } from '../mappers/salesMappers';
import SalesOrderForm from '../components/SalesOrderForm';
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: SUB-COMPONENTES DE UI (Separation of Concerns)
// ==============================================================================

/**
 * @description Renderiza los botones de acción disponibles para una orden de venta según su estado.
 */
const OrderActions = ({ status, isSubmitting, onConfirm, onNavigateToShipment }) => {
    const canBeShipped = ['confirmed', 'partially_shipped'].includes(status);

    return (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 2, gap: 2 }}>
            {status === 'draft' && (
                <Button
                    variant="contained"
                    startIcon={<CheckCircleIcon />}
                    onClick={onConfirm}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Confirmando...' : 'Confirmar Orden'}
                </Button>
            )}
            {canBeShipped && (
                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<LocalShippingIcon />}
                    onClick={onNavigateToShipment}
                >
                    Crear Despacho
                </Button>
            )}
        </Box>
    );
};

/**
 * @description Muestra un indicador de carga centrado para la página.
 */
const LoadingIndicator = () => (
    <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <CircularProgress size={40} />
            <Typography sx={{ ml: 2 }}>Cargando datos de la orden...</Typography>
        </Box>
    </Container>
);

/**
 * @description Muestra un mensaje de error estandarizado.
 */
const ErrorDisplay = ({ error }) => (
    <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{formatApiError(error)}</Alert>
    </Container>
);

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const EditSalesOrderPage = () => {
    // --------------------------------------------------------------------------
    // 3.1: Hooks y Configuración Inicial
    // --------------------------------------------------------------------------
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // --------------------------------------------------------------------------
    // 3.2: Lógica de Obtención de Datos (React Query)
    // --------------------------------------------------------------------------
    const [orderQuery, customersQuery, productsQuery] = useQueries({
        queries: [
            { queryKey: ['salesOrder', orderId], queryFn: () => getSalesOrderByIdAPI(orderId), enabled: !!orderId },
            { queryKey: ['customersListForForm'], queryFn: () => getCustomersAPI({ page: 1, pageSize: 1000 }), select: (data) => data.items || [], staleTime: 300000 },
            { queryKey: ['productsListForForm'], queryFn: () => getProductsAPI({ page: 1, pageSize: 1000 }), select: (data) => data.items || [], staleTime: 300000 },
        ]
    });

    const { data: salesOrder, isLoading: isLoadingOrder, isError: isErrorOrder, error: orderError } = orderQuery;
    const { data: customers, isLoading: isLoadingCustomers } = customersQuery;
    const { data: products, isLoading: isLoadingProducts } = productsQuery;

    // --------------------------------------------------------------------------
    // 3.3: Lógica de Mutaciones (React Query)
    // --------------------------------------------------------------------------
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

    // --------------------------------------------------------------------------
    // 3.4: Derivación de Estado y Manejadores de Eventos
    // --------------------------------------------------------------------------
    const isLoading = isLoadingOrder || isLoadingCustomers || isLoadingProducts;
    const isSubmitting = isUpdating || isConfirming;
    const isReadOnly = salesOrder?.status !== 'draft';

    const handleUpdateSalesOrder = useCallback((formValues) => {
        const payload = mapFormValuesToUpdatePayload(formValues);
        updateSalesOrder(payload);
    }, [updateSalesOrder]);
    
    const handleConfirmOrder = useCallback(() => confirmOrder(), [confirmOrder]);

    const handleNavigateToShipment = useCallback(() => {
        navigate(`/ventas/ordenes/${orderId}/despachar`);
    }, [navigate, orderId]);

    // --------------------------------------------------------------------------
    // 3.5: Lógica de Renderizado
    // --------------------------------------------------------------------------
    if (isLoading) {
        return <LoadingIndicator />;
    }

    if (isErrorOrder) {
        return <ErrorDisplay error={orderError} />;
    }

    return (
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
                <PageHeader
                    title={isReadOnly ? `Detalles de OV: ${salesOrder?.order_number || ''}` : `Editar OV: ${salesOrder?.order_number || ''}`}
                    subtitle={isReadOnly ? "Revise los detalles de la orden para confirmar o despachar." : "Modifique los detalles de la solicitud de venta."}
                    showAddButton={false}
                />
                
                <OrderActions
                    status={salesOrder?.status}
                    isSubmitting={isSubmitting}
                    onConfirm={handleConfirmOrder}
                    onNavigateToShipment={handleNavigateToShipment}
                />
                
                <Divider sx={{ mb: 3 }} />

                <Box>
                    <SalesOrderForm
                        initialData={salesOrder}
                        onSubmit={handleUpdateSalesOrder}
                        isSubmitting={isUpdating}
                        isReadOnly={isReadOnly}
                        customerOptions={customers || []}
                        productsOptions={products || []}
                    />
                </Box>
            </Paper>
        </Container>
    );
};

export default EditSalesOrderPage;