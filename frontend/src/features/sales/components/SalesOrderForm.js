// /frontend/src/features/sales/components/SalesOrderForm.js

/**
 * @file Componente reutilizable y profesional para el formulario de Órdenes de Venta.
 *
 * Carga dinámicamente clientes y productos desde la API utilizando React Query,
 * gestiona el estado complejo del formulario con Formik y proporciona validación
 * en tiempo real con Yup.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React from 'react';
import { Formik, Form, FieldArray } from 'formik';
import { useQuery } from '@tanstack/react-query';
import {
    Box, Grid, TextField, Button, Typography, Paper, Divider, IconButton,
    Autocomplete, CircularProgress
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { es } from 'date-fns/locale/es';

import { getProductsAPI } from '../../inventory/api/productsAPI';
import { getCustomersAPI } from '../../crm/api/customersAPI';
import { salesOrderFormValidationSchema } from '../../../constants/validationSchemas';

// ==============================================================================
// SECCIÓN 2: LÓGICA DE DATOS Y VALIDACIÓN
// ==============================================================================

const useFormQueries = () => {
    const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
        queryKey: ['customersListForForm'],
        queryFn: () => getCustomersAPI({ page: 1, page_size: 1000 }),
    });

    const { data: productsData, isLoading: isLoadingProducts } = useQuery({
        queryKey: ['productsListForForm'],
        queryFn: () => getProductsAPI({ page: 1, page_size: 1000 }),
    });

    return {
        customersOptions: customersData?.items || [],
        isLoadingCustomers,
        productsOptions: productsData?.items || [],
        isLoadingProducts,
    };
};

// ==============================================================================
// SECCIÓN 3: SUB-COMPONENTES DE UI
// ==============================================================================

const OrderHeader = ({ values, errors, touched, setFieldValue, customersOptions, isLoadingCustomers }) => (
    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Información General de la Venta</Typography>
        <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
                <Autocomplete
                    options={customersOptions}
                    loading={isLoadingCustomers}
                    value={values.customer_id}
                    getOptionLabel={(option) => `${option.business_name} (ID: ${option.doc_number})` || ""}
                    isOptionEqualToValue={(option, value) => option._id === value._id}
                    onChange={(event, newValue) => setFieldValue('customer_id', newValue)}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Seleccionar Cliente"
                            required
                            error={touched.customer_id && Boolean(errors.customer_id)}
                            helperText={touched.customer_id && errors.customer_id}
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (<>{isLoadingCustomers ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</>),
                            }}
                        />
                    )}
                />
            </Grid>
            <Grid item xs={12} md={4}>
                <DatePicker label="Fecha de la Orden" value={values.order_date} onChange={(newValue) => setFieldValue('order_date', newValue)} slotProps={{ textField: { fullWidth: true, required: true } }} />
            </Grid>
        </Grid>
    </Paper>
);

const OrderItemsArray = ({ values, errors, touched, setFieldValue, productsOptions, isLoadingProducts }) => (
    <>
        <Typography variant="h6" gutterBottom>Productos de la Venta</Typography>
        <FieldArray name="items">
            {({ push, remove }) => (
                <Box>
                    {values.items.map((item, index) => (
                        <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={6}>
                                    <Autocomplete
                                        options={productsOptions}
                                        loading={isLoadingProducts}
                                        value={item.product}
                                        getOptionLabel={(option) => `[${option.sku}] ${option.name}` || ""}
                                        isOptionEqualToValue={(option, value) => option._id === value._id}
                                        onChange={(event, newValue) => setFieldValue(`items.${index}.product`, newValue)}
                                        renderInput={(params) => <TextField {...params} label="Producto" required error={touched.items?.[index]?.product && Boolean(errors.items?.[index]?.product)} InputProps={{ ...params.InputProps, endAdornment: (<>{isLoadingProducts ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</>),}} />}
                                    />
                                </Grid>
                                <Grid item xs={6} md={2}>
                                    <TextField fullWidth label="Cantidad" type="number" name={`items.${index}.quantity`} value={item.quantity} onChange={(e) => setFieldValue(`items.${index}.quantity`, e.target.value)} required error={touched.items?.[index]?.quantity && Boolean(errors.items?.[index]?.quantity)} />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography align="right" variant="h6">S/ {(Number(item.quantity) * (item.product?.price || 0)).toFixed(2)}</Typography>
                                </Grid>
                                <Grid item xs={2} md={1}>
                                    <IconButton disabled={values.items.length <= 1} onClick={() => remove(index)} color="error"><RemoveCircleOutlineIcon /></IconButton>
                                </Grid>
                            </Grid>
                        </Paper>
                    ))}
                    <Button startIcon={<AddCircleOutlineIcon />} onClick={() => push({ product: null, quantity: 1 })}>
                        Añadir Producto
                    </Button>
                </Box>
            )}
        </FieldArray>
    </>
);

// ==============================================================================
// SECCIÓN 4: COMPONENTE PRINCIPAL DEL FORMULARIO
// ==============================================================================

const SalesOrderForm = ({ initialData = {}, onSubmit, isSubmitting }) => {
    const { customersOptions, isLoadingCustomers, productsOptions, isLoadingProducts } = useFormQueries();

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Formik
                initialValues={{
                    customer_id: initialData.customer_id || null,
                    order_date: initialData.order_date || new Date(),
                    notes: initialData.notes || '',
                    shipping_address: initialData.shipping_address || '',
                    items: initialData.items || [{ product: null, quantity: 1 }],
                }}
                validationSchema={salesOrderFormValidationSchema}
                onSubmit={onSubmit}
                enableReinitialize
            >
                {({ values, errors, touched, setFieldValue }) => {
                    const totalAmount = values.items.reduce((acc, item) => acc + (Number(item.quantity) * (item.product?.price || 0)), 0);

                    return (
                        <Form noValidate>
                            <OrderHeader
                                values={values} errors={errors} touched={touched} setFieldValue={setFieldValue}
                                customersOptions={customersOptions} isLoadingCustomers={isLoadingCustomers}
                            />

                            <OrderItemsArray
                                values={values} errors={errors} touched={touched} setFieldValue={setFieldValue}
                                productsOptions={productsOptions} isLoadingProducts={isLoadingProducts}
                            />
                            
                            <Divider sx={{ my: 4 }} />

                            <Grid container justifyContent="space-between" alignItems="flex-start" spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField fullWidth label="Dirección de Envío" name="shipping_address" value={values.shipping_address} onChange={(e) => setFieldValue('shipping_address', e.target.value)} multiline rows={2} />
                                    <TextField fullWidth label="Notas Adicionales" name="notes" value={values.notes} onChange={(e) => setFieldValue('notes', e.target.value)} multiline rows={2} sx={{ mt: 2 }}/>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Typography variant="h5" align="right" fontWeight="bold">Total de la Venta: S/ {totalAmount.toFixed(2)}</Typography>
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                                    {isSubmitting ? 'Procesando Venta...' : 'Crear Orden de Venta'}
                                </Button>
                            </Box>
                        </Form>
                    );
                }}
            </Formik>
        </LocalizationProvider>
    );
};

export default SalesOrderForm;