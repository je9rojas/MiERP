// frontend/src/features/purchasing/components/PurchaseBillForm.js

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
import { Formik, Form, FieldArray } from 'formik';
import * as yup from 'yup';
import {
    Box, Grid, TextField, Button, Typography, Paper, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, FormHelperText
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
        quantity_billed: yup.number()
            .min(0, 'No puede ser negativo.')
            // Validar que no se facture más de lo pedido.
            // Una validación más avanzada compararía contra 'cantidad recibida - cantidad ya facturada'.
            .max(yup.ref('quantity_ordered'), 'No se puede facturar más de lo pedido en la OC.')
            .typeError('Debe ser un número.'),
        unit_cost: yup.number()
            .min(0, 'El costo no puede ser negativo.')
            .typeError('Debe ser un número.')
            .required('El costo es requerido.'),
    })).min(1, 'Debe haber al menos un ítem en la factura.'),
});

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL DEL FORMULARIO
// ==============================================================================

const PurchaseBillForm = ({ initialData: purchaseOrder, onSubmit, isSubmitting }) => {
    // `initialData` ahora es la Orden de Compra completa.
    const initialValues = useMemo(() => {
        const invoiceDate = new Date();
        return {
            supplier_invoice_number: '',
            invoice_date: invoiceDate,
            due_date: addDays(invoiceDate, 30),
            notes: '',
            // Se mapean los ítems de la OC para el formulario de factura.
            items: (purchaseOrder?.items || []).map(item => ({
                product_id: item.product_id,
                sku: item.sku,
                name: item.name,
                quantity_ordered: item.quantity_ordered,
                // Por defecto, se propone facturar la cantidad total pedida.
                quantity_billed: item.quantity_ordered, 
                // El costo se toma de la OC como referencia, pero es editable.
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
                {({ values, errors, touched, setFieldValue, handleChange, handleBlur }) => {
                    const totalAmount = values.items.reduce((acc, item) => acc + (Number(item.quantity_billed || 0) * Number(item.unit_cost || 0)), 0);

                    return (
                        <Form noValidate>
                            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                                <Typography variant="h6" gutterBottom>Información de la Factura</Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={4}><TextField fullWidth label="N° Factura Proveedor" name="supplier_invoice_number" value={values.supplier_invoice_number} onChange={handleChange} onBlur={handleBlur} required error={touched.supplier_invoice_number && Boolean(errors.supplier_invoice_number)} helperText={touched.supplier_invoice_number && errors.supplier_invoice_number} disabled={isSubmitting} /></Grid>
                                    <Grid item xs={12} md={4}><DatePicker label="Fecha de Factura" value={values.invoice_date} onChange={(date) => setFieldValue('invoice_date', date)} slotProps={{ textField: { fullWidth: true, required: true, error: touched.invoice_date && Boolean(errors.invoice_date), helperText: touched.invoice_date && errors.invoice_date } }} disabled={isSubmitting} /></Grid>
                                    <Grid item xs={12} md={4}><DatePicker label="Fecha de Vencimiento" value={values.due_date} onChange={(date) => setFieldValue('due_date', date)} slotProps={{ textField: { fullWidth: true, required: true, error: touched.due_date && Boolean(errors.due_date), helperText: touched.due_date && errors.due_date } }} disabled={isSubmitting} /></Grid>
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
                                                        <TextField type="number" name={`items.${index}.quantity_billed`} value={item.quantity_billed} onChange={handleChange} onBlur={handleBlur} error={touched.items?.[index]?.quantity_billed && Boolean(errors.items?.[index]?.quantity_billed)} sx={{ width: 100 }} inputProps={{ min: 0 }} disabled={isSubmitting} />
                                                        {touched.items?.[index]?.quantity_billed && errors.items?.[index]?.quantity_billed && <FormHelperText error>{errors.items[index].quantity_billed}</FormHelperText>}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <TextField type="number" name={`items.${index}.unit_cost`} value={item.unit_cost} onChange={handleChange} onBlur={handleBlur} error={touched.items?.[index]?.unit_cost && Boolean(errors.items?.[index]?.unit_cost)} sx={{ width: 120 }} inputProps={{ min: 0 }} disabled={isSubmitting} />
                                                        {touched.items?.[index]?.unit_cost && errors.items?.[index]?.unit_cost && <FormHelperText error>{errors.items[index].unit_cost}</FormHelperText>}
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
                                    <TextField fullWidth label="Notas Adicionales de la Factura" name="notes" value={values.notes} onChange={handleChange} onBlur={handleBlur} multiline rows={3} disabled={isSubmitting} />
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