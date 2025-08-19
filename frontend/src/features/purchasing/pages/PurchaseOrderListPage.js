// frontend/src/features/purchasing/pages/PurchaseOrderListPage.js

/**
 * @file Página contenedora para listar y gestionar las Órdenes de Compra.
 *
 * Este componente actúa como el "cerebro" de la página, orquestando la
 * obtención de datos desde la API y gestionando el estado de la interfaz de
 * usuario. Utiliza React Query para una gestión de datos eficiente,
 * implementando paginación, búsqueda y mutaciones para actualizar el estado
 * de las órdenes.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Paper, Alert } from '@mui/material';

import { getPurchaseOrdersAPI, updatePurchaseOrderStatusAPI } from '../api/purchasingAPI';
import useDebounce from '../../../hooks/useDebounce';
import PurchaseOrderDataGrid from '../components/PurchaseOrderDataGrid';
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
// import { useSnackbar } from 'notistack'; // Descomentar para usar notificaciones avanzadas

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const PurchaseOrderListPage = () => {
    // Sub-sección 2.1: Hooks y Estado
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    // const { enqueueSnackbar } = useSnackbar();
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [confirmationDialog, setConfirmationDialog] = useState({ isOpen: false, title: '', content: '', onConfirm: () => {} });

    // Sub-sección 2.2: Lógica de Obtención de Datos con React Query
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['purchaseOrders', paginationModel, debouncedSearchTerm],
        queryFn: () => getPurchaseOrdersAPI({
            page: paginationModel.page + 1,
            pageSize: paginationModel.pageSize,
            search: debouncedSearchTerm,
        }),
        placeholderData: (previousData) => previousData,
        staleTime: 30000,
    });

    // Sub-sección 2.3: Lógica de Mutación de Datos (Actualización de Estado)
    const { mutate: updateOrderStatus, isPending: isUpdatingStatus } = useMutation({
        mutationFn: ({ orderId, newStatus }) => updatePurchaseOrderStatusAPI(orderId, newStatus),
        onSuccess: (updatedOrder) => {
            // enqueueSnackbar(`Orden de Compra #${updatedOrder.order_number} confirmada.`, { variant: 'success' });
            alert(`Orden de Compra #${updatedOrder.order_number} confirmada exitosamente.`);
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
        },
        onError: (mutationError) => {
            const errorMessage = formatApiError(mutationError);
            // enqueueSnackbar(`Error al confirmar la orden: ${errorMessage}`, { variant: 'error' });
            alert(`Error al confirmar la orden: ${errorMessage}`);
        },
        onSettled: () => {
            setConfirmationDialog({ isOpen: false, title: '', content: '', onConfirm: () => {} });
        }
    });

    // Sub-sección 2.4: Manejadores de Eventos (Callbacks)
    const handleAddOrder = useCallback(() => {
        navigate('/compras/ordenes/nueva');
    }, [navigate]);

    const handleEditOrder = useCallback((orderId) => {
        navigate(`/compras/ordenes/editar/${orderId}`);
    }, [navigate]);

    const handleRegisterReceipt = useCallback((orderId) => {
        navigate(`/compras/ordenes/${orderId}/recepciones/nueva`);
    }, [navigate]);
    
    // --- NUEVO MANEJADOR ---
    // Navega a la página de creación de facturas, pasando el ID de la orden de compra.
    const handleRegisterBill = useCallback((orderId) => {
        navigate(`/compras/ordenes/${orderId}/facturar`);
    }, [navigate]);

    const handleConfirmOrder = useCallback((order) => {
        setConfirmationDialog({
            isOpen: true,
            title: 'Confirmar Orden de Compra',
            content: `¿Está seguro de que desea confirmar la Orden de Compra #${order.order_number}? Esta acción no se puede deshacer.`,
            onConfirm: () => updateOrderStatus({ orderId: order.id, newStatus: 'confirmed' })
        });
    }, [updateOrderStatus]);

    // Sub-sección 2.5: Renderizado de la Interfaz de Usuario
    return (
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <PageHeader
                title="Gestión de Órdenes de Compra"
                subtitle="Cree, confirme, reciba y facture las órdenes de compra para sus proveedores."
                addButtonText="Nueva Orden de Compra"
                onAddClick={handleAddOrder}
            />
            
            <Paper sx={{ height: 700, width: '100%', borderRadius: 2, boxShadow: 3 }}>
                {isError && (
                    <Alert severity="error" sx={{ m: 2 }}>
                        {`Error al cargar las órdenes de compra: ${formatApiError(error)}`}
                    </Alert>
                )}
                
                <PurchaseOrderDataGrid
                    orders={data?.items || []}
                    rowCount={data?.total_count || 0}
                    isLoading={isLoading || isUpdatingStatus}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    onEditOrder={handleEditOrder}
                    onConfirmOrder={handleConfirmOrder}
                    onRegisterReceipt={handleRegisterReceipt}
                    onRegisterBill={handleRegisterBill} // <- Se pasa la nueva prop
                    searchTerm={searchTerm}
                    onSearchChange={(event) => setSearchTerm(event.target.value)}
                />
            </Paper>

            <ConfirmationDialog
                isOpen={confirmationDialog.isOpen}
                onClose={() => setConfirmationDialog({ ...confirmationDialog, isOpen: false })}
                onConfirm={confirmationDialog.onConfirm}
                title={confirmationDialog.title}
                content={confirmationDialog.content}
                isLoading={isUpdatingStatus}
            />
        </Container>
    );
};

export default PurchaseOrderListPage;