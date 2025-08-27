// File: /frontend/src/features/sales/pages/SalesOrderListPage.js

/**
 * @file Página contenedora para listar, buscar y gestionar las Órdenes de Venta.
 *
 * Este componente actúa como el "cerebro" de la página, orquestando la
 * obtención de datos desde la API, gestionando el estado de la interfaz de
 * usuario y preparando los datos para los componentes de presentación.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Container, Paper, Alert } from '@mui/material';

import { getSalesOrdersAPI } from '../api/salesAPI';
import useDebounce from '../../../hooks/useDebounce';
import SalesOrderDataGrid from '../components/SalesOrderDataGrid';
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const SalesOrderListPage = () => {
    // --------------------------------------------------------------------------
    // Sub-sección 2.1: Hooks y Gestión de Estado
    // --------------------------------------------------------------------------
    
    const navigate = useNavigate();
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // --------------------------------------------------------------------------
    // Sub-sección 2.2: Lógica de Obtención de Datos
    // --------------------------------------------------------------------------
    
    const {
        data: apiResponse,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: ['salesOrders', paginationModel, debouncedSearchTerm],
        queryFn: () => getSalesOrdersAPI({
            page: paginationModel.page + 1,
            pageSize: paginationModel.pageSize,
            search: debouncedSearchTerm,
        }),
        placeholderData: (previousData) => previousData,
        staleTime: 30000,
    });

    // --------------------------------------------------------------------------
    // Sub-sección 2.3: Preparación y Aplanamiento de Datos para la UI
    // --------------------------------------------------------------------------
    
    const flattenedOrders = useMemo(() => {
        if (!apiResponse?.items) {
            return [];
        }
        return apiResponse.items.map(order => ({
            ...order,
            customer_name: order.customer?.business_name || 'Cliente no encontrado',
        }));
    }, [apiResponse]);


    // --------------------------------------------------------------------------
    // Sub-sección 2.4: Manejadores de Eventos
    // --------------------------------------------------------------------------
    
    const handleAddNewOrder = useCallback(() => {
        navigate('/ventas/ordenes/nueva');
    }, [navigate]);

    const handleViewOrderDetails = useCallback((orderId) => {
        navigate(`/ventas/ordenes/${orderId}`);
    }, [navigate]);
    
    const handleCreateShipment = useCallback((orderId) => {
        navigate(`/ventas/ordenes/${orderId}/despachar`);
    }, [navigate]);

    const handleSearchChange = useCallback((event) => {
        setSearchTerm(event.target.value);
    }, []);

    // --------------------------------------------------------------------------
    // Sub-sección 2.5: Renderizado de la Interfaz de Usuario
    // --------------------------------------------------------------------------
    
    return (
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <PageHeader
                title="Gestión de Órdenes de Venta"
                subtitle="Cree, confirme y gestione los despachos de las órdenes de sus clientes."
                addButtonText="Nueva Orden de Venta"
                onAddClick={handleAddNewOrder}
            />
            
            <Paper sx={{ height: 700, width: '100%', mt: 3, borderRadius: 2, boxShadow: 3 }}>
                {isError && (
                    <Alert severity="error" sx={{ m: 2 }}>
                        {`Error al cargar las órdenes de venta: ${formatApiError(error)}`}
                    </Alert>
                )}
                
                <SalesOrderDataGrid
                    orders={flattenedOrders}
                    rowCount={apiResponse?.total_count || 0}
                    isLoading={isLoading}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    onViewOrderDetails={handleViewOrderDetails}
                    onCreateShipment={handleCreateShipment}
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                />
            </Paper>
        </Container>
    );
};

export default SalesOrderListPage;