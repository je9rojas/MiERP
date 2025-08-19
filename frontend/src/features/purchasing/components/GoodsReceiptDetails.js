// frontend/src/features/purchasing/components/GoodsReceiptDetails.js

/**
 * @file Componente de presentación para mostrar los detalles de una Recepción de Mercancía.
 *
 * @description Este componente es un "componente tonto" (dumb component) que recibe
 * los datos de una recepción y los renderiza de forma clara y estructurada.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
// ==============================================================================

import React from 'react';
import {
    Box, Grid, Typography, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ==============================================================================
// SECCIÓN 2: SUB-COMPONENTES DE PRESENTACIÓN
// ==============================================================================

const DetailItem = ({ title, value }) => (
    <Grid item xs={12} sm={6} md={3}>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            {title}
        </Typography>
        <Typography variant="body1" component="div" fontWeight="500">
            {value || '—'}
        </Typography>
    </Grid>
);

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL DE DETALLES
// ==============================================================================

const GoodsReceiptDetails = ({ receipt }) => {
    if (!receipt) {
        return null;
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'dd \'de\' MMMM, yyyy HH:mm', { locale: es });
        } catch (error) {
            return 'Fecha inválida';
        }
    };

    return (
        <Box>
            {/* --- SECCIÓN DE CABECERA --- */}
            <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Información General de la Recepción
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <DetailItem title="Proveedor" value={receipt.supplier?.business_name} />
                    <DetailItem title="N° Orden de Compra" value={receipt.purchase_order_number} />
                    <DetailItem title="N° Recepción (Interno)" value={receipt.receipt_number} />
                    <DetailItem title="Fecha de Recepción" value={formatDate(receipt.received_date)} />
                </Grid>
            </Paper>

            {/* --- SECCIÓN DE ÍTEMS --- */}
            <Typography variant="h6" gutterBottom>
                Ítems Recibidos
            </Typography>
            <TableContainer component={Paper} variant="outlined">
                <Table sx={{ minWidth: 650 }} aria-label="tabla de ítems recibidos">
                    <TableHead sx={{ backgroundColor: 'action.hover' }}>
                        <TableRow>
                            <TableCell>SKU</TableCell>
                            <TableCell>Producto</TableCell>
                            <TableCell align="right">Cant. Ordenada</TableCell>
                            <TableCell align="right">Cant. Recibida</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {receipt.items?.map((item) => (
                            <TableRow key={item.product_id}>
                                <TableCell>{item.sku}</TableCell>
                                <TableCell component="th" scope="row">{item.name}</TableCell>
                                <TableCell align="right">{item.quantity_ordered}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                                    {item.quantity_received}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* --- SECCIÓN DE NOTAS --- */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Notas Adicionales
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                    {receipt.notes || 'No se registraron notas para esta recepción.'}
                </Typography>
            </Box>
        </Box>
    );
};

export default GoodsReceiptDetails;