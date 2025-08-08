// /frontend/src/features/purchasing/pages/PurchaseOrderListPage.js

/**
 * @file Página contenedora para listar y gestionar las Órdenes de Compra.
 *
 * Este componente actúa como el "cerebro" de la página, orquestando la
 * obtención de datos desde la API y gestionando el estado de la interfaz de
 * usuario. Utiliza React Query para una gestión de datos eficiente y declarativa,
 * implementando paginación y búsqueda del lado del servidor.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Container, Paper, Box, Alert } from '@mui/material';

import { getPurchaseOrdersAPI } from '../api/purchasingAPI';
import useDebounce from '../../../hooks/useDebounce';
import PurchaseOrderDataGrid from '../components/PurchaseOrderDataGrid';
import DataGridToolbar from '../../../components/common/DataGridToolbar';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const PurchaseOrderListPage = () => {
    // --- 2.1: Hooks y Gestión de Estado ---
    const navigate = useNavigate();
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // --- 2.2: Lógica de Obtención de Datos con React Query ---
    const {
        data,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: ['purchaseOrders', paginationModel.page + 1, paginationModel.pageSize, debouncedSearchTerm],
        queryFn: () => getPurchaseOrdersAPI({
            page: paginationModel.page + 1,
            pageSize: paginationModel.pageSize,
            search: debouncedSearchTerm,
        }),
        placeholderData: (previousData) => previousData,
        staleTime: 5000,
    });

    // --- 2.3: Manejadores de Eventos ---
    const handleAddOrder = () => {
        navigate('/compras/ordenes/nueva');
    };

    const handleViewOrEditOrder = (orderId) => {
        // En el futuro, podrías tener una página de solo vista y otra de edición.
        // Por ahora, asumimos que "ver" y "editar" llevan al mismo lugar.
        navigate(`/compras/ordenes/editar/${orderId}`);
    };

    // --- 2.4: Preparación de Props para Componentes Hijos ---
    const toolbarProps = {
        title: "Gestión de Órdenes de Compra",
        addButtonText: "Nueva Orden de Compra",
        onAddClick: handleAddOrder,
        searchTerm: searchTerm,
        onSearchChange: (event) => setSearchTerm(event.target.value),
        searchPlaceholder: "Buscar por N° de Orden o Proveedor..."
    };

    // --- 2.5: Renderizado de la UI ---
    return (
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <Paper sx={{ p: 0, borderRadius: 2, boxShadow: 3, overflow: 'hidden' }}>
                {isError && (
                    <Alert severity="error" sx={{ m: 2 }}>
                        Error al cargar las órdenes de compra: {error.message}
                    </Alert>
                )}
                
                <PurchaseOrderDataGrid
                    orders={data?.items || []}
                    rowCount={data?.total_count || 0}
                    isLoading={isLoading}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    onViewOrEditOrder={handleViewOrEditOrder}
                    toolbarProps={toolbarProps}
                />
            </Paper>
        </Container>
    );
};

export default PurchaseOrderListPage;