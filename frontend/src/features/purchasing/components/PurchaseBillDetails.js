// frontend/src/features/purchasing/components/PurchaseBillDetails.js

/**
 * @file Componente de presentación para mostrar los detalles de una Factura de Compra.
 *
 * @description Este componente es un "componente tonto" (dumb component) responsable
 * únicamente de renderizar la información de una factura. Recibe el objeto de la
 * factura como prop y lo muestra en un formato legible.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React from 'react';
import PropTypes from 'prop-types';
import {
    Box, Grid, Typography, Paper, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import { format } from 'date-fns';

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DEL COMPONENTE
// ==============================================================================

const PurchaseBillDetails = ({ bill }) => {
    // Cálculo seguro del total, evitando NaN si los valores no están definidos.
    const totalAmount = bill.items.reduce((acc, item) => {
        const quantity = Number(item.quantity_billed || 0);
        const cost = Number(item.unit_cost || 0);
        return acc + (quantity * cost);
    }, 0);

    return (
        <Box>
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Detalles de la Factura</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Proveedor</Typography>
                        <Typography variant="body1">{bill.supplier?.business_name || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">N° Factura Proveedor</Typography>
                        <Typography variant="body1">{bill.supplier_invoice_number}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Fecha de Factura</Typography>
                        <Typography variant="body1">{format(new Date(bill.invoice_date), 'dd/MM/yyyy')}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Fecha de Vencimiento</Typography>
                        <Typography variant="body1">{format(new Date(bill.due_date), 'dd/MM/yyyy')}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Orden de Compra Asociada</Typography>
                        {/* Asumimos que la OC no viene populada y solo tenemos el ID por ahora */}
                        <Typography variant="body1">{bill.purchase_order_id}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary">Estado de Pago</Typography>
                        <Chip label={bill.status.toUpperCase()} color={bill.status === 'UNPAID' ? 'warning' : 'success'} size="small" />
                    </Grid>
                </Grid>
            </Paper>

            <Typography variant="h6" gutterBottom>Ítems Facturados</Typography>
            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead sx={{ backgroundColor: 'action.hover' }}>
                        <TableRow>
                            <TableCell sx={{ width: '40%' }}>Producto (SKU)</TableCell>
                            <TableCell align="right">Cant. Facturada</TableCell>
                            <TableCell align="right">Costo Unitario</TableCell>
                            <TableCell align="right">Subtotal</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {bill.items.map((item) => (
                            <TableRow key={item.product_id}>
                                <TableCell>{item.name} ({item.sku})</TableCell>
                                <TableCell align="right">{item.quantity_billed}</TableCell>
                                <TableCell align="right">{`S/ ${Number(item.unit_cost || 0).toFixed(2)}`}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                    {`S/ ${(Number(item.quantity_billed || 0) * Number(item.unit_cost || 0)).toFixed(2)}`}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Divider sx={{ my: 4 }} />

            <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                    {bill.notes && (
                        <>
                            <Typography variant="subtitle1" gutterBottom>Notas Adicionales</Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{bill.notes}</Typography>
                        </>
                    )}
                </Grid>
                <Grid item xs={12} md={5}>
                    <Typography variant="h4" align="right" fontWeight="bold">
                        TOTAL: S/ {totalAmount.toFixed(2)}
                    </Typography>
                </Grid>
            </Grid>
        </Box>
    );
};

// ==============================================================================
// SECCIÓN 3: DEFINICIÓN DE PROPTYPES
// ==============================================================================

PurchaseBillDetails.propTypes = {
  /** El objeto completo de la factura de compra a mostrar. */
  bill: PropTypes.shape({
    bill_number: PropTypes.string.isRequired,
    supplier: PropTypes.shape({
      business_name: PropTypes.string,
    }),
    supplier_invoice_number: PropTypes.string.isRequired,
    invoice_date: PropTypes.string.isRequired,
    due_date: PropTypes.string.isRequired,
    purchase_order_id: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    notes: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.shape({
      product_id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      sku: PropTypes.string.isRequired,
      quantity_billed: PropTypes.number.isRequired,
      unit_cost: PropTypes.number.isRequired,
    })).isRequired,
  }).isRequired,
};

export default PurchaseBillDetails;