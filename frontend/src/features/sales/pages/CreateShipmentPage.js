// frontend/src/features/sales/pages/CreateShipmentPage.js

/**
 * @file Página para crear un Despacho a partir de una Orden de Venta.
 *
 * @description Este componente orquesta el flujo de creación de un despacho.
 * Sus responsabilidades son:
 * 1. Obtener los datos de la Orden de Venta original.
 * 2. Renderizar un formulario (`ShipmentForm`) pre-cargado con los datos de la OV.
 * 3. Manejar la mutación para enviar los datos del despacho al backend, delegando
 *    la transformación del payload a la capa de mappers.
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
import { getSalesOrderByIdAPI, createShipmentAPI } from '../api/salesAPI';
import { mapFormValuesToShipmentPayload } from '../mappers/salesMappers';
import ShipmentForm from '../components/ShipmentForm';
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const CreateShipmentPage = () => {
    // Sub-sección 2.1: Hooks y Estado
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // Sub-sección 2.2: Lógica de Obtención de Datos de la Orden de Venta
    const { data: salesOrder, isLoading, isError, error } = useQuery({
        queryKey: ['salesOrderForShipment', orderId],
        queryFn: () => getSalesOrderByIdAPI(orderId),
        enabled: !!orderId,
    });
    
    // Sub-sección 2.3: Lógica de Mutación para Crear el Despacho
    const { mutate: createShipment, isPending: isSubmitting } = useMutation({
        mutationFn: (payload) => createShipmentAPI(orderId, payload),
        onSuccess: (data) => {
            enqueueSnackbar(`Despacho ${data?.shipment_number || ''} creado exitosamente.`, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['salesOrdersList'] });
            queryClient.invalidateQueries({ queryKey: ['salesOrder', orderId] });
            queryClient.invalidateQueries({ queryKey: ['salesOrderForShipment', orderId] });
            navigate(`/ventas/ordenes/${orderId}`);
        },
        onError: (err) => enqueueSnackbar(formatApiError(err), { variant: 'error', persist: true }),
    });

    // Sub-sección 2.4: Manejador de Envío del Formulario
    const handleCreateShipment = useCallback((formValues) => {
        // La lógica de transformación del payload ahora está encapsulada en el mapper.
        const payload = mapFormValuesToShipmentPayload(formValues);
        
        if (payload.items.length === 0) {
            enqueueSnackbar('No se puede crear un despacho sin ítems. Ingrese al menos una cantidad a despachar.', { variant: 'warning' });
            return;
        }
        createShipment(payload);
    }, [createShipment, enqueueSnackbar]);

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

    return (
        <Container maxWidth="lg" sx={{ my: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
                <PageHeader
                    title={`Crear Despacho para OV: ${salesOrder?.order_number || ''}`}
                    subtitle="Confirme los productos y cantidades que están saliendo del almacén."
                    showAddButton={false}
                />
                 <Box mt={3} mb={3}>
                    <Button
                        component={RouterLink}
                        to={`/ventas/ordenes/${orderId}`}
                        startIcon={<ArrowBackIcon />}
                    >
                        Volver a la Orden de Venta
                    </Button>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Box>
                    {salesOrder && (
                        <ShipmentForm
                            initialData={salesOrder}
                            onSubmit={handleCreateShipment}
                            isSubmitting={isSubmitting}
                        /> 
                    )}
                </Box>
            </Paper>
        </Container>
    );
};

export default CreateShipmentPage;