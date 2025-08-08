// frontend/src/features/purchasing/pages/NewPurchaseOrderPage.js

/**
 * @file Página contenedora para crear una nueva Orden de Compra.
 * Se encarga de la lógica de alto nivel como la comunicación con la API
 * para crear la orden, manejar notificaciones y la navegación.
 */

// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Paper, Box } from '@mui/material';

import PurchaseOrderForm from '../components/PurchaseOrderForm';
import { createPurchaseOrderAPI } from '../api/purchasingAPI';
import { formatApiError } from '../../../utils/errorUtils';
import PageHeader from '../../../components/common/PageHeader';

// SECCIÓN 2: COMPONENTE PRINCIPAL
const NewPurchaseOrderPage = () => {
    // Sub-sección 2.1: Hooks y Estado
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // Sub-sección 2.2: Lógica de Mutación (react-query)
    const { mutate: createPurchaseOrder, isPending: isSubmitting } = useMutation({
        mutationFn: createPurchaseOrderAPI,
        onSuccess: (data) => {
            enqueueSnackbar(`Orden de Compra ${data.order_number} creada exitosamente.`, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
            
            // --- CORRECCIÓN: La URL de navegación ahora apunta a la ruta correcta. ---
            navigate('/compras/ordenes');
        },
        onError: (error) => {
            console.error("Error al crear la orden de compra:", error.response || error);
            enqueueSnackbar(formatApiError(error), { variant: 'error', persist: true });
        },
    });

    // Sub-sección 2.3: Manejador de Envío
    const handleCreatePurchaseOrder = useCallback((formValues) => {
        const payload = {
            supplier_id: formValues.supplier?._id,
            order_date: formValues.order_date.toISOString(),
            expected_delivery_date: formValues.expected_delivery_date 
                ? formValues.expected_delivery_date.toISOString() 
                : null,
            notes: formValues.notes,
            items: formValues.items.map(item => ({
                product_id: item.product?._id,
                quantity_ordered: Number(item.quantity_ordered) || 0,
                unit_cost: Number(item.unit_cost) || 0,
            })),
        };

        createPurchaseOrder(payload);

    }, [createPurchaseOrder]);

    // Sub-sección 2.4: Renderizado de la UI
    return (
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
                <PageHeader
                    title="Registrar Nueva Orden de Compra"
                    subtitle="Complete los detalles para crear una nueva solicitud de compra a un proveedor."
                    showAddButton={false}
                />
                <Box mt={3}>
                    <PurchaseOrderForm
                        onSubmit={handleCreatePurchaseOrder}
                        isSubmitting={isSubmitting}
                    />
                </Box>
            </Paper>
        </Container>
    );
};

export default NewPurchaseOrderPage;