// File: /frontend/src/features/purchasing/components/GoodsReceiptForm.js

/**
 * @file Componente reutilizable para el formulario de Creación de Recepción de Mercancía.
 *
 * @description Este componente es un formulario controlado con Formik que permite al usuario
 * registrar una recepción a partir de una Orden de Compra, especificando las cantidades
 * que están ingresando físicamente al almacén.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field } from 'formik';
import * as yup from 'yup';
import {
    Box, Grid, Button, Typography, Paper, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { TextField } from 'formik-material-ui';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { es } from 'date-fns/locale/es';

// ==============================================================================
// SECCIÓN 2: ESQUEMA DE VALIDACIÓN
// ==============================================================================

const goodsReceiptValidationSchema = yup.object().shape({
    received_date: yup.date()
        .required('La fecha de recepción es requerida.')
        .typeError('Formato de fecha inválido.'),
    items: yup.array().of(yup.object().shape({
        quantity_received: yup.number()
            .min(0, 'La cantidad no puede ser negativa.')
            .typeError('Debe ser un número.')
            .required('La cantidad es requerida.')
            .test(
                'is-less-than-pending',
                'No puede recibir más de lo pendiente.',
                function(value) {
                    const { quantity_ordered = 0, quantity_already_received = 0 } = this.parent;
                    const pendingQuantity = quantity_ordered - quantity_already_received;
                    return value <= pendingQuantity;
                }
            ),
    })),
    notes: yup.string().nullable(),
});

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL DEL FORMULARIO
// ==============================================================================

const GoodsReceiptForm = ({ initialData, onSubmit, isSubmitting = false }) => {
    const initialValues = useMemo(() => {
        return {
            received_date: new Date(),
            notes: '',
            items: (initialData?.items || []).map(item => {
                const pendingQuantity = (item.quantity_ordered || 0) - (item.quantity_already_received || 0);
                return {
                    ...item,
                    quantity_received: Math.max(0, pendingQuantity), // Sugerir la cantidad pendiente
                };
            }),
        };
    }, [initialData]);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Formik
                initialValues={initialValues}
                validationSchema={goodsReceiptValidationSchema}
                onSubmit={onSubmit}
                enableReinitialize
            >
                {({ values, setFieldValue, isSubmitting: formikIsSubmitting }) => (
                    <Form noValidate>
                        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <DatePicker
                                        label="Fecha de Recepción"
                                        value={values.received_date}
                                        onChange={(newValue) => setFieldValue('received_date', newValue)}
                                        slotProps={{ textField: { fullWidth: true, required: true } }}
                                        disabled={isSubmitting || formikIsSubmitting}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>

                        <Typography variant="h6" gutterBottom>
                            Ítems a Recibir
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead sx={{ backgroundColor: 'action.hover' }}>
                                    <TableRow>
                                        <TableCell>Producto (SKU)</TableCell>
                                        <TableCell align="right">Cant. Ordenada</TableCell>
                                        <TableCell align="right">Cant. Ya Recibida</TableCell>
                                        <TableCell align="center">Cant. a Recibir</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {values.items.map((item, index) => (
                                        <TableRow key={item.product_id}>
                                            <TableCell component="th" scope="row">{item.name} ({item.sku})</TableCell>
                                            <TableCell align="right">{item.quantity_ordered}</TableCell>
                                            <TableCell align="right">{item.quantity_already_received || 0}</TableCell>
                                            <TableCell align="center">
                                                <Field
                                                    component={TextField}
                                                    type="number"
                                                    name={`items.${index}.quantity_received`}
                                                    disabled={isSubmitting || formikIsSubmitting}
                                                    sx={{ width: 120 }}
                                                    inputProps={{ min: 0, max: (item.quantity_ordered - (item.quantity_already_received || 0)) }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Divider sx={{ my: 4 }} />

                        <Field
                            component={TextField}
                            name="notes"
                            label="Notas Adicionales de la Recepción"
                            fullWidth
                            multiline
                            rows={3}
                            disabled={isSubmitting || formikIsSubmitting}
                        />

                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button type="submit" variant="contained" size="large" disabled={isSubmitting || formikIsSubmitting}>
                                {isSubmitting || formikIsSubmitting ? 'Procesando Recepción...' : 'Registrar Recepción'}
                            </Button>
                        </Box>
                    </Form>
                )}
            </Formik>
        </LocalizationProvider>
    );
};

GoodsReceiptForm.propTypes = {
    initialData: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool,
};

export default GoodsReceiptForm;