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

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Container, Paper, Alert } from '@mui/material';

import { getSalesOrdersAPI } from '../api/salesAPI';
import useDebounce from '../../../hooks/useDebounce';
import SalesOrderDataGrid from '../components/SalesOrderDataGrid';
import PageHeader from '../../../components/common/PageHeader'; // Se reemplaza DataGridToolbar por PageHeader
import { formatApiError } from '../../../utils/errorUtils';

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
        staleTime: 5000,
    });

    // --- 2.3: Manejadores de Eventos ---
    const handleAddNewOrder = useCallback(() => {
        navigate('/ventas/ordenes/nueva');
    }, [navigate]);

    const handleViewOrderDetails = useCallback((orderId) => {
        // CORRECCIÓN: Navega a la ruta de detalle/edición correcta que definimos.
        navigate(`/ventas/ordenes/${orderId}`);
    }, [navigate]);
    
    const handleCreateShipment = useCallback((orderId) => {
        // Navega a la nueva página para crear un despacho a partir de esta orden.
        navigate(`/ventas/ordenes/${orderId}/despachar`);
    }, [navigate]);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        // Resetea a la primera página con cada nueva búsqueda
        setPaginationModel(prev => ({ ...prev, page: 0 }));
    };

    // --- 2.4: Renderizado de la UI ---
    return (
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <PageHeader
                title="Gestión de Órdenes de Venta"
                subtitle="Cree, confirme y gestione los despachos de las órdenes de sus clientes."
                addButtonText="Nueva Orden de Venta"
                onAddClick={handleAddNewOrder}
            />
            
            <Paper sx={{
                height: 700,
                width: '100%',
                borderRadius: 2,
                boxShadow: 3,
            }}>
                {isError && (
                    <Alert severity="error" sx={{ m: 2 }}>
                        {`Error al cargar las órdenes de venta: ${formatApiError(error)}`}
                    </Alert>
                )}
                
                <SalesOrderDataGrid
                    orders={data?.items || []}
                    rowCount={data?.total_count || 0}
                    isLoading={isLoading}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    onViewOrderDetails={handleViewOrderDetails}
                    onCreateShipment={handleCreateShipment} // Se pasa la nueva función
                    toolbarProps={{
                        searchTerm: searchTerm,
                        onSearchChange: handleSearchChange,
                        searchPlaceholder: "Buscar por N° de Orden..."
                    }}
                />
            </Paper>
        </Container>
    );
};

export default SalesOrderListPage;