// File: /frontend/src/features/sales/pages/ShipmentListPage.js

/**
 * @file Página para listar todos los Despachos (Shipments).
 *
 * @description Este componente es responsable de:
 * 1. Obtener una lista paginada de todos los despachos desde la API.
 * 2. Aplanar y preparar los datos para la UI.
 * 3. Mostrar los datos en un componente de tabla (DataGrid).
 * 4. Gestionar los estados de carga, error, búsqueda y paginación.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Paper, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { getShipmentsAPI } from '../api/salesAPI';
import useDebounce from '../../../hooks/useDebounce';
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';
import ShipmentDataGrid from '../components/ShipmentDataGrid';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const ShipmentListPage = () => {
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
        queryKey: ['shipments', paginationModel, debouncedSearchTerm],
        queryFn: () => getShipmentsAPI({ 
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

    const flattenedShipments = useMemo(() => {
        if (!apiResponse?.items) {
            return [];
        }
        return apiResponse.items.map(shipment => ({
            ...shipment,
            customer_name: shipment.customer?.business_name || 'N/A',
            sales_order_number: shipment.sales_order?.order_number || 'N/A',
        }));
    }, [apiResponse]);

    // --------------------------------------------------------------------------
    // Sub-sección 2.4: Manejadores de Eventos
    // --------------------------------------------------------------------------
    
    const handleViewDetails = useCallback((shipmentId) => {
        // Esta navegación se habilitará cuando la página de detalles exista.
        // navigate(`/ventas/despachos/${shipmentId}`);
        console.log(`Navegar a los detalles del despacho: ${shipmentId}`);
    }, []);

    const handleSearchChange = useCallback((event) => {
        setSearchTerm(event.target.value);
    }, []);

    // --------------------------------------------------------------------------
    // Sub-sección 2.5: Renderizado de la Interfaz de Usuario
    // --------------------------------------------------------------------------

    return (
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <PageHeader
                title="Listado de Despachos"
                subtitle="Consulte todos los movimientos de salida de mercancía registrados."
                showAddButton={false}
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
                    <Alert severity="error" sx={{ m: 2, flexShrink: 0 }}>{formatApiError(error)}</Alert>
                )}

                <ShipmentDataGrid
                    shipments={flattenedShipments}
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

export default ShipmentListPage;