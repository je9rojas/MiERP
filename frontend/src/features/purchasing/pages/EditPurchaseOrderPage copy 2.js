// frontend/src/features/purchasing/pages/EditPurchaseOrderPage.js

/**
 * @file Página contenedora para ver y gestionar una Orden de Compra existente.
 *
 * @description Este componente orquesta el flujo de visualización, edición y aprobación de una OC.
 * Sus responsabilidades son:
 * 1. Obtener todos los datos necesarios para el formulario de forma paralela y eficiente.
 * 2. Renderizar el formulario, habilitando la edición solo si el estado es 'borrador'.
 * 3. Mostrar y manejar los botones de acción del flujo de aprobación (Enviar, Aprobar, Rechazar)
 *    basándose en el estado actual de la OC y los permisos del usuario.
 * 4. Manejar las mutaciones para actualizar la OC o cambiar su estado.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Container, Paper, Box, CircularProgress, Typography, Alert, Button, Stack, Divider } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

// Hooks, API, Componentes y Mappers
import { useAuth } from '../../../app/contexts/AuthContext';
import { checkUserRole } from '../../../utils/auth/roles';
import PurchaseOrderForm from '../components/PurchaseOrderForm';
import { getPurchaseOrderByIdAPI, updatePurchaseOrderAPI, updatePurchaseOrderStatusAPI } from '../api/purchasingAPI';
import { getSuppliersAPI } from '../../crm/api/suppliersAPI';
import { getProductsAPI } from '../../inventory/api/productsAPI';
import { mapFormValuesToUpdatePayload } from '../mappers/purchaseOrderMappers';
import { formatApiError } from '../../../utils/errorUtils';
import PageHeader from '../../../components/common/PageHeader';

// ==============================================================================
// SECCIÓN 2: SUB-COMPONENTE DE ACCIONES DE APROBACIÓN
// ==============================================================================

const ActionButtons = ({ orderStatus, user, onSend, onApprove, onReject, isSubmitting }) => {
    const canApprove = checkUserRole(user?.role, ['manager', 'admin', 'superadmin']);

    if (orderStatus === 'draft') {
        return (
            <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={onSend}
                disabled={isSubmitting}
            >
                Enviar para Aprobación
            </Button>
        );
    }

    if (orderStatus === 'pending_approval' && canApprove) {
        return (
            <Stack direction="row" spacing={2}>
                <Button
                    variant="contained"
                    color="success"
                    startIcon={<ThumbUpIcon />}
                    onClick={onApprove}
                    disabled={isSubmitting}
                >
                    Aprobar
                </Button>
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<ThumbDownIcon />}
                    onClick={onReject}
                    disabled={isSubmitting}
                >
                    Rechazar
                </Button>
            </Stack>
        );
    }

    return null; // No se muestran botones de acción para otros estados
};


// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const EditPurchaseOrderPage = () => {
    // Sub-sección 3.1: Hooks y Estado
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Sub-sección 3.2: Lógica de Obtención de Datos
    const [orderQuery, suppliersQuery, productsQuery] = useQueries({
        queries: [
            { queryKey: ['purchaseOrder', orderId], queryFn: () => getPurchaseOrderByIdAPI(orderId), enabled: !!orderId },
            { queryKey: ['suppliersListForForm'], queryFn: () => getSuppliersAPI({ page: 1, pageSize: 1000 }), select: (data) => data.items || [], staleTime: 300000 },
            { queryKey: ['productsListForForm'], queryFn: () => getProductsAPI({ page: 1, pageSize: 1000 }), select: (data) => data.items || [], staleTime: 300000 },
        ],
    });

    const isLoading = orderQuery.isLoading || suppliersQuery.isLoading || productsQuery.isLoading;
    const isError = orderQuery.isError || suppliersQuery.isError || productsQuery.isError;
    const error = orderQuery.error || suppliersQuery.error || productsQuery.error;
    
    // Sub-sección 3.3: Lógica de Mutaciones
    const { mutate: updatePurchaseOrder, isPending: isUpdating } = useMutation({
        mutationFn: (payload) => updatePurchaseOrderAPI(orderId, payload),
        onSuccess: (data) => {
            enqueueSnackbar(`Orden de Compra ${data?.order_number || ''} actualizada exitosamente.`, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
            queryClient.invalidateQueries({ queryKey: ['purchaseOrder', orderId] });
            // No se navega para que el usuario pueda seguir interactuando (ej. enviar a aprobación)
        },
        onError: (err) => enqueueSnackbar(formatApiError(err), { variant: 'error', persist: true }),
    });

    const { mutate: updateStatus, isPending: isUpdatingStatus } = useMutation({
        mutationFn: (newStatus) => updatePurchaseOrderStatusAPI(orderId, newStatus),
        onSuccess: (data) => {
            enqueueSnackbar(`Estado de la Orden de Compra actualizado a: ${data.status.replace('_', ' ').toUpperCase()}`, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
            queryClient.invalidateQueries({ queryKey: ['purchaseOrder', orderId] });
            // Si la acción fue final (aprobada/rechazada), se redirige a la lista.
            if (['approved', 'rejected', 'cancelled'].includes(data.status)) {
                navigate('/compras/ordenes');
            }
        },
        onError: (err) => enqueueSnackbar(formatApiError(err), { variant: 'error', persist: true }),
    });

    const isSubmitting = isUpdating || isUpdatingStatus;

    // Sub-sección 3.4: Manejadores de Eventos
    const handleUpdatePurchaseOrder = useCallback((formValues) => {
        const payload = mapFormValuesToUpdatePayload(formValues);
        updatePurchaseOrder(payload);
    }, [updatePurchaseOrder]);

    const handleSendForApproval = useCallback(() => updateStatus('pending_approval'), [updateStatus]);
    const handleApprove = useCallback(() => updateStatus('approved'), [updateStatus]);
    const handleReject = useCallback(() => updateStatus('rejected'), [updateStatus]);

    // Sub-sección 3.5: Renderizado
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
        return <Container maxWidth="md" sx={{ mt: 4 }}><Alert severity="error">{`Error al cargar los datos: ${formatApiError(error)}`}</Alert></Container>;
    }
    
    const purchaseOrder = orderQuery.data;
    const isReadOnly = purchaseOrder?.status !== 'draft';

    return (
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
                <PageHeader
                    title={isReadOnly ? `Detalles de OC: ${purchaseOrder?.order_number || ''}` : `Editar OC: ${purchaseOrder?.order_number || ''}`}
                    subtitle={isReadOnly ? "Revise los detalles de la orden para su aprobación." : "Modifique los detalles de la solicitud de compra."}
                    showAddButton={false}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 2 }}>
                    <ActionButtons
                        orderStatus={purchaseOrder?.status}
                        user={user}
                        onSend={handleSendForApproval}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        isSubmitting={isSubmitting}
                    />
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Box>
                    {purchaseOrder && suppliersQuery.data && productsQuery.data && (
                        <PurchaseOrderForm
                            initialData={purchaseOrder}
                            onSubmit={handleUpdatePurchaseOrder}
                            isSubmitting={isUpdating}
                            isReadOnly={isReadOnly} // Se pasa prop para deshabilitar el formulario
                            suppliersOptions={suppliersQuery.data}
                            productsOptions={productsQuery.data}
                            isLoadingSuppliers={suppliersQuery.isLoading}
                            isLoadingProducts={productsQuery.isLoading}
                        />
                    )}
                </Box>
            </Paper>
        </Container>
    );
};

export default EditPurchaseOrderPage;