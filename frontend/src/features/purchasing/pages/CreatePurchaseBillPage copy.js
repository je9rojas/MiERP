// frontend/src/features/purchasing/pages/CreatePurchaseBillPage.js

/**
 * @file Página para crear una Factura de Compra a partir de una Recepción de Mercancía.
 *
 * @description Este componente orquesta el flujo de creación de una factura financiera.
 * Obtiene los datos de la recepción original, renderiza el formulario de factura y
 * maneja la mutación para enviar los datos al backend.
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
import { getGoodsReceiptByIdAPI, createPurchaseBillAPI } from '../api/purchasingAPI';
import { mapFormValuesToBillPayload } from '../mappers/purchaseOrderMappers';
import PurchaseBillForm from '../components/PurchaseBillForm';
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const CreatePurchaseBillPage = () => {
    // Sub-sección 2.1: Hooks y Estado
    const { receiptId } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // Sub-sección 2.2: Lógica de Obtención de Datos de la Recepción
    const { data: goodsReceipt, isLoading, isError, error } = useQuery({
        queryKey: ['goodsReceiptForBill', receiptId],
        queryFn: () => getGoodsReceiptByIdAPI(receiptId),
        enabled: !!receiptId,
    });

    // Sub-sección 2.3: Lógica de Mutación para Crear la Factura
    const { mutate: createBill, isPending: isSubmitting } = useMutation({
        mutationFn: (payload) => createPurchaseBillAPI(payload),
        onSuccess: (data) => {
            enqueueSnackbar(`Factura de Compra ${data?.bill_number || ''} creada exitosamente.`, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['purchaseBills'] });
            queryClient.invalidateQueries({ queryKey: ['goodsReceipt', receiptId] });
            queryClient.invalidateQueries({ queryKey: ['purchaseOrder', data.purchase_order_id] });
            navigate(`/compras/facturas/${data.id}`);
        },
        onError: (err) => enqueueSnackbar(formatApiError(err), { variant: 'error', persist: true }),
    });

    // Sub-sección 2.4: Manejador de Envío del Formulario
    const handleCreateBill = useCallback((formValues) => {
        const payload = mapFormValuesToBillPayload(formValues, receiptId);
        createBill(payload);
    }, [createBill, receiptId]);

    // Sub-sección 2.5: Renderizado
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
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
                <PageHeader
                    title={`Crear Factura desde Recepción: ${goodsReceipt?.receipt_number || ''}`}
                    subtitle="Registre los detalles financieros de la factura del proveedor."
                    showAddButton={false}
                />
                <Box mt={3} mb={3}>
                    <Button component={RouterLink} to={`/compras/recepciones/${receiptId}`} startIcon={<ArrowBackIcon />}>
                        Volver a la Recepción
                    </Button>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Box>
                    {goodsReceipt && (
                        <PurchaseBillForm
                            initialData={goodsReceipt}
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