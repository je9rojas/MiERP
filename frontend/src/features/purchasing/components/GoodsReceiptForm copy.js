// frontend/src/features/purchasing/components/GoodsReceiptForm.js

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
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import {
    Box, Grid, TextField, Button, Typography, Paper, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { es } from 'date-fns/locale/es';

// ==============================================================================
// SECCIÓN 2: ESQUEMA DE VALIDACIÓN
// ==============================================================================

const goodsReceiptValidationSchema = yup.object().shape({
    received_date: yup.date().required('La fecha de recepción es requerida.').typeError('Formato de fecha inválido.'),
    items: yup.array().of(yup.object().shape({
        quantity_received: yup.number()
            .min(0, 'La cantidad no puede ser negativa.')
            .typeError('Debe ser un número.')
            .required('La cantidad es requerida.')
            .test(
                'is-less-than-or-equal-to-ordered',
                'No puede recibir más de lo ordenado.',
                function(value) {
                    // 'this.parent' se refiere al objeto item actual (ej. { quantity_ordered: 10, quantity_received: 12 })
                    return value <= this.parent.quantity_ordered;
                }
            ),
    })),
});

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL DEL FORMULARIO
// ==============================================================================

const GoodsReceiptForm = ({ initialData, onSubmit, isSubmitting }) => {
    const initialValues = useMemo(() => {
        return {
            received_date: new Date(),
            notes: '',
            items: (initialData?.items || []).map(item => ({
                ...item,
                // Por defecto, se asume que se recibe la cantidad total pedida.
                quantity_received: item.quantity_ordered,
            })),
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
                {({ values, errors, touched, setFieldValue, setFieldTouched }) => (
                    <Form noValidate>
                        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <DatePicker
                                        label="Fecha de Recepción"
                                        value={values.received_date}
                                        onChange={(newValue) => setFieldValue('received_date', newValue)}
                                        slotProps={{ textField: { fullWidth: true, required: true } }}
                                        disabled={isSubmitting}
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
                                        <TableCell align="center">Cant. a Recibir</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {values.items.map((item, index) => (
                                        <TableRow key={item.product_id}>
                                            <TableCell>{item.name} ({item.sku})</TableCell>
                                            <TableCell align="right">{item.quantity_ordered}</TableCell>
                                            <TableCell align="center">
                                                <TextField
                                                    type="number"
                                                    name={`items.${index}.quantity_received`}
                                                    value={item.quantity_received}
                                                    onChange={(e) => setFieldValue(`items.${index}.quantity_received`, Number(e.target.value))}
                                                    onBlur={() => setFieldTouched(`items.${index}.quantity_received`, true)}
                                                    error={touched.items?.[index]?.quantity_received && Boolean(errors.items?.[index]?.quantity_received)}
                                                    helperText={touched.items?.[index]?.quantity_received && errors.items?.[index]?.quantity_received}
                                                    disabled={isSubmitting}
                                                    sx={{ width: 120 }}
                                                    inputProps={{ min: 0, max: item.quantity_ordered }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Divider sx={{ my: 4 }} />

                        <TextField
                            fullWidth
                            label="Notas Adicionales de la Recepción"
                            name="notes"
                            value={values.notes}
                            onChange={(e) => setFieldValue('notes', e.target.value)}
                            multiline
                            rows={3}
                            disabled={isSubmitting}
                        />

                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                                {isSubmitting ? 'Procesando Recepción...' : 'Registrar Recepción'}
                            </Button>
                        </Box>
                    </Form>
                )}
            </Formik>
        </LocalizationProvider>
    );
};

export default GoodsReceiptForm;