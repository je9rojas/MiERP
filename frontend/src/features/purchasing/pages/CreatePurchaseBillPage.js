// frontend/src/features/purchasing/pages/CreatePurchaseBillPage.js

/**
 * @file Página para crear una Factura de Compra a partir de una Orden de Compra.
 *
 * @description Este componente orquesta el flujo de creación de una factura financiera.
 * Obtiene los datos de la Orden de Compra original y sus recepciones asociadas,
 * renderiza el formulario de factura y maneja la mutación para enviar los datos al backend.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Container, Paper, Box, CircularProgress, Typography, Alert, Button, Divider } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// API, Componentes y Mappers
import { getPurchaseOrderByIdAPI, createPurchaseBillAPI } from '../api/purchasingAPI';
import { mapFormValuesToBillPayload } from '../mappers/purchaseOrderMappers';
import PurchaseBillForm from '../components/PurchaseBillForm';
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const CreatePurchaseBillPage = () => {
    // Sub-sección 2.1: Hooks y Estado
    const { orderId } = useParams(); // <- CORRECCIÓN: Usamos orderId en lugar de receiptId
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // Sub-sección 2.2: Lógica de Obtención de Datos de la Orden de Compra
    const { data: purchaseOrder, isLoading, isError, error } = useQuery({
        // La queryKey ahora se basa en la Orden de Compra
        queryKey: ['purchaseOrderForBill', orderId],
        queryFn: () => getPurchaseOrderByIdAPI(orderId),
        enabled: !!orderId,
    });

    // Sub-sección 2.3: Lógica de Mutación para Crear la Factura
    const { mutate: createBill, isPending: isSubmitting } = useMutation({
        mutationFn: (payload) => createPurchaseBillAPI(payload),
        onSuccess: (data) => {
            enqueueSnackbar(`Factura de Compra #${data?.bill_number || ''} creada exitosamente.`, { variant: 'success' });
            // Invalidamos todas las consultas relevantes para refrescar los datos
            queryClient.invalidateQueries({ queryKey: ['purchaseBills'] });
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
            queryClient.invalidateQueries({ queryKey: ['purchaseOrder', orderId] });
            // Navegamos a la página de detalles de la nueva factura creada
            navigate(`/compras/facturas/${data.id}`);
        },
        onError: (err) => enqueueSnackbar(formatApiError(err), { variant: 'error' }),
    });

    // Sub-sección 2.4: Manejador de Envío del Formulario
    const handleCreateBill = useCallback((formValues) => {
        // El mapper ahora recibe el orderId directamente para mayor claridad
        const payload = mapFormValuesToBillPayload(formValues, orderId);
        createBill(payload);
    }, [createBill, orderId]);

    // Sub-sección 2.5: Renderizado Condicional (Carga y Error)
    if (isLoading) {
        return (
            <Container maxWidth="md"><Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box></Container>
        );
    }

    if (isError) {
        return <Container maxWidth="md" sx={{ mt: 4 }}><Alert severity="error">{formatApiError(error)}</Alert></Container>;
    }

    // Sub-sección 2.6: Renderizado Principal
    return (
        <Container maxWidth="lg" sx={{ my: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, boxShadow: 3 }}>
                <PageHeader
                    // <- CORRECCIÓN: Título y subtítulo actualizados
                    title={`Crear Factura para Orden de Compra: #${purchaseOrder?.order_number || ''}`}
                    subtitle="Registre los detalles financieros de la factura del proveedor basados en la mercancía recibida."
                    showAddButton={false}
                />
                <Box mt={3} mb={3}>
                    {/* <- CORRECCIÓN: El botón ahora vuelve a la lista de órdenes */}
                    <Button component={RouterLink} to="/compras/ordenes" startIcon={<ArrowBackIcon />}>
                        Volver a Órdenes de Compra
                    </Button>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Box>
                    {/* <- CORRECCIÓN: Pasamos los datos de la OC al formulario */}
                    {purchaseOrder && (
                        <PurchaseBillForm
                            initialData={purchaseOrder}
                            onSubmit={handleCreateBill}
                            isSubmitting={isSubmitting}
                        />
                    )}
                </Box>
            </Paper>
        </Container>
    );
};

export default CreatePurchaseBillPage;