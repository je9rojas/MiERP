// frontend/src/features/purchasing/components/PurchaseBillForm.js

/**
 * @file Componente reutilizable para el formulario de Factura de Compra.
 *
 * @description Este componente es un formulario controlado con Formik que permite al usuario
 * registrar los detalles financieros de una factura de proveedor a partir de una
 * recepción de mercancía.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useMemo } from 'react';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import {
    Box, Grid, TextField, Button, Typography, Paper, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
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
        .min(yup.ref('invoice_date'), 'La fecha de vencimiento no puede ser anterior a la fecha de factura.'),
    items: yup.array().of(yup.object().shape({
        unit_cost: yup.number().min(0, 'El costo no puede ser negativo.').typeError('Debe ser un número.').required('El costo es requerido.'),
    })),
});

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL DEL FORMULARIO
// ==============================================================================

const PurchaseBillForm = ({ initialData, onSubmit, isSubmitting }) => {
    const initialValues = useMemo(() => {
        const invoiceDate = new Date();
        return {
            supplier_invoice_number: '',
            invoice_date: invoiceDate,
            due_date: addDays(invoiceDate, 30), // Vencimiento por defecto a 30 días
            notes: initialData?.notes || '',
            items: (initialData?.items || []).map(item => ({
                ...item,
                // El costo inicial es el de la OC, pero será editable.
                unit_cost: item.unit_cost || 0,
            })),
        };
    }, [initialData]);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Formik
                initialValues={initialValues}
                validationSchema={purchaseBillValidationSchema}
                onSubmit={onSubmit}
                enableReinitialize
            >
                {({ values, errors, touched, setFieldValue, setFieldTouched }) => {
                    const totalAmount = values.items.reduce((acc, item) => acc + (Number(item.quantity_received) * Number(item.unit_cost)), 0);

                    return (
                        <Form noValidate>
                            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                                <Typography variant="h6" gutterBottom>Información de la Factura</Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={4}><TextField fullWidth label="N° Factura Proveedor" name="supplier_invoice_number" value={values.supplier_invoice_number} onChange={(e) => setFieldValue('supplier_invoice_number', e.target.value)} required error={touched.supplier_invoice_number && Boolean(errors.supplier_invoice_number)} helperText={touched.supplier_invoice_number && errors.supplier_invoice_number} disabled={isSubmitting} /></Grid>
                                    <Grid item xs={12} md={4}><DatePicker label="Fecha de Factura" value={values.invoice_date} onChange={(newValue) => setFieldValue('invoice_date', newValue)} slotProps={{ textField: { fullWidth: true, required: true } }} disabled={isSubmitting} /></Grid>
                                    <Grid item xs={12} md={4}><DatePicker label="Fecha de Vencimiento" value={values.due_date} onChange={(newValue) => setFieldValue('due_date', newValue)} slotProps={{ textField: { fullWidth: true, required: true } }} disabled={isSubmitting} /></Grid>
                                </Grid>
                            </Paper>

                            <Typography variant="h6" gutterBottom>Ítems a Facturar</Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead sx={{ backgroundColor: 'action.hover' }}>
                                        <TableRow>
                                            <TableCell>Producto (SKU)</TableCell>
                                            <TableCell align="right">Cant. Recibida</TableCell>
                                            <TableCell align="center">Costo Unitario Real</TableCell>
                                            <TableCell align="right">Subtotal</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {values.items.map((item, index) => (
                                            <TableRow key={item.product_id}>
                                                <TableCell>{item.name} ({item.sku})</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{item.quantity_received}</TableCell>
                                                <TableCell align="center">
                                                    <TextField
                                                        type="number"
                                                        name={`items.${index}.unit_cost`}
                                                        value={item.unit_cost}
                                                        onChange={(e) => setFieldValue(`items.${index}.unit_cost`, Number(e.target.value))}
                                                        onBlur={() => setFieldTouched(`items.${index}.unit_cost`, true)}
                                                        error={touched.items?.[index]?.unit_cost && Boolean(errors.items?.[index]?.unit_cost)}
                                                        helperText={touched.items?.[index]?.unit_cost && errors.items?.[index]?.unit_cost}
                                                        disabled={isSubmitting}
                                                        sx={{ width: 120 }}
                                                        inputProps={{ min: 0 }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                    {`S/ ${(Number(item.quantity_received) * Number(item.unit_cost)).toFixed(2)}`}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Divider sx={{ my: 4 }} />

                            <Grid container justifyContent="space-between" alignItems="flex-start" spacing={3}>
                                <Grid item xs={12} md={7}>
                                    <TextField fullWidth label="Notas Adicionales de la Factura" name="notes" value={values.notes} onChange={(e) => setFieldValue('notes', e.target.value)} multiline rows={3} disabled={isSubmitting} />
                                </Grid>
                                <Grid item xs={12} md={5}>
                                    <Typography variant="h4" align="right" fontWeight="bold">TOTAL: S/ {totalAmount.toFixed(2)}</Typography>
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                                    {isSubmitting ? 'Registrando Factura...' : 'Crear Factura de Compra'}
                                </Button>
                            </Box>
                        </Form>
                    );
                }}
            </Formik>
        </LocalizationProvider>
    );
};

export default PurchaseBillForm;