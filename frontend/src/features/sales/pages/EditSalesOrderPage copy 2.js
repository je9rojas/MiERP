// /frontend/src/features/sales/pages/EditSalesOrderPage.js

/**
 * @file Página contenedora para la gestión de una Orden de Venta individual.
 * @description Este componente orquesta el flujo completo para ver, editar, confirmar, imprimir y despachar una OV.
 * Actúa como un "componente inteligente" que maneja la obtención de datos, las mutaciones de estado
 * y la renderización de los componentes de UI correspondientes.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Container, Paper, Box, CircularProgress, Typography, Alert, Button, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

import { getSalesOrderByIdAPI, confirmSalesOrderAPI, updateSalesOrderAPI } from '../api/salesAPI';
import { getCustomersAPI } from '../../crm/api/customersAPI';
import { getProductsAPI } from '../../inventory/api/productsAPI';
import { generateSalesOrderPDFAPI } from '../../reports/api/reportsAPI'; // (AÑADIDO)
import { mapFormValuesToUpdatePayload, mapSalesOrderToFormValues } from '../mappers/salesMappers';
import SalesOrderForm from '../components/SalesOrderForm';
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';
import { downloadFile } from '../../../utils/fileUtils'; // (AÑADIDO) Asumimos que esta utilidad existe.

// ==============================================================================
// SECCIÓN 2: SUB-COMPONENTES DE UI (Separation of Concerns)
// ==============================================================================

/**
 * @description Renderiza los botones de acción disponibles para una orden de venta.
 */
const OrderActions = ({ status, isSubmitting, isPrinting, onConfirm, onNavigateToShipment, onPrint }) => {
    const canBeShipped = ['confirmed', 'partially_shipped'].includes(status);
    const documentName = status === 'draft' ? "Proforma" : "Orden";

    return (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 2, gap: 2 }}>
            <Button
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                onClick={onPrint}
                disabled={isSubmitting || isPrinting}
            >
                {isPrinting ? 'Generando...' : `Generar ${documentName}`}
            </Button>
            {status === 'draft' && (
                <Button
                    variant="contained"
                    startIcon={<CheckCircleIcon />}
                    onClick={onConfirm}
                    disabled={isSubmitting || isPrinting}
                >
                    {isConfirming ? 'Confirmando...' : 'Confirmar Orden'}
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

// ... (El resto de sub-componentes LoadingIndicator y ErrorDisplay se mantienen igual)
const LoadingIndicator = () => (
    <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <CircularProgress size={40} />
            <Typography sx={{ ml: 2 }}>Cargando datos de la orden...</Typography>
        </Box>
    </Container>
);

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

    const { mutate: printDocument, isPending: isPrinting } = useMutation({
        mutationFn: () => generateSalesOrderPDFAPI(orderId),
        onSuccess: ({ blob, filename }) => {
            downloadFile(blob, filename); // Llama a la utilidad de descarga
            enqueueSnackbar('Documento generado exitosamente.', { variant: 'success' });
        },
        onError: (err) => enqueueSnackbar(`Error al generar el documento: ${formatApiError(err)}`, { variant: 'error' }),
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
    
    const handlePrintDocument = useCallback(() => printDocument(), [printDocument]);

    const handleNavigateToShipment = useCallback(() => {
        navigate(`/ventas/ordenes/${orderId}/despachar`);
    }, [navigate, orderId]);

    const formInitialValues = useMemo(() => {
        if (salesOrder && products) {
            return mapSalesOrderToFormValues(salesOrder, products);
        }
        return null;
    }, [salesOrder, products]);

    // --------------------------------------------------------------------------
    // 3.5: Lógica de Renderizado
    // --------------------------------------------------------------------------
    if (isLoading || (!!orderId && !formInitialValues)) {
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
                    isPrinting={isPrinting}
                    onConfirm={handleConfirmOrder}
                    onNavigateToShipment={handleNavigateToShipment}
                    onPrint={handlePrintDocument}
                />
                
                <Divider sx={{ mb: 3 }} />

                <Box>
                    <SalesOrderForm
                        initialData={formInitialValues}
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