// frontend/src/features/purchasing/pages/NewPurchaseOrderPage.js

/**
 * @file Página contenedora para crear una nueva Orden de Compra.
 *
 * @description Este componente orquesta el flujo de creación de una OC. Sus responsabilidades son:
 * 1. Renderizar el componente de formulario de presentación (`PurchaseOrderForm`).
 * 2. Manejar la lógica de envío (mutación) al interactuar con el usuario.
 * 3. Delegar la transformación del payload del formulario a la capa de mappers,
 *    manteniendo así una clara separación de concerns.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Container, Paper, Box } from '@mui/material';

// API, Componentes y Mappers
import PurchaseOrderForm from '../components/PurchaseOrderForm';
import { createPurchaseOrderAPI } from '../api/purchasingAPI';
import { getSuppliersAPI } from '../../crm/api/suppliersAPI';
import { getProductsAPI } from '../../inventory/api/productsAPI';
import { mapFormValuesToCreatePayload } from '../mappers/purchaseOrderMappers';
import { formatApiError } from '../../../utils/errorUtils';
import PageHeader from '../../../components/common/PageHeader';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const NewPurchaseOrderPage = () => {
    // Sub-sección 2.1: Hooks y Estado
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // Sub-sección 2.2: Lógica de Obtención de Datos para Opciones del Formulario
    // Se necesita cargar proveedores y productos para los Autocompletes del formulario.
    const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery({
        queryKey: ['suppliersListForForm'],
        queryFn: () => getSuppliersAPI({ page: 1, pageSize: 1000 }),
        select: (data) => data.items || [],
        staleTime: 5 * 60 * 1000,
    });

    const { data: products, isLoading: isLoadingProducts } = useQuery({
        queryKey: ['productsListForForm'],
        queryFn: () => getProductsAPI({ page: 1, pageSize: 1000 }),
        select: (data) => data.items || [],
        staleTime: 5 * 60 * 1000,
    });

    // Sub-sección 2.3: Lógica de Modificación de Datos (Mutation)
    const { mutate: createPurchaseOrder, isPending: isSubmitting } = useMutation({
        mutationFn: createPurchaseOrderAPI,
        onSuccess: (data) => {
            enqueueSnackbar(`Orden de Compra ${data.order_number} creada exitosamente.`, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
            navigate('/compras/ordenes');
        },
        onError: (error) => {
            enqueueSnackbar(formatApiError(error), { variant: 'error', persist: true });
        },
    });

    // Sub-sección 2.4: Manejador de Eventos (Callback)
    const handleCreatePurchaseOrder = useCallback((formValues) => {
        // La lógica de transformación del payload se delega completamente al mapper.
        const payload = mapFormValuesToCreatePayload(formValues);
        createPurchaseOrder(payload);
    }, [createPurchaseOrder]);

    // Sub-sección 2.5: Renderizado de la Interfaz de Usuario
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
                        suppliersOptions={suppliers || []}
                        productsOptions={products || []}
                        isLoadingSuppliers={isLoadingSuppliers}
                        isLoadingProducts={isLoadingProducts}
                    />
                </Box>
            </Paper>
        </Container>
    );
};

export default NewPurchaseOrderPage;