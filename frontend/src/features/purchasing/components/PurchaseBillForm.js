// frontend/src/features/purchasing/components/PurchaseBillForm.js

/**
 * @file Componente reutilizable para el formulario de Registro de Recepción y Factura de Compra.
 * @description Este componente es un formulario controlado con Formik que permite al usuario
 * registrar la recepción de mercancía, incluyendo cantidades recibidas, costos y número de factura.
 * Se encarga de la UI y de la validación de los datos.
 */

// SECCIÓN 1: IMPORTACIONES
import React, { useMemo } from 'react';
import { Formik, Form, FieldArray } from 'formik';
import {
    Box, Grid, TextField, Button, Typography, Paper, Divider, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { es } from 'date-fns/locale/es';
import { format } from 'date-fns'; // Para formatear la fecha
import { purchaseBillFormValidationSchema } from '../../../constants/validationSchemas'; // (A crear)

// SECCIÓN 2: SUB-COMPONENTES (UI)

const BillHeader = ({ values, setFieldValue, isSubmitting }) => (
    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Información de la Factura</Typography>
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="Número de Factura del Proveedor"
                    name="supplier_invoice_number"
                    value={values.supplier_invoice_number}
                    onChange={(e) => setFieldValue('supplier_invoice_number', e.target.value)}
                    required
                    disabled={isSubmitting}
                />
            </Grid>
            <Grid item xs={12} md={6}>
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
);

const BillItemsTable = ({ values, errors, touched, setFieldValue, isSubmitting }) => (
    <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Ítems Recibidos</Typography>
        <TableContainer component={Box}>
            <Table size="small" aria-label="Tabla de Ítems">
                <TableHead>
                    <TableRow>
                        <TableCell>Producto</TableCell>
                        <TableCell align="right">Cantidad Ordenada</TableCell>
                        <TableCell align="right">Cantidad Recibida</TableCell>
                        <TableCell align="right">Costo Unitario</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {values.items.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell>{item.name} ({item.sku})</TableCell>
                            <TableCell align="right">{item.quantity_ordered}</TableCell>
                            <TableCell align="right">
                                <TextField
                                    type="number"
                                    name={`items.${index}.quantity_received`}
                                    value={item.quantity_received}
                                    onChange={(e) => setFieldValue(`items.${index}.quantity_received`, Number(e.target.value))}
                                    error={touched.items?.[index]?.quantity_received && Boolean(errors.items?.[index]?.quantity_received)}
                                    helperText={touched.items?.[index]?.quantity_received && errors.items?.[index]?.quantity_received}
                                    disabled={isSubmitting}
                                    sx={{ width: 100 }}
                                    inputProps={{ min: 0, max: item.quantity_ordered }}
                                />
                            </TableCell>
                            <TableCell align="right">
                                <TextField
                                    type="number"
                                    name={`items.${index}.unit_cost`}
                                    value={item.unit_cost}
                                    onChange={(e) => setFieldValue(`items.${index}.unit_cost`, Number(e.target.value))}
                                    error={touched.items?.[index]?.unit_cost && Boolean(errors.items?.[index]?.unit_cost)}
                                    helperText={touched.items?.[index]?.unit_cost && errors.items?.[index]?.unit_cost}
                                    disabled={isSubmitting}
                                    sx={{ width: 100 }}
                                    inputProps={{ min: 0 }}
                                />
                            </TableCell>
                            <TableCell align="right">
                                S/ {(item.quantity_received * item.unit_cost).toFixed(2)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    </Paper>
);

// SECCIÓN 3: COMPONENTE PRINCIPAL (FORMULARIO CON FORMIK)
const PurchaseBillForm = ({ initialData, onSubmit, isSubmitting }) => {
    // Prepara los valores iniciales del formulario.
    const initialValues = useMemo(() => {
        const parseDate = (date) => {
            if (!date) return new Date(); // Si no hay fecha, se usa la fecha actual.
            if (date instanceof Date) return date;
            return new Date(date); // Intenta convertir la fecha.
        };

        return {
            supplier_invoice_number: initialData?.supplier_invoice_number || '',
            received_date: parseDate(initialData?.received_date),
            notes: initialData?.notes || '',
            // Inicializa los items con los datos de la orden de compra original.
            items: (initialData?.items || []).map(item => ({
                ...item,
                quantity_received: item.quantity_ordered, // Por defecto, la cantidad recibida es la cantidad ordenada
                unit_cost: item.unit_cost, // El costo inicial es el costo de la orden.
            })),
        };
    }, [initialData]);

    // Calcula el monto total de la factura.
    const totalAmount = useMemo(() => (
        initialValues.items.reduce((sum, item) => sum + (item.quantity_received * item.unit_cost), 0)
    ), [initialValues.items]);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Formik
                initialValues={initialValues}
                validationSchema={purchaseBillFormValidationSchema} // (Pendiente: Crear el esquema de validación)
                onSubmit={onSubmit}
                enableReinitialize
            >
                {({ values, errors, touched, setFieldValue }) => (
                    <Form noValidate>
                        <BillHeader values={values} setFieldValue={setFieldValue} isSubmitting={isSubmitting} />
                        <BillItemsTable values={values} errors={errors} touched={touched} setFieldValue={setFieldValue} isSubmitting={isSubmitting} />
                        <Divider sx={{ my: 4 }} />
                        <Grid container justifyContent="space-between" alignItems="center">
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Notas Adicionales"
                                    name="notes"
                                    value={values.notes}
                                    onChange={(e) => setFieldValue('notes', e.target.value)}
                                    multiline
                                    rows={3}
                                    disabled={isSubmitting}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="h5" align="right">
                                    Total de la Factura: S/ {totalAmount.toFixed(2)}
                                </Typography>
                            </Grid>
                        </Grid>
                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                                {isSubmitting ? 'Guardando...' : 'Registrar Recepción'}
                            </Button>
                            {isSubmitting && <CircularProgress size={24} sx={{ ml: 2 }} />}
                        </Box>
                    </Form>
                )}
            </Formik>
        </LocalizationProvider>
    );
};

export default PurchaseBillForm;