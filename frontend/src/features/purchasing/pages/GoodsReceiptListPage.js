// frontend/src/features/purchasing/pages/GoodsReceiptListPage.js

/**
 * @file Página contenedora para listar y gestionar las Recepciones de Mercancía.
 *
 * Este componente actúa como el "cerebro" de la página, orquestando la
 * obtención de datos desde la API y gestionando el estado de la interfaz de
 * usuario (paginación, búsqueda).
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
// ==============================================================================

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Container, Paper, Alert } from '@mui/material';

import { getGoodsReceiptsAPI } from '../api/purchasingAPI';
import useDebounce from '../../../hooks/useDebounce';
import GoodsReceiptDataGrid from '../components/GoodsReceiptDataGrid';
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const GoodsReceiptListPage = () => {
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
        queryKey: ['goodsReceipts', paginationModel, debouncedSearchTerm],
        queryFn: () => getGoodsReceiptsAPI({
            page: paginationModel.page + 1,
            pageSize: paginationModel.pageSize,
            search: debouncedSearchTerm,
        }),
        placeholderData: (previousData) => previousData,
        staleTime: 5000,
    });

    // Sub-sección 2.3: Manejadores de Eventos (Callbacks)
    const handleViewDetails = useCallback((receiptId) => {
        navigate(`/compras/recepciones/${receiptId}`);
    }, [navigate]);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    };

    // Sub-sección 2.4: Renderizado de la Interfaz de Usuario
    return (
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <PageHeader
                title="Gestión de Recepciones de Mercancía"
                subtitle="Consulte todas las entradas de mercancía física al inventario."
                showAddButton={false} // Las recepciones se crean desde las Órdenes de Compra
            />
            
            <Paper sx={{
                height: 700,
                width: '100%',
                borderRadius: 2,
                boxShadow: 3,
            }}>
                {isError && (
                    <Alert severity="error" sx={{ m: 2 }}>
                        {`Error al cargar las recepciones: ${formatApiError(error)}`}
                    </Alert>
                )}
                
                <GoodsReceiptDataGrid
                    receipts={data?.items || []}
                    rowCount={data?.total_count || 0}
                    isLoading={isLoading}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    onViewDetails={handleViewDetails}
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                />
            </Paper>
        </Container>
    );
};

export default GoodsReceiptListPage;