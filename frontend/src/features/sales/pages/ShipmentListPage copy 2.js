// /frontend/src/features/sales/pages/ShipmentListPage.js

/**
 * @file Página para listar todos los Despachos (Shipments).
 *
 * @description Este componente es responsable de:
 * 1. Obtener una lista paginada de todos los despachos desde la API.
 * 2. Transformar los datos para la UI usando un mapper.
 * 3. Mostrar los datos en un componente de tabla (DataGrid).
 * 4. Gestionar los estados de carga, error y paginación.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Paper, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// API, Mappers, Componentes y Utilitarios
import { getShipmentsAPI } from '../api/salesAPI';
import { mapPaginatedShipmentsForUI } from '../mappers/salesMappers'; // <--- (MODIFICADO) Importamos el mapper
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
        page: 0,
        pageSize: 25,
    });

    // --- 2.2: Lógica de Obtención y Transformación de Datos --- (MODIFICADO)
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['shipmentsList', paginationModel],
        queryFn: () => getShipmentsAPI({ 
            page: paginationModel.page + 1, 
            pageSize: paginationModel.pageSize 
        }),
        // La opción 'select' transforma los datos ANTES de que se almacenen en caché
        // y se entreguen al componente. Aquí aplicamos nuestro mapper.
        select: mapPaginatedShipmentsForUI, // <--- (AÑADIDO)
        placeholderData: (previousData) => previousData,
    });
    
    // [DEPURACIÓN] Este log ahora mostrará los datos ya transformados y listos para la tabla.
    console.log('Datos MAPEADOS para la tabla:', data);

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

        return (
            <ShipmentDataGrid
                // (MODIFICADO) 'shipments' ahora se llama 'rows' para mayor claridad y estándar
                rows={data?.items || []} 
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
                showAddButton={false}
            />
            
            <Paper sx={{ p: { xs: 2, md: 3 }, mt: 3, borderRadius: 2, boxShadow: 3 }}>
                {renderContent()}
            </Paper>
        </Container>
    );
};

export default ShipmentListPage;