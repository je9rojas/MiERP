// File: /frontend/src/features/purchasing/pages/PurchaseOrderListPage.js

/**
 * @file purchasing/pages/PurchaseOrderListPage.js
 * @description Página contenedora para listar y gestionar las Órdenes de Compra.
 *
 * Este componente actúa como el "cerebro" (Container Component) de la página.
 * Su responsabilidad principal es orquestar la obtención de datos desde la API,
 * gestionar el estado local (paginación, búsqueda, diálogos), y transformar
 * los datos en un formato adecuado para los componentes de presentación.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState, useCallback, useMemo } from 'react';
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
    // --------------------------------------------------------------------------
    // Sub-sección 2.1: Inicialización de Hooks y Estado Local
    // --------------------------------------------------------------------------

    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [confirmationDialog, setConfirmationDialog] = useState({
        isOpen: false,
        title: '',
        content: '',
        onConfirm: () => {},
    });

    // --------------------------------------------------------------------------
    // Sub-sección 2.2: Lógica de Obtención de Datos
    // --------------------------------------------------------------------------

    const { data: apiResponse, isLoading, isError, error } = useQuery({
        queryKey: ['purchaseOrders', paginationModel, debouncedSearchTerm],
        queryFn: () => getPurchaseOrdersAPI({
            page: paginationModel.page + 1,
            pageSize: paginationModel.pageSize,
            search: debouncedSearchTerm,
        }),
        placeholderData: (previousData) => previousData,
        staleTime: 30000,
    });

    // --------------------------------------------------------------------------
    // Sub-sección 2.3: Transformación y Preparación de Datos
    // --------------------------------------------------------------------------

    const flattenedOrders = useMemo(() => {
        if (!apiResponse?.items) {
            return [];
        }
        return apiResponse.items.map(order => ({
            ...order,
            supplier_name: order.supplier?.business_name || 'No Asignado',
            order_date: order.order_date ? new Date(order.order_date) : null,
        }));
    }, [apiResponse]);

    // --------------------------------------------------------------------------
    // Sub-sección 2.4: Lógica de Mutación de Datos
    // --------------------------------------------------------------------------

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

    // --------------------------------------------------------------------------
    // Sub-sección 2.5: Manejadores de Eventos
    // --------------------------------------------------------------------------

    const handleAddOrder = useCallback(() => {
        navigate('/compras/ordenes/nueva');
    }, [navigate]);

    const handleEditOrder = useCallback((orderId) => {
        navigate(`/compras/ordenes/${orderId}`);
    }, [navigate]);

    const handleRegisterReceipt = useCallback((orderId) => {
        navigate(`/compras/ordenes/${orderId}/recepciones/nueva`);
    }, [navigate]);

    const handleRegisterBill = useCallback((orderId) => {
        navigate(`/compras/ordenes/${orderId}/facturar`);
    }, [navigate]);

    const handleConfirmOrder = useCallback((order) => {
        setConfirmationDialog({
            isOpen: true,
            title: 'Confirmar Orden de Compra',
            content: `¿Está seguro de que desea confirmar la Orden de Compra #${order.order_number}? Esta acción no se puede deshacer.`,
            onConfirm: () => updateOrderStatus({ orderId: order.id, newStatus: 'confirmed' }),
        });
    }, [updateOrderStatus]);

    const handleSearchChange = useCallback((event) => {
        setSearchTerm(event.target.value);
    }, []);

    // --------------------------------------------------------------------------
    // Sub-sección 2.6: Renderizado de la Interfaz de Usuario
    // --------------------------------------------------------------------------

    return (
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <PageHeader
                title="Gestión de Órdenes de Compra"
                subtitle="Cree, confirme, reciba y facture las órdenes de compra para sus proveedores."
                addButtonText="Nueva Orden de Compra"
                onAddClick={handleAddOrder}
            />

            <Paper 
                sx={{ 
                    height: 700, 
                    width: '100%', 
                    mt: 3, 
                    borderRadius: 2, 
                    boxShadow: 3,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {isError && (
                    <Alert severity="error" sx={{ m: 2, flexShrink: 0 }}>
                        {`Error al cargar las órdenes de compra: ${formatApiError(error)}`}
                    </Alert>
                )}

                <PurchaseOrderDataGrid
                    orders={flattenedOrders}
                    rowCount={apiResponse?.total_count || 0}
                    isLoading={isLoading || isUpdatingStatus}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    onEditOrder={handleEditOrder}
                    onConfirmOrder={handleConfirmOrder}
                    onRegisterReceipt={handleRegisterReceipt}
                    onRegisterBill={handleRegisterBill}
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
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