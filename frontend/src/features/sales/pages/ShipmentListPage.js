// /frontend/src/features/sales/pages/ShipmentListPage.js

/**
 * @file Página para listar todos los Despachos (Shipments).
 *
 * @description Este componente es responsable de:
 * 1. Obtener una lista paginada de todos los despachos desde la API.
 * 2. Mostrar los datos en un componente de tabla (DataGrid).
 * 3. Gestionar los estados de carga y error durante la obtención de datos.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Paper, Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// API, Componentes y Utilitarios
import { getShipmentsAPI } from '../api/salesAPI'; // Nota: Crearemos esta función en el siguiente paso.
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';
// import ShipmentDataGrid from '../components/ShipmentDataGrid'; // Nota: Este componente aún debe ser creado.

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const ShipmentListPage = () => {
    const navigate = useNavigate();

    // Lógica para obtener los datos de los despachos.
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['shipmentsList'],
        queryFn: () => getShipmentsAPI({ page: 1, pageSize: 25 }), // Usaremos valores por defecto por ahora.
    });

    // Manejador para cuando se haga clic en una fila (a implementar en el DataGrid).
    const handleRowClick = (shipmentId) => {
        // Aún no tenemos una página de detalles del despacho, pero esta sería la navegación.
        // navigate(`/ventas/despachos/${shipmentId}`);
        console.log(`Navegar a los detalles del despacho: ${shipmentId}`);
    };

    // Renderizado condicional basado en el estado de la consulta.
    const renderContent = () => {
        if (isLoading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Cargando despachos...</Typography>
                </Box>
            );
        }

        if (isError) {
            return <Alert severity="error" sx={{ my: 2 }}>{formatApiError(error)}</Alert>;
        }

        return (
            <Typography sx={{ my: 4, textAlign: 'center' }}>
                Aquí se mostrará la tabla de despachos (ShipmentDataGrid).
                <br />
                Total de despachos encontrados: {data?.total_count ?? 0}
            </Typography>
            // <ShipmentDataGrid
            //     shipments={data?.items || []}
            //     onRowClick={handleRowClick}
            //     rowCount={data?.total_count || 0}
            //     // Aquí pasarías el estado de paginación y los manejadores.
            // />
        );
    };

    return (
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <PageHeader
                title="Listado de Despachos"
                subtitle="Consulte todos los movimientos de salida de mercancía registrados."
                showAddButton={false} // No se crean despachos desde aquí, sino desde una OV.
            />
            
            <Paper sx={{ p: { xs: 2, md: 3 }, mt: 3, borderRadius: 2, boxShadow: 3 }}>
                {renderContent()}
            </Paper>
        </Container>
    );
};

export default ShipmentListPage;