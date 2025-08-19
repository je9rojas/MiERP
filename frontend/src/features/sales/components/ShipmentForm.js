// frontend/src/features/sales/components/ShipmentForm.js

/**
 * @file Componente reutilizable para el formulario de Creación de Despacho.
 *
 * @description Este componente es un formulario controlado con Formik que permite al usuario
 * registrar un despacho a partir de una Orden de Venta, especificando las cantidades
 * que están saliendo físicamente del almacén.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useMemo } from 'react';
import { Formik, Form } from 'formik';
import * as yup from 'yup';
import {
    Box, Grid, TextField, Button, Typography, Paper, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { es } from 'date-fns/locale/es';

// ==============================================================================
// SECCIÓN 2: ESQUEMA DE VALIDACIÓN
// ==============================================================================

const shipmentFormValidationSchema = yup.object().shape({
    shipping_date: yup.date().required('La fecha de despacho es requerida.').typeError('Formato de fecha inválido.'),
    items: yup.array().of(yup.object().shape({
        quantity_shipped: yup.number()
            .min(0, 'La cantidad no puede ser negativa.')
            .typeError('Debe ser un número.')
            .required('La cantidad es requerida.')
            // Valida que no se despache más de lo que se ordenó
            .test(
                'is-less-than-or-equal-to-ordered',
                'No puede despachar más de lo ordenado.',
                function(value) {
                    return value <= this.parent.quantity;
                }
            ),
    })),
});

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL DEL FORMULARIO
// ==============================================================================

const ShipmentForm = ({ initialData, onSubmit, isSubmitting }) => {
    // Prepara los valores iniciales del formulario a partir de la Orden de Venta.
    const initialValues = useMemo(() => {
        return {
            shipping_date: new Date(),
            notes: '',
            items: (initialData?.items || []).map(item => ({
                ...item,
                // Por defecto, se intenta despachar la cantidad total pedida.
                quantity_shipped: item.quantity,
            })),
        };
    }, [initialData]);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Formik
                initialValues={initialValues}
                validationSchema={shipmentFormValidationSchema}
                onSubmit={onSubmit}
                enableReinitialize
            >
                {({ values, errors, touched, setFieldValue, setFieldTouched }) => (
                    <Form noValidate>
                        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <DatePicker
                                        label="Fecha de Despacho"
                                        value={values.shipping_date}
                                        onChange={(newValue) => setFieldValue('shipping_date', newValue)}
                                        slotProps={{ textField: { fullWidth: true, required: true } }}
                                        disabled={isSubmitting}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>

                        <Typography variant="h6" gutterBottom>Ítems a Despachar</Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Producto (SKU)</TableCell>
                                        <TableCell align="right">Cant. Ordenada</TableCell>
                                        <TableCell align="center">Cant. a Despachar</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {values.items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.name} ({item.sku})</TableCell>
                                            <TableCell align="right">{item.quantity}</TableCell>
                                            <TableCell align="center">
                                                <TextField
                                                    type="number"
                                                    name={`items.${index}.quantity_shipped`}
                                                    value={item.quantity_shipped}
                                                    onChange={(e) => setFieldValue(`items.${index}.quantity_shipped`, Number(e.target.value))}
                                                    onBlur={() => setFieldTouched(`items.${index}.quantity_shipped`, true)}
                                                    error={touched.items?.[index]?.quantity_shipped && Boolean(errors.items?.[index]?.quantity_shipped)}
                                                    helperText={touched.items?.[index]?.quantity_shipped && errors.items?.[index]?.quantity_shipped}
                                                    disabled={isSubmitting}
                                                    sx={{ width: 120 }}
                                                    inputProps={{ min: 0, max: item.quantity }}
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
                            label="Notas Adicionales del Despacho"
                            name="notes"
                            value={values.notes}
                            onChange={(e) => setFieldValue('notes', e.target.value)}
                            multiline
                            rows={3}
                            disabled={isSubmitting}
                        />

                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                                {isSubmitting ? 'Procesando Despacho...' : 'Crear Despacho'}
                            </Button>
                            {isSubmitting && <CircularProgress size={24} sx={{ position: 'absolute', top: '50%', left: '50%', mt: '-12px', ml: '-12px' }} />}
                        </Box>
                    </Form>
                )}
            </Formik>
        </LocalizationProvider>
    );
};

export default ShipmentForm;