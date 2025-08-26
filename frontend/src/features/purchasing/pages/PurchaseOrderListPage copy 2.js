// /frontend/src/features/purchasing/pages/PurchaseOrderListPage.js

/**
 * @file Página contenedora para listar y gestionar las Órdenes de Compra.
 * ...
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState, useCallback, useEffect } from 'react'; // Se añade useEffect
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Paper, Alert } from '@mui/material';

import { getPurchaseOrdersAPI, updatePurchaseOrderStatusAPI } from '../api/purchasingAPI';
import useDebounce from '../../../hooks/useDebounce';
import PurchaseOrderDataGrid from '../components/PurchaseOrderDataGrid';
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const PurchaseOrderListPage = () => {
    // ... (hooks y estado existentes)
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [confirmationDialog, setConfirmationDialog] = useState({ isOpen: false, title: '', content: '', onConfirm: () => {} });

    // ... (lógica de obtención de datos existente)
    const { data, isLoading, isError, error, isSuccess } = useQuery({ // Se añade isSuccess
        queryKey: ['purchaseOrders', paginationModel, debouncedSearchTerm],
        queryFn: () => getPurchaseOrdersAPI({
            page: paginationModel.page + 1,
            pageSize: paginationModel.pageSize,
            search: debouncedSearchTerm,
        }),
        placeholderData: (previousData) => previousData,
        staleTime: 30000,
    });
    
    // --- INICIO DE LOGS DE DEPURACIÓN ---
    useEffect(() => {
        if (isSuccess && data) {
            console.log("[DEBUG_LIST_PAGE] Datos recibidos de useQuery:", data);
            if (data.items && data.items.length > 0) {
                console.log("[DEBUG_LIST_PAGE] Primera orden en los datos:", data.items[0]);
                console.log("[DEBUG_LIST_PAGE] Objeto 'supplier' en la primera orden:", data.items[0].supplier);
            }
        }
    }, [data, isSuccess]);
    // --- FIN DE LOGS DE DEPURACIÓN ---


    // ... (lógica de mutación existente)
    const { mutate: updateOrderStatus, isPending: isUpdatingStatus } = useMutation({
        mutationFn: ({ orderId, newStatus }) => updatePurchaseOrderStatusAPI(orderId, newStatus),
        onSuccess: (updatedOrder) => {
            alert(`Orden de Compra #${updatedOrder.order_number} confirmada exitosamente.`);
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
        },
        onError: (mutationError) => {
            const errorMessage = formatApiError(mutationError);
            alert(`Error al confirmar la orden: ${errorMessage}`);
        },
        onSettled: () => {
            setConfirmationDialog({ isOpen: false, title: '', content: '', onConfirm: () => {} });
        }
    });

    // ... (manejadores de eventos existentes)
    const handleAddOrder = useCallback(() => navigate('/compras/ordenes/nueva'), [navigate]);
    const handleEditOrder = useCallback((orderId) => navigate(`/compras/ordenes/editar/${orderId}`), [navigate]);
    const handleRegisterReceipt = useCallback((orderId) => navigate(`/compras/ordenes/${orderId}/recepciones/nueva`), [navigate]);
    const handleRegisterBill = useCallback((orderId) => navigate(`/compras/ordenes/${orderId}/facturar`), [navigate]);
    const handleConfirmOrder = useCallback((order) => {
        setConfirmationDialog({
            isOpen: true,
            title: 'Confirmar Orden de Compra',
            content: `¿Está seguro de que desea confirmar la Orden de Compra #${order.order_number}? Esta acción no se puede deshacer.`,
            onConfirm: () => updateOrderStatus({ orderId: order.id, newStatus: 'confirmed' })
        });
    }, [updateOrderStatus]);

    // ... (renderizado existente)
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
                    onRegisterBill={handleRegisterBill}
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