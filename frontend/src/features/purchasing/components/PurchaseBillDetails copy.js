// frontend/src/features/purchasing/components/PurchaseBillDetails.js

/**
 * @file Componente de presentación para mostrar los detalles de una Factura de Compra.
 *
 * @description Este componente es un "componente tonto" (dumb component) que recibe
 * los datos de una factura y los renderiza de forma clara y estructurada. No contiene
 * lógica de estado ni de obtención de datos.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
// ==============================================================================

import React from 'react';
import {
    Box, Grid, Typography, Paper, Divider, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ==============================================================================
// SECCIÓN 2: SUB-COMPONENTES DE PRESENTACIÓN
// ==============================================================================

const DetailItem = ({ title, value, xs = 12, sm = 6 }) => (
    <Grid item xs={xs} sm={sm}>
        <Typography variant="caption" color="text.secondary" display="block">
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

const PurchaseBillDetails = ({ bill }) => {
    if (!bill) {
        return null; // No renderizar nada si no hay datos de la factura
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'dd \'de\' MMMM, yyyy', { locale: es });
        } catch (error) {
            return 'Fecha inválida';
        }
    };

    return (
        <Box>
            {/* --- SECCIÓN DE CABECERA --- */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Detalles de la Factura
                </Typography>
                <Grid container spacing={2}>
                    <DetailItem title="Proveedor" value={bill.supplier?.business_name} />
                    <DetailItem title="N° Factura Proveedor" value={bill.supplier_invoice_number} />
                    <DetailItem title="Orden de Compra Asociada" value={bill.purchase_order_number} />
                    <DetailItem title="Fecha de Recepción" value={formatDate(bill.received_date)} />
                </Grid>
            </Paper>

            {/* --- SECCIÓN DE ÍTEMS --- */}
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                Ítems Recibidos
            </Typography>
            <TableContainer component={Paper} variant="outlined">
                <Table sx={{ minWidth: 650 }} aria-label="tabla de ítems">
                    <TableHead sx={{ backgroundColor: 'action.hover' }}>
                        <TableRow>
                            <TableCell>SKU</TableCell>
                            <TableCell>Producto</TableCell>
                            <TableCell align="right">Cant. Ordenada</TableCell>
                            <TableCell align="right">Cant. Recibida</TableCell>
                            <TableCell align="right">Costo Unitario Real</TableCell>
                            <TableCell align="right">Subtotal</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {bill.items?.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{item.sku}</TableCell>
                                <TableCell component="th" scope="row">{item.name}</TableCell>
                                <TableCell align="right">{item.quantity_ordered}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{item.quantity_received}</TableCell>
                                <TableCell align="right">{`S/ ${Number(item.unit_cost || 0).toFixed(2)}`}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                    {`S/ ${(Number(item.quantity_received) * Number(item.unit_cost)).toFixed(2)}`}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* --- SECCIÓN DE RESUMEN Y NOTAS --- */}
            <Grid container sx={{ mt: 4 }} spacing={3}>
                <Grid item xs={12} md={7}>
                    <Typography variant="h6" gutterBottom>
                        Notas Adicionales
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {bill.notes || 'No se registraron notas.'}
                    </Typography>
                </Grid>
                <Grid item xs={12} md={5}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Typography variant="h5" fontWeight="bold">
                            Total de la Factura: S/ {Number(bill.total_amount || 0).toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Monto calculado basado en las cantidades recibidas y los costos reales.
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PurchaseBillDetails;