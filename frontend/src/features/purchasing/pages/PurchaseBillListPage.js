// frontend/src/features/purchasing/pages/PurchaseBillListPage.js

/**
 * @file Página contenedora para listar y gestionar las Facturas de Compra.
 *
 * Este componente actúa como el "cerebro" de la página, orquestando la
 * obtención de datos desde la API y gestionando el estado de la interfaz de
 * usuario. Utiliza React Query para una gestión de datos eficiente y declarativa.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
// ==============================================================================

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Container, Paper, Alert } from '@mui/material';

import { getPurchaseBillsAPI } from '../api/purchasingAPI';
import useDebounce from '../../../hooks/useDebounce';
import PurchaseBillDataGrid from '../components/PurchaseBillDataGrid';
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const PurchaseBillListPage = () => {
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
        queryKey: ['purchaseBills', paginationModel, debouncedSearchTerm],
        queryFn: () => getPurchaseBillsAPI({
            page: paginationModel.page + 1,
            pageSize: paginationModel.pageSize,
            search: debouncedSearchTerm,
        }),
        placeholderData: (previousData) => previousData,
        staleTime: 5000,
    });

    // Sub-sección 2.3: Manejadores de Eventos (Callbacks)
    const handleViewDetails = useCallback((billId) => {
        // CORRECCIÓN: Se activa la navegación a la página de detalles de la factura.
        navigate(`/compras/facturas/${billId}`);
    }, [navigate]);

    // Sub-sección 2.4: Renderizado de la Interfaz de Usuario
    return (
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <PageHeader
                title="Gestión de Facturas de Compra"
                subtitle="Consulte todas las facturas y recepciones de mercancía registradas en el sistema."
                showAddButton={false}
            />
            
            <Paper sx={{
                height: 700,
                width: '100%',
                borderRadius: 2,
                boxShadow: 3,
            }}>
                {isError && (
                    <Alert severity="error" sx={{ m: 2 }}>
                        {`Error al cargar las facturas de compra: ${formatApiError(error)}`}
                    </Alert>
                )}
                
                <PurchaseBillDataGrid
                    bills={data?.items || []}
                    rowCount={data?.total_count || 0}
                    isLoading={isLoading}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    onViewDetails={handleViewDetails}
                    searchTerm={searchTerm}
                    onSearchChange={(event) => setSearchTerm(event.target.value)}
                />
            </Paper>
        </Container>
    );
};

export default PurchaseBillListPage;