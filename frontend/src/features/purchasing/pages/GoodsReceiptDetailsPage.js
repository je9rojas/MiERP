// File: /frontend/src/features/purchasing/pages/GoodsReceiptDetailsPage.js

/**
 * @file Página contenedora para mostrar los detalles de una Recepción de Mercancía.
 *
 * @description Este componente es puramente informativo. Orquesta la visualización de
 * los detalles de una recepción de mercancía específica, obteniendo y preparando
 * los datos desde la API antes de pasarlos a un componente de presentación.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useMemo } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Container, Paper, Box, CircularProgress, Typography, Alert, Button, Divider } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { getGoodsReceiptByIdAPI } from '../api/purchasingAPI';
import GoodsReceiptDetails from '../components/GoodsReceiptDetails';
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const GoodsReceiptDetailsPage = () => {
    // --------------------------------------------------------------------------
    // Sub-sección 2.1: Hooks y Estado
    // --------------------------------------------------------------------------
    
    const { receiptId } = useParams();

    // --------------------------------------------------------------------------
    // Sub-sección 2.2: Lógica de Obtención de Datos
    // --------------------------------------------------------------------------
    
    const {
        data: receiptFromApi,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ['goodsReceipt', receiptId],
        queryFn: () => getGoodsReceiptByIdAPI(receiptId),
        enabled: !!receiptId,
    });

    // --------------------------------------------------------------------------
    // Sub-sección 2.3: Preparación y Aplanamiento de Datos para la UI
    // --------------------------------------------------------------------------

    const flattenedReceipt = useMemo(() => {
        if (!receiptFromApi) {
            return null;
        }
        return {
            ...receiptFromApi,
            supplierName: receiptFromApi.supplier?.business_name || 'N/A',
            purchaseOrderNumber: receiptFromApi.purchase_order?.order_number || 'N/A',
        };
    }, [receiptFromApi]);

    // --------------------------------------------------------------------------
    // Sub-sección 2.4: Renderizado Condicional (Carga y Error)
    // --------------------------------------------------------------------------
    
    if (isLoading) {
        return (
            <Container maxWidth="md">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Cargando detalles de la recepción...</Typography>
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
                    title={`Detalles de Recepción: #${flattenedReceipt?.receipt_number || ''}`}
                    subtitle="Información detallada de la entrada de mercancía al inventario."
                    showAddButton={false}
                />

                <Box mt={3} mb={3}>
                    <Button
                        component={RouterLink}
                        to="/compras/recepciones"
                        startIcon={<ArrowBackIcon />}
                    >
                        Volver a la Lista de Recepciones
                    </Button>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {flattenedReceipt && <GoodsReceiptDetails receipt={flattenedReceipt} />}
            </Paper>
        </Container>
    );
};

export default GoodsReceiptDetailsPage;