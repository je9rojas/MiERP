// frontend/src/features/purchasing/pages/RegisterReceiptPage.js

/**
 * @file Página para registrar la recepción de una Orden de Compra.
 *
 * Este componente orquesta el flujo completo de registrar una factura de compra.
 * Su responsabilidad es:
 * 1. Obtener los datos de la OC original a través de la API.
 * 2. Pasar dichos datos a un componente de formulario de presentación (`PurchaseBillForm`).
 * 3. Manejar la lógica de envío (mutación), delegando la transformación del payload
 *    a la capa de mappers para mantener la separación de concerns.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Container, Paper, Box, CircularProgress, Typography, Alert } from '@mui/material';

// API, Componentes y Mappers
import { getPurchaseOrderByIdAPI, registerReceiptAPI } from '../api/purchasingAPI';
import { mapFormValuesToReceiptPayload } from '../mappers/purchaseOrderMappers';
import PurchaseBillForm from '../components/PurchaseBillForm';
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const RegisterReceiptPage = () => {
    // Sub-sección 2.1: Hooks y Estado
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // Sub-sección 2.2: Lógica de Obtención de Datos (Query)
    const { data: purchaseOrder, isLoading, isError, error } = useQuery({
        queryKey: ['purchaseOrderForReceipt', orderId],
        queryFn: () => getPurchaseOrderByIdAPI(orderId),
        enabled: !!orderId,
    });

    // Sub-sección 2.3: Lógica de Modificación de Datos (Mutation)
    const { mutate: registerReceipt, isPending: isSubmitting } = useMutation({
        mutationFn: (payload) => registerReceiptAPI(orderId, payload),
        onSuccess: (data) => {
            enqueueSnackbar(`Recepción ${data?.bill_number || ''} registrada exitosamente.`, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
            queryClient.invalidateQueries({ queryKey: ['purchaseOrder', orderId] });
            queryClient.invalidateQueries({ queryKey: ['purchaseOrderForReceipt', orderId] });
            navigate('/compras/ordenes');
        },
        onError: (err) => {
            enqueueSnackbar(formatApiError(err), { variant: 'error', persist: true });
        },
    });

    // Sub-sección 2.4: Manejador de Eventos (Callback)
    const handleRegisterReceipt = useCallback((formValues) => {
        // La transformación de datos ahora está encapsulada en el mapper.
        const payload = mapFormValuesToReceiptPayload(formValues);
        
        if (payload.items.length === 0) {
            enqueueSnackbar('No se puede registrar una recepción sin ítems. Por favor, ingrese al menos una cantidad recibida mayor a cero.', { variant: 'warning' });
            return;
        }
        
        registerReceipt(payload);
    }, [registerReceipt, enqueueSnackbar]);

    // Sub-sección 2.5: Renderizado Condicional de la UI
    if (isLoading) {
        return (
            <Container maxWidth="md">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Cargando datos de la orden de compra...</Typography>
                </Box>
            </Container>
        );
    }

    if (isError) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">{`Error al cargar los datos: ${formatApiError(error)}`}</Alert>
            </Container>
        );
    }

    // Sub-sección 2.6: Renderizado Principal
    return (
        <Container maxWidth="lg" sx={{ my: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
                <PageHeader
                    title={`Registrar Recepción de OC: ${purchaseOrder?.order_number || ''}`}
                    subtitle="Confirme las cantidades y costos reales recibidos de su proveedor."
                    showAddButton={false}
                />
                <Box mt={3}>
                    {purchaseOrder && (
                        <PurchaseBillForm
                            initialData={purchaseOrder}
                            onSubmit={handleRegisterReceipt}
                            isSubmitting={isSubmitting}
                        />
                    )}
                </Box>
            </Paper>
        </Container>
    );
};

export default RegisterReceiptPage;