// /frontend/src/features/purchasing/pages/CreateReceiptPage.js

/**
 * @file Página para crear una Recepción de Mercancía a partir de una Orden de Compra.
 * @description Orquesta el flujo de registro de una entrada física de inventario.
 * Obtiene los datos de la OC, renderiza el formulario y maneja la mutación
 * para enviar los datos al backend, invalidando las cachés relevantes al éxito.
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

import { getPurchaseOrderByIdAPI, createGoodsReceiptAPI } from '../api/purchasingAPI';
import { mapFormValuesToGoodsReceiptPayload } from '../mappers/purchaseOrderMappers';
import GoodsReceiptForm from '../components/GoodsReceiptForm';
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const CreateReceiptPage = () => {
    // --------------------------------------------------------------------------
    // Sub-sección 2.1: Hooks y Configuración
    // --------------------------------------------------------------------------
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // --------------------------------------------------------------------------
    // Sub-sección 2.2: Lógica de Obtención de Datos de la Orden de Compra
    // --------------------------------------------------------------------------
    const { data: purchaseOrder, isLoading, isError, error } = useQuery({
        queryKey: ['purchaseOrderForReceipt', orderId],
        queryFn: () => getPurchaseOrderByIdAPI(orderId),
        enabled: !!orderId,
    });

    // --------------------------------------------------------------------------
    // Sub-sección 2.3: Lógica de Mutación para Crear la Recepción
    // --------------------------------------------------------------------------
    const { mutate: createReceipt, isPending: isSubmitting } = useMutation({
        mutationFn: (payload) => createGoodsReceiptAPI(orderId, payload),
        onSuccess: (data) => {
            enqueueSnackbar(`Recepción #${data?.receipt_number || ''} registrada exitosamente.`, { variant: 'success' });
            
            // --- CORRECCIÓN CRÍTICA ---
            // Se invalidan todas las consultas que dependen de los datos modificados.
            // Al crear una recepción, no solo cambian las compras, sino también el stock de los productos.
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
            queryClient.invalidateQueries({ queryKey: ['goodsReceipts'] });
            queryClient.invalidateQueries({ queryKey: ['purchaseOrder', orderId] });
            queryClient.invalidateQueries({ queryKey: ['products'] }); // <-- ESTA LÍNEA SOLUCIONA EL PROBLEMA

            navigate('/compras/recepciones'); // Navegar a la lista de recepciones es un flujo más lógico.
        },
        onError: (err) => enqueueSnackbar(formatApiError(err), { variant: 'error' }),
    });

    // --------------------------------------------------------------------------
    // Sub-sección 2.4: Manejador de Envío del Formulario
    // --------------------------------------------------------------------------
    const handleCreateReceipt = useCallback((formValues) => {
        const payload = mapFormValuesToGoodsReceiptPayload(formValues, orderId);
        
        if (payload.items.length === 0) {
            enqueueSnackbar('Debe registrar al menos una cantidad recibida mayor a cero.', { variant: 'warning' });
            return;
        }
        createReceipt(payload);
    }, [createReceipt, enqueueSnackbar, orderId]);

    // --------------------------------------------------------------------------
    // Sub-sección 2.5: Renderizado del Componente
    // --------------------------------------------------------------------------
    if (isLoading) {
        return (
            <Container maxWidth="md"><Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box></Container>
        );
    }

    if (isError) {
        return <Container maxWidth="md" sx={{ mt: 4 }}><Alert severity="error">{formatApiError(error)}</Alert></Container>;
    }

    return (
        <Container maxWidth="lg" sx={{ my: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, boxShadow: 3 }}>
                <PageHeader
                    title={`Registrar Recepción para OC: #${purchaseOrder?.order_number || ''}`}
                    subtitle="Confirme las cantidades de productos que están ingresando físicamente al inventario."
                />
                <Box mt={3} mb={3}>
                    <Button component={RouterLink} to={`/compras/ordenes/${orderId}`} startIcon={<ArrowBackIcon />}>
                        Volver a la Orden de Compra
                    </Button>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Box>
                    {purchaseOrder && (
                        <GoodsReceiptForm
                            initialData={purchaseOrder}
                            onSubmit={handleCreateReceipt}
                            isSubmitting={isSubmitting}
                        />
                    )}
                </Box>
            </Paper>
        </Container>
    );
};

export default CreateReceiptPage;