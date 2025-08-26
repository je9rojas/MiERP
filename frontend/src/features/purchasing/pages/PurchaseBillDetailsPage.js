// File: /frontend/src/features/purchasing/pages/PurchaseBillDetailsPage.js

/**
 * @file Página contenedora para mostrar los detalles de una Factura de Compra.
 *
 * @description Este componente actúa como el "cerebro" de la página, orquestando la
 * obtención y preparación de datos desde la API para una factura específica y gestionando
 * los estados de carga y error.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useMemo } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Container, Paper, Box, CircularProgress, Typography, Alert, Button, Divider } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { getPurchaseBillByIdAPI } from '../api/purchasingAPI';
import PurchaseBillDetails from '../components/PurchaseBillDetails';
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const PurchaseBillDetailsPage = () => {
    // --------------------------------------------------------------------------
    // Sub-sección 2.1: Hooks y Estado
    // --------------------------------------------------------------------------
    
    const { billId } = useParams();

    // --------------------------------------------------------------------------
    // Sub-sección 2.2: Lógica de Obtención de Datos
    // --------------------------------------------------------------------------
    
    const {
        data: billFromApi,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: ['purchaseBill', billId],
        queryFn: () => getPurchaseBillByIdAPI(billId),
        enabled: !!billId,
    });

    // --------------------------------------------------------------------------
    // Sub-sección 2.3: Preparación y Aplanamiento de Datos para la UI
    // --------------------------------------------------------------------------

    const flattenedBill = useMemo(() => {
        if (!billFromApi) {
            return null;
        }
        return {
            ...billFromApi,
            supplierName: billFromApi.supplier?.business_name || 'N/A',
            purchaseOrderNumber: billFromApi.purchase_order?.order_number || 'N/A',
        };
    }, [billFromApi]);

    // --------------------------------------------------------------------------
    // Sub-sección 2.4: Renderizado Condicional (Carga y Error)
    // --------------------------------------------------------------------------
    
    if (isLoading) {
        return (
            <Container maxWidth="md">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Cargando detalles de la factura...</Typography>
                </Box>
            </Container>
        );
    }

    if (isError) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">{`Error al cargar los datos: ${formatApiError(error)}`}</Alert>
            </Container>
        );
    }

    // --------------------------------------------------------------------------
    // Sub-sección 2.5: Renderizado Principal
    // --------------------------------------------------------------------------
    
    return (
        <Container maxWidth="lg" sx={{ my: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, boxShadow: 3 }}>
                <PageHeader
                    title={`Detalles de Factura: #${flattenedBill?.bill_number || ''}`}
                    subtitle="Información detallada del documento financiero registrado."
                    showAddButton={false}
                />
                
                <Box mt={3} mb={3}>
                    <Button
                        component={RouterLink}
                        to="/compras/facturas"
                        startIcon={<ArrowBackIcon />}
                    >
                        Volver a la Lista de Facturas
                    </Button>
                </Box>
                
                <Divider sx={{ mb: 3 }} />

                {flattenedBill && <PurchaseBillDetails bill={flattenedBill} />}
            </Paper>
        </Container>
    );
};

export default PurchaseBillDetailsPage;