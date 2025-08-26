// File: /frontend/src/features/purchasing/components/PurchaseBillForm.js

/**
 * @file Componente reutilizable para el formulario de Factura de Compra.
 *
 * @description Este componente es un formulario controlado con Formik que permite al usuario
 * registrar los detalles financieros de una factura de proveedor a partir de una
 * Orden de Compra. Permite editar tanto las cantidades a facturar como el costo final.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field, FieldArray } from 'formik';
import * as yup from 'yup';
import {
    Box, Grid, Button, Typography, Paper, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { TextField } from 'formik-material-ui';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { es } from 'date-fns/locale/es';
import { addDays } from 'date-fns';

// ==============================================================================
// SECCIÓN 2: ESQUEMA DE VALIDACIÓN
// ==============================================================================

const purchaseBillValidationSchema = yup.object().shape({
    supplier_invoice_number: yup.string().trim().required('El N° de factura del proveedor es obligatorio.'),
    invoice_date: yup.date().required('La fecha de factura es requerida.').typeError('Formato inválido.'),
    due_date: yup.date().required('La fecha de vencimiento es requerida.').typeError('Formato inválido.')
        .min(yup.ref('invoice_date'), 'La fecha de vencimiento no puede ser anterior a la de factura.'),
    items: yup.array().of(yup.object().shape({
        quantity_billed: yup.number()
            .min(0, 'No puede ser negativo.')
            .max(yup.ref('quantity_ordered'), 'No se puede facturar más de lo pedido.')
            .typeError('Debe ser un número.'),
        unit_cost: yup.number()
            .min(0, 'El costo no puede ser negativo.')
            .typeError('Debe ser un número.')
            .required('El costo es requerido.'),
    })).min(1, 'Debe haber al menos un ítem en la factura.'),
    notes: yup.string().nullable(),
});

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL DEL FORMULARIO
// ==============================================================================

const PurchaseBillForm = ({ initialData: purchaseOrder, onSubmit, isSubmitting = false }) => {
    const initialValues = useMemo(() => {
        const invoiceDate = new Date();
        return {
            supplier_invoice_number: '',
            invoice_date: invoiceDate,
            due_date: addDays(invoiceDate, 30),
            notes: '',
            items: (purchaseOrder?.items || []).map(item => ({
                product_id: item.product_id,
                sku: item.sku,
                name: item.name,
                quantity_ordered: item.quantity_ordered,
                quantity_billed: item.quantity_ordered,
                unit_cost: item.unit_cost,
            })),
        };
    }, [purchaseOrder]);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Formik
                initialValues={initialValues}
                validationSchema={purchaseBillValidationSchema}
                onSubmit={onSubmit}
                enableReinitialize
            >
                {({ values, setFieldValue, isSubmitting: formikIsSubmitting }) => {
                    const totalAmount = values.items.reduce((acc, item) => acc + (Number(item.quantity_billed || 0) * Number(item.unit_cost || 0)), 0);

                    return (
                        <Form noValidate>
                            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                                <Typography variant="h6" gutterBottom>Información de la Factura</Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={4}>
                                        <Field component={TextField} name="supplier_invoice_number" label="N° Factura Proveedor" fullWidth required disabled={isSubmitting || formikIsSubmitting} />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <DatePicker label="Fecha de Factura" value={values.invoice_date} onChange={(date) => setFieldValue('invoice_date', date)} slotProps={{ textField: { fullWidth: true, required: true } }} disabled={isSubmitting || formikIsSubmitting} />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <DatePicker label="Fecha de Vencimiento" value={values.due_date} onChange={(date) => setFieldValue('due_date', date)} slotProps={{ textField: { fullWidth: true, required: true } }} disabled={isSubmitting || formikIsSubmitting} />
                                    </Grid>
                                </Grid>
                            </Paper>

                            <Typography variant="h6" gutterBottom>Ítems a Facturar</Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead sx={{ backgroundColor: 'action.hover' }}>
                                        <TableRow>
                                            <TableCell sx={{width: '40%'}}>Producto (SKU)</TableCell>
                                            <TableCell align="center">Cant. Pedida</TableCell>
                                            <TableCell align="center">Cant. a Facturar</TableCell>
                                            <TableCell align="center">Costo Unitario (Factura)</TableCell>
                                            <TableCell align="right">Subtotal</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        <FieldArray name="items">
                                            {() => values.items.map((item, index) => (
                                                <TableRow key={item.product_id}>
                                                    <TableCell>{item.name} ({item.sku})</TableCell>
                                                    <TableCell align="center">{item.quantity_ordered}</TableCell>
                                                    <TableCell align="center">
                                                        <Field component={TextField} type="number" name={`items.${index}.quantity_billed`} sx={{ width: 100 }} inputProps={{ min: 0 }} disabled={isSubmitting || formikIsSubmitting} />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Field component={TextField} type="number" name={`items.${index}.unit_cost`} sx={{ width: 120 }} inputProps={{ min: 0 }} disabled={isSubmitting || formikIsSubmitting} />
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                        {`S/ ${(Number(item.quantity_billed || 0) * Number(item.unit_cost || 0)).toFixed(2)}`}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </FieldArray>
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Divider sx={{ my: 4 }} />

                            <Grid container justifyContent="space-between" alignItems="flex-start" spacing={3}>
                                <Grid item xs={12} md={7}>
                                    <Field component={TextField} name="notes" label="Notas Adicionales de la Factura" fullWidth multiline rows={3} disabled={isSubmitting || formikIsSubmitting} />
                                </Grid>
                                <Grid item xs={12} md={5}>
                                    <Typography variant="h4" align="right" fontWeight="bold">TOTAL: S/ {totalAmount.toFixed(2)}</Typography>
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button type="submit" variant="contained" size="large" disabled={isSubmitting || formikIsSubmitting}>
                                    {isSubmitting || formikIsSubmitting ? 'Registrando Factura...' : 'Crear Factura de Compra'}
                                </Button>
                            </Box>
                        </Form>
                    );
                }}
            </Formik>
        </LocalizationProvider>
    );
};

PurchaseBillForm.propTypes = {
    initialData: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool,
};

export default PurchaseBillForm;