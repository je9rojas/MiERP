// frontend/src/features/purchasing/pages/PurchaseOrderListPage.js

/**
 * @file Página contenedora para listar y gestionar las Órdenes de Compra.
 *
 * Este componente actúa como el "cerebro" de la página, orquestando la
 * obtención de datos desde la API y gestionando el estado de la interfaz de
 * usuario. Utiliza React Query para una gestión de datos eficiente y declarativa,
 * implementando paginación y búsqueda del lado del servidor.
 */

// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Container, Paper, Alert } from '@mui/material';

import { getPurchaseOrdersAPI } from '../api/purchasingAPI';
import useDebounce from '../../../hooks/useDebounce';
import PurchaseOrderDataGrid from '../components/PurchaseOrderDataGrid';
import PageHeader from '../../../components/common/PageHeader';

// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
const PurchaseOrderListPage = () => {
    // Sub-sección 2.1: Hooks y Estado
    const navigate = useNavigate();
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Sub-sección 2.2: Lógica de Obtención de Datos con React Query
    const {
        data,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: ['purchaseOrders', paginationModel, debouncedSearchTerm],
        queryFn: () => getPurchaseOrdersAPI({
            page: paginationModel.page + 1,
            pageSize: paginationModel.pageSize,
            search: debouncedSearchTerm,
        }),
        placeholderData: (previousData) => previousData,
        staleTime: 5000,
    });

    // Sub-sección 2.3: Manejadores de Eventos
    const handleAddOrder = useCallback(() => {
        navigate('/compras/ordenes/nueva');
    }, [navigate]);

    const handleEditOrder = useCallback((orderId) => {
        // En el futuro, podrías tener una página de solo vista y otra de edición.
        navigate(`/compras/ordenes/editar/${orderId}`);
    }, [navigate]);

    // Sub-sección 2.4: Renderizado de la UI
    return (
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <PageHeader
                title="Gestión de Órdenes de Compra"
                subtitle="Cree y administre las órdenes de compra para sus proveedores."
                addButtonText="Nueva Orden de Compra"
                onAddClick={handleAddOrder}
            />
            
            <Paper sx={{ p: 0, borderRadius: 2, boxShadow: 3, overflow: 'hidden' }}>
                {isError && (
                    <Alert severity="error" sx={{ m: 2 }}>
                        {`Error al cargar las órdenes de compra: ${error.message}`}
                    </Alert>
                )}
                
                <PurchaseOrderDataGrid
                    orders={data?.items || []}
                    rowCount={data?.total_count || 0}
                    isLoading={isLoading}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    // --- CORRECCIÓN: Se pasa la prop con el nombre correcto 'onEditOrder'. ---
                    onEditOrder={handleEditOrder}
                    searchTerm={searchTerm}
                    onSearchChange={(event) => setSearchTerm(event.target.value)}
                />
            </Paper>
        </Container>
    );
};

export default PurchaseOrderListPage;