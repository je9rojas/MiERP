// /frontend/src/features/sales/pages/SalesOrderListPage.js

/**
 * @file Página contenedora para listar, buscar y gestionar las Órdenes de Venta.
 *
 * Este componente actúa como el "cerebro" de la página, orquestando la
 * obtención de datos desde la API y gestionando el estado de la interfaz de
 * usuario. Utiliza React Query para una gestión de datos eficiente y declarativa.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Container, Paper, Box, Alert } from '@mui/material';

import { getSalesOrdersAPI } from '../api/salesAPI';
import useDebounce from '../../../hooks/useDebounce';
import SalesOrderDataGrid from '../components/SalesOrderDataGrid';
import DataGridToolbar from '../../../components/common/DataGridToolbar';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const SalesOrderListPage = () => {
    // --- 2.1: Hooks y Gestión de Estado ---
    const navigate = useNavigate();
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // --- 2.2: Lógica de Obtención de Datos con React Query ---
    const {
        data,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: ['salesOrdersList', paginationModel, debouncedSearchTerm],
        queryFn: () => getSalesOrdersAPI({
            page: paginationModel.page + 1,
            page_size: paginationModel.pageSize,
            search: debouncedSearchTerm,
        }),
        placeholderData: (previousData) => previousData,
    });

    // --- 2.3: Manejadores de Eventos ---
    const handleAddNewOrder = () => {
        navigate('/ventas/ordenes/nueva');
    };

    const handleViewOrderDetails = (orderId) => {
        // En el futuro, esto navegará a la página de detalles de la orden
        navigate(`/ventas/ordenes/detalle/${orderId}`);
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setPaginationModel(prev => ({ ...prev, page: 0 }));
    };

    // --- 2.4: Preparación de Props para Componentes Hijos ---
    const toolbarProps = {
        title: "Gestión de Órdenes de Venta",
        addButtonText: "Nueva Orden de Venta",
        onAddClick: handleAddNewOrder,
        searchTerm: searchTerm,
        onSearchChange: handleSearchChange,
        searchPlaceholder: "Buscar por N° de Orden o Cliente..."
    };

    // --- 2.5: Renderizado de la UI ---
    return (
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <Paper sx={{ p: 0, borderRadius: 2, boxShadow: 3, overflow: 'hidden' }}>
                {isError && (
                    <Alert severity="error" sx={{ m: 2 }}>
                        Error al cargar las órdenes de venta: {error.message}
                    </Alert>
                )}
                
                <SalesOrderDataGrid
                    orders={data?.items || []}
                    rowCount={data?.total_count || 0}
                    isLoading={isLoading}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    onViewOrderDetails={handleViewOrderDetails}
                    toolbarProps={toolbarProps}
                />
            </Paper>
        </Container>
    );
};

export default SalesOrderListPage;