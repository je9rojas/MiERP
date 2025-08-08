// frontend/src/features/purchasing/pages/EditPurchaseOrderPage.js

/**
 * @file Página contenedora para la edición de una Orden de Compra existente.
 * @description Orquesta el flujo de edición: obtiene todos los datos necesarios (la orden,
 * proveedores, productos), los pasa al formulario y maneja la lógica de actualización.
 */

// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Container, Paper, Box, CircularProgress, Typography, Alert } from '@mui/material';

import PurchaseOrderForm from '../components/PurchaseOrderForm';
import { getPurchaseOrderByIdAPI, updatePurchaseOrderAPI } from '../api/purchasingAPI';
import { getSuppliersAPI } from '../../crm/api/suppliersAPI';
import { getProductsAPI } from '../../inventory/api/productsAPI';
import { formatApiError } from '../../../utils/errorUtils';
import PageHeader from '../../../components/common/PageHeader';

// SECCIÓN 2: LÓGICA DE TRANSFORMACIÓN DE DATOS
const prepareUpdatePayload = (formValues) => {
    return {
        expected_delivery_date: formValues.expected_delivery_date 
            ? formValues.expected_delivery_date.toISOString() 
            : null,
        notes: formValues.notes,
        items: formValues.items.map(item => ({
            product_id: item.product?._id || item.product_id,
            quantity_ordered: Number(item.quantity_ordered) || 0,
            unit_cost: Number(item.unit_cost) || 0,
        })),
    };
};

// SECCIÓN 3: COMPONENTE PRINCIPAL
const EditPurchaseOrderPage = () => {
    // Sub-sección 3.1: Hooks y Estado
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // Sub-sección 3.2: Obtención de Datos en Paralelo con `useQueries`
    const results = useQueries({
        queries: [
            {
                queryKey: ['purchaseOrder', orderId],
                queryFn: () => getPurchaseOrderByIdAPI(orderId),
                enabled: !!orderId,
            },
            {
                queryKey: ['suppliersListForForm'],
                queryFn: () => getSuppliersAPI({ page: 1, page_size: 1000 }),
                select: (data) => data.items || [],
                staleTime: 5 * 60 * 1000, // Cache de 5 minutos
            },
            {
                queryKey: ['productsListForForm'],
                queryFn: () => getProductsAPI({ page: 1, page_size: 1000 }),
                select: (data) => data.items || [],
                staleTime: 5 * 60 * 1000, // Cache de 5 minutos
            },
        ],
    });

    const [orderQuery, suppliersQuery, productsQuery] = results;

    // Se considera que está cargando si CUALQUIERA de las queries está en estado de carga.
    const isLoading = results.some(query => query.isLoading);
    const isError = results.some(query => query.isError);
    const error = orderQuery.error || suppliersQuery.error || productsQuery.error;
    
    // Sub-sección 3.3: Lógica de Mutación (Actualización)
    const { mutate: updatePurchaseOrder, isPending: isUpdating } = useMutation({
        mutationFn: (payload) => updatePurchaseOrderAPI(orderId, payload),
        onSuccess: (data) => {
            // CORRECCIÓN: Se accede a `data.order_number` de forma segura.
            enqueueSnackbar(`Orden de Compra ${data?.order_number || ''} actualizada exitosamente.`, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
            queryClient.invalidateQueries({ queryKey: ['purchaseOrder', orderId] });
            navigate('/compras/ordenes');
        },
        onError: (err) => {
            console.error("Error al actualizar la orden de compra:", err.response || err);
            enqueueSnackbar(formatApiError(err), { variant: 'error', persist: true });
        },
    });

    // Sub-sección 3.4: Manejador de Envío
    const handleUpdatePurchaseOrder = useCallback((formValues) => {
        const payload = prepareUpdatePayload(formValues);
        updatePurchaseOrder(payload);
    }, [updatePurchaseOrder]);
    
    // Sub-sección 3.5: Renderizado de Estados
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
        return <Container maxWidth="md" sx={{ mt: 4 }}><Alert severity="error">{`Error al cargar los datos: ${error.message}`}</Alert></Container>;
    }
    
    // Sub-sección 3.6: Renderizado Principal
    return (
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
                <PageHeader
                    title={`Editar Orden de Compra: ${orderQuery.data?.order_number || ''}`}
                    subtitle="Modifique los detalles de la solicitud de compra."
                    showAddButton={false}
                />
                <Box mt={3}>
                    {/* Se renderiza el formulario solo cuando todos los datos necesarios están listos. */}
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