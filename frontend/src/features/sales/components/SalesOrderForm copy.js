// /frontend/src/features/sales/components/SalesOrderForm.js

/**
 * @file Componente de presentación reutilizable para el formulario de Órdenes de Venta.
 *
 * Este componente es responsable únicamente de la UI del formulario. Recibe todos
 * los datos (initialData), opciones de autocompletado (clientes, productos) y
 * callbacks como props. Puede operar en modo de edición o de solo lectura.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useMemo } from 'react';
import { Formik, Form, FieldArray } from 'formik';
import {
    Box, Grid, TextField, Button, Typography, Paper, Divider, IconButton,
    Autocomplete, CircularProgress
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { es } from 'date-fns/locale/es';
import { salesOrderFormValidationSchema } from '../../../constants/validationSchemas';

// ==============================================================================
// SECCIÓN 2: SUB-COMPONENTES DE UI
// ==============================================================================

const OrderHeader = ({ values, errors, touched, setFieldValue, customersOptions, isLoadingCustomers, isReadOnly }) => (
    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Información General de la Venta</Typography>
        <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
                <Autocomplete
                    options={customersOptions}
                    loading={isLoadingCustomers}
                    value={values.customer}
                    getOptionLabel={(option) => option.name ? `${option.name} (RUC: ${option.tax_id})` : ""}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onChange={(event, newValue) => setFieldValue('customer', newValue)}
                    readOnly={isReadOnly}
                    renderInput={(params) => (
                        <TextField {...params} label="Seleccionar Cliente" required error={touched.customer && Boolean(errors.customer)} helperText={touched.customer && errors.customer}
                            InputProps={{ ...params.InputProps, endAdornment: (<>{isLoadingCustomers ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</>),}}
                        />
                    )}
                />
            </Grid>
            <Grid item xs={12} md={4}>
                <DatePicker label="Fecha de la Orden" value={values.order_date} readOnly={isReadOnly} onChange={(newValue) => setFieldValue('order_date', newValue)} slotProps={{ textField: { fullWidth: true, required: true } }} />
            </Grid>
        </Grid>
    </Paper>
);

const OrderItemsArray = ({ values, errors, touched, setFieldValue, productsOptions, isLoadingProducts, isReadOnly }) => (
    <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Productos de la Venta</Typography>
        <FieldArray name="items">
            {({ push, remove }) => (
                <Box>
                    {values.items.map((item, index) => (
                        <Box key={index} sx={{ mb: 2, borderBottom: '1px solid #eee', pb: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={5}>
                                    <Autocomplete
                                        options={productsOptions}
                                        loading={isLoadingProducts}
                                        value={item.product}
                                        getOptionLabel={(option) => `[${option.sku}] ${option.name}` || ""}
                                        isOptionEqualToValue={(option, value) => option.id === value.id}
                                        readOnly={isReadOnly}
                                        onChange={(_event, newValue) => {
                                            setFieldValue(`items.${index}.product`, newValue);
                                            setFieldValue(`items.${index}.unit_price`, newValue?.price || 0);
                                        }}
                                        renderInput={(params) => <TextField {...params} label="Producto" required error={touched.items?.[index]?.product && Boolean(errors.items?.[index]?.product)} InputProps={{ ...params.InputProps, endAdornment: (<>{isLoadingProducts ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</>),}} />}
                                    />
                                </Grid>
                                <Grid item xs={6} md={2}><TextField fullWidth label="Cantidad" type="number" name={`items.${index}.quantity`} value={item.quantity} onChange={(e) => setFieldValue(`items.${index}.quantity`, e.target.value)} required error={touched.items?.[index]?.quantity && Boolean(errors.items?.[index]?.quantity)} inputProps={{ min: 1, readOnly: isReadOnly }} /></Grid>
                                <Grid item xs={6} md={2}><TextField fullWidth label="Precio Unit." type="number" name={`items.${index}.unit_price`} value={item.unit_price} onChange={(e) => setFieldValue(`items.${index}.unit_price`, e.target.value)} required error={touched.items?.[index]?.unit_price && Boolean(errors.items?.[index]?.unit_price)} inputProps={{ min: 0, readOnly: isReadOnly }} /></Grid>
                                <Grid item xs={10} md={2}><Typography align="right" variant="h6">S/ {(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}</Typography></Grid>
                                {!isReadOnly && (
                                    <Grid item xs={2} md={1}><IconButton disabled={values.items.length <= 1} onClick={() => remove(index)} color="error"><RemoveCircleOutlineIcon /></IconButton></Grid>
                                )}
                            </Grid>
                        </Box>
                    ))}
                    {!isReadOnly && (
                        <Button startIcon={<AddCircleOutlineIcon />} onClick={() => push({ product: null, quantity: 1, unit_price: 0 })}>
                            Añadir Producto
                        </Button>
                    )}
                </Box>
            )}
        </FieldArray>
    </Paper>
);

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL DEL FORMULARIO
// ==============================================================================

const SalesOrderForm = ({ initialData = {}, onSubmit, isSubmitting, isReadOnly = false, customersOptions, isLoadingCustomers, productsOptions, isLoadingProducts }) => {
    const isEditMode = !!initialData.id;

    const initialValues = useMemo(() => {
        const parseDate = (date) => (date ? new Date(date) : new Date());

        let items = [{ product: null, quantity: 1, unit_price: 0 }];
        if (isEditMode && initialData.items && productsOptions.length > 0) {
            items = initialData.items.map(item => ({
                ...item,
                product: productsOptions.find(p => p.id === item.product_id) || null
            }));
        }

        return {
            customer: initialData.customer || null,
            order_date: parseDate(initialData.order_date),
            notes: initialData.notes || '',
            shipping_address: initialData.shipping_address || '',
            items: items,
        };
    }, [initialData, isEditMode, productsOptions]);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Formik
                initialValues={initialValues}
                validationSchema={salesOrderFormValidationSchema}
                onSubmit={onSubmit}
                enableReinitialize
            >
                {({ values, errors, touched, setFieldValue }) => {
                    const totalAmount = values.items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_price)), 0);

                    return (
                        <Form noValidate>
                            <OrderHeader values={values} errors={errors} touched={touched} setFieldValue={setFieldValue} customersOptions={customersOptions} isLoadingCustomers={isLoadingCustomers} isReadOnly={isReadOnly} />
                            <OrderItemsArray values={values} errors={errors} touched={touched} setFieldValue={setFieldValue} productsOptions={productsOptions} isLoadingProducts={isLoadingProducts} isReadOnly={isReadOnly} />
                            <Divider sx={{ my: 4 }} />
                            <Grid container justifyContent="space-between" alignItems="flex-start" spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField fullWidth label="Dirección de Envío" name="shipping_address" value={values.shipping_address} onChange={(e) => setFieldValue('shipping_address', e.target.value)} multiline rows={2} InputProps={{ readOnly: isReadOnly }} />
                                    <TextField fullWidth label="Notas Adicionales" name="notes" value={values.notes} onChange={(e) => setFieldValue('notes', e.target.value)} multiline rows={2} sx={{ mt: 2 }} InputProps={{ readOnly: isReadOnly }} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Typography variant="h5" align="right" fontWeight="bold">Total de la Venta: S/ {totalAmount.toFixed(2)}</Typography>
                                </Grid>
                            </Grid>
                            {!isReadOnly && (
                                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                                        {isSubmitting ? 'Procesando...' : (isEditMode ? 'Actualizar Orden' : 'Crear Orden de Venta')}
                                    </Button>
                                </Box>
                            )}
                        </Form>
                    );
                }}
            </Formik>
        </LocalizationProvider>
    );
};

export default SalesOrderForm;