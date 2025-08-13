// frontend/src/features/purchasing/pages/EditPurchaseOrderPage.js

/**
 * @file Página contenedora para la edición de una Orden de Compra existente.
 *
 * @description Este componente orquesta el flujo de edición. Sus responsabilidades son:
 * 1. Obtener los datos necesarios para el formulario (la OC a editar, y las listas de
 *    proveedores y productos) de forma paralela y eficiente.
 * 2. Pasar los datos a un componente de formulario de presentación (`PurchaseOrderForm`).
 * 3. Manejar la lógica de envío (mutación), delegando la transformación del payload
 *    a la capa de mappers para mantener la separación de concerns.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Container, Paper, Box, CircularProgress, Typography, Alert } from '@mui/material';

// API, Componentes y Mappers
import PurchaseOrderForm from '../components/PurchaseOrderForm';
import { getPurchaseOrderByIdAPI, updatePurchaseOrderAPI } from '../api/purchasingAPI';
import { getSuppliersAPI } from '../../crm/api/suppliersAPI';
import { getProductsAPI } from '../../inventory/api/productsAPI';
import { mapFormValuesToUpdatePayload } from '../mappers/purchaseOrderMappers';
import { formatApiError } from '../../../utils/errorUtils';
import PageHeader from '../../../components/common/PageHeader';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const EditPurchaseOrderPage = () => {
    // Sub-sección 2.1: Hooks y Estado
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // Sub-sección 2.2: Lógica de Obtención de Datos (Queries Paralelas)
    const results = useQueries({
        queries: [
            {
                queryKey: ['purchaseOrder', orderId],
                queryFn: () => getPurchaseOrderByIdAPI(orderId),
                enabled: !!orderId,
            },
            {
                queryKey: ['suppliersListForForm'],
                queryFn: () => getSuppliersAPI({ page: 1, pageSize: 1000 }), // Se asume que no habrá más de 1000 proveedores
                select: (data) => data.items || [],
                staleTime: 5 * 60 * 1000, // Cache de 5 minutos
            },
            {
                queryKey: ['productsListForForm'],
                queryFn: () => getProductsAPI({ page: 1, pageSize: 1000 }), // Se asume que no habrá más de 1000 productos
                select: (data) => data.items || [],
                staleTime: 5 * 60 * 1000, // Cache de 5 minutos
            },
        ],
    });

    const [orderQuery, suppliersQuery, productsQuery] = results;

    const isLoading = results.some(query => query.isLoading);
    const isError = results.some(query => query.isError);
    // Se prioriza mostrar el error de la query principal si existen varios.
    const error = orderQuery.error || suppliersQuery.error || productsQuery.error;

    // Sub-sección 2.3: Lógica de Modificación de Datos (Mutation)
    const { mutate: updatePurchaseOrder, isPending: isUpdating } = useMutation({
        mutationFn: (payload) => updatePurchaseOrderAPI(orderId, payload),
        onSuccess: (data) => {
            enqueueSnackbar(`Orden de Compra ${data?.order_number || ''} actualizada exitosamente.`, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
            queryClient.invalidateQueries({ queryKey: ['purchaseOrder', orderId] });
            navigate('/compras/ordenes');
        },
        onError: (err) => {
            enqueueSnackbar(formatApiError(err), { variant: 'error', persist: true });
        },
    });

    // Sub-sección 2.4: Manejador de Eventos (Callback)
    const handleUpdatePurchaseOrder = useCallback((formValues) => {
        // La lógica de transformación del payload se delega al mapper.
        const payload = mapFormValuesToUpdatePayload(formValues);
        updatePurchaseOrder(payload);
    }, [updatePurchaseOrder]);
    
    // Sub-sección 2.5: Renderizado Condicional de la UI
    if (isLoading) {
        return (
            <Container maxWidth="md">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                    <CircularProgress size={40} />
                    <Typography sx={{ ml: 2 }}>Cargando datos del formulario...</Typography>
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
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
                <PageHeader
                    title={`Editar Orden de Compra: ${orderQuery.data?.order_number || ''}`}
                    subtitle="Modifique los detalles de la solicitud de compra."
                    showAddButton={false}
                />
                <Box mt={3}>
                    {orderQuery.data && suppliersQuery.data && productsQuery.data && (
                        <PurchaseOrderForm
                            initialData={orderQuery.data}
                            onSubmit={handleUpdatePurchaseOrder}
                            isSubmitting={isUpdating}
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