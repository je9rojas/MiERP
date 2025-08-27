// File: /frontend/src/features/purchasing/pages/PurchaseBillListPage.js

/**
 * @file Página contenedora para listar y gestionar las Facturas de Compra.
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
import PropTypes from 'prop-types';
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
        queryKey: ['purchaseBills', paginationModel, debouncedSearchTerm],
        queryFn: () => getPurchaseBillsAPI({
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

    const flattenedBills = useMemo(() => {
        if (!apiResponse?.items) {
            return [];
        }
        return apiResponse.items.map(bill => ({
            ...bill,
            supplier_name: bill.supplier?.business_name || 'N/A',
            purchase_order_number: bill.purchase_order?.order_number || 'N/A',
        }));
    }, [apiResponse]);

    // --------------------------------------------------------------------------
    // Sub-sección 2.4: Manejadores de Eventos
    // --------------------------------------------------------------------------
    
    const handleViewDetails = useCallback((billId) => {
        navigate(`/compras/facturas/${billId}`);
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
                title="Gestión de Facturas de Compra"
                subtitle="Consulte todas las facturas de proveedor registradas en el sistema."
                showAddButton={false}
            />
            
            <Paper sx={{ height: 700, width: '100%', mt: 3, borderRadius: 2, boxShadow: 3 }}>
                {isError && (
                    <Alert severity="error" sx={{ m: 2 }}>
                        {`Error al cargar las facturas de compra: ${formatApiError(error)}`}
                    </Alert>
                )}
                
                <PurchaseBillDataGrid
                    bills={flattenedBills}
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

PurchaseBillListPage.propTypes = {}; // No props are passed down to this component directly

export default PurchaseBillListPage;