// /frontend/src/features/sales/pages/ShipmentListPage.js

/**
 * @file Página para listar todos los Despachos (Shipments).
 *
 * @description Este componente es responsable de:
 * 1. Obtener una lista paginada de todos los despachos desde la API.
 * 2. Mostrar los datos en un componente de tabla (DataGrid).
 * 3. Gestionar los estados de carga, error y paginación.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Paper, Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// API, Componentes y Utilitarios
import { getShipmentsAPI } from '../api/salesAPI';
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';
import ShipmentDataGrid from '../components/ShipmentDataGrid';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const ShipmentListPage = () => {
    const navigate = useNavigate();
    
    // --- 2.1: Gestión de Estado para Paginación ---
    const [paginationModel, setPaginationModel] = useState({
        page: 0,       // La página inicial en MUI DataGrid es 0
        pageSize: 25,
    });

    // --- 2.2: Lógica de Obtención de Datos ---
    const { data, isLoading, isError, error } = useQuery({
        // La queryKey ahora incluye el modelo de paginación para que se vuelva
        // a ejecutar cuando cambie.
        queryKey: ['shipmentsList', paginationModel],
        // La llamada a la API ahora usa los datos del estado de paginación.
        // Se suma 1 a la página porque la API espera paginación basada en 1.
        queryFn: () => getShipmentsAPI({ 
            page: paginationModel.page + 1, 
            pageSize: paginationModel.pageSize 
        }),
        // Mantiene los datos anteriores visibles mientras se cargan los nuevos.
        placeholderData: (previousData) => previousData,
    });

    // --- 2.3: Manejadores de Eventos ---
    const handleRowClick = (shipmentId) => {
        // En un futuro, esto navegará a la página de detalles del despacho.
        // navigate(`/ventas/despachos/${shipmentId}`);
        console.log(`Navegación a los detalles del despacho: ${shipmentId}`);
    };

    // --- 2.4: Renderizado de la UI ---
    const renderContent = () => {
        if (isError) {
            return <Alert severity="error" sx={{ my: 2 }}>{formatApiError(error)}</Alert>;
        }

        // Se pasa isLoading directamente a la DataGrid para que muestre su propio indicador.
        return (
            <ShipmentDataGrid
                shipments={data?.items || []}
                onRowClick={handleRowClick}
                rowCount={data?.total_count || 0}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                isLoading={isLoading}
            />
        );
    };

    return (
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <PageHeader
                title="Listado de Despachos"
                subtitle="Consulte todos los movimientos de salida de mercancía registrados."
                showAddButton={false} // Los despachos se crean desde una Orden de Venta.
            />
            
            <Paper sx={{ p: { xs: 2, md: 3 }, mt: 3, borderRadius: 2, boxShadow: 3 }}>
                {renderContent()}
            </Paper>
        </Container>
    );
};

export default ShipmentListPage;