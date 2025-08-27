// File: /frontend/src/features/purchasing/pages/GoodsReceiptListPage.js

/**
 * @file Página contenedora para listar y gestionar las Recepciones de Mercancía.
 *
 * Este componente actúa como el "cerebro" de la página, orquestando la
 * obtención de datos desde la API, gestionando el estado de la interfaz de
 * usuario, preparando los datos para la tabla y manejando la navegación.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PropTypes from 'prop-types';
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
    // --------------------------------------------------------------------------
    // Sub-sección 2.1: Hooks y Gestión de Estado
    // --------------------------------------------------------------------------
    
    const navigate = useNavigate();
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
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
        queryKey: ['goodsReceipts', paginationModel, debouncedSearchTerm],
        queryFn: () => getGoodsReceiptsAPI({
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

    const flattenedReceipts = useMemo(() => {
        if (!apiResponse?.items) {
            return [];
        }
        return apiResponse.items.map(receipt => ({
            ...receipt,
            supplier_name: receipt.supplier?.business_name || 'N/A',
            purchase_order_number: receipt.purchase_order?.order_number || 'N/A',
        }));
    }, [apiResponse]);

    // --------------------------------------------------------------------------
    // Sub-sección 2.4: Manejadores de Eventos
    // --------------------------------------------------------------------------
    
    const handleViewDetails = useCallback((receiptId) => {
        navigate(`/compras/recepciones/${receiptId}`);
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
                title="Gestión de Recepciones de Mercancía"
                subtitle="Consulte todas las entradas de mercancía física al inventario."
                showAddButton={false}
            />
            
            <Paper sx={{ height: 700, width: '100%', mt: 3, borderRadius: 2, boxShadow: 3 }}>
                {isError && (
                    <Alert severity="error" sx={{ m: 2 }}>
                        {`Error al cargar las recepciones: ${formatApiError(error)}`}
                    </Alert>
                )}
                
                <GoodsReceiptDataGrid
                    receipts={flattenedReceipts}
                    rowCount={apiResponse?.total_count || 0}
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

GoodsReceiptListPage.propTypes = {}; // No props are passed down to this component directly

export default GoodsReceiptListPage;