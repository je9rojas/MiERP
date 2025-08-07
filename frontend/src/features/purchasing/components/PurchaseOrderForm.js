// /frontend/src/features/purchasing/components/PurchaseOrderForm.js

/**
 * @file Componente reutilizable y profesional para el formulario de Órdenes de Compra.
 */

import React from 'react';
import { Formik, Form, FieldArray } from 'formik';
import { useQuery } from '@tanstack/react-query';
import {
    Box, Grid, TextField, Button, Typography, Paper, Divider, IconButton,
    Autocomplete, CircularProgress,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { es } from 'date-fns/locale/es';

import { getSuppliersAPI } from '../../crm/api/suppliersAPI';
import { getProductsAPI } from '../../inventory/api/productsAPI';
import { purchaseOrderFormValidationSchema } from '../../../constants/validationSchemas'; // Se importa el esquema

const useFormQueries = () => {
    const { data: suppliersData, isLoading: isLoadingSuppliers } = useQuery({
        queryKey: ['suppliersListForForm'],
        queryFn: () => getSuppliersAPI({ page: 1, page_size: 1000 }),
    });

    const { data: productsData, isLoading: isLoadingProducts } = useQuery({
        queryKey: ['productsListForForm'],
        queryFn: () => getProductsAPI({ page: 1, page_size: 1000 }),
    });

    return {
        suppliersOptions: suppliersData?.items || [],
        isLoadingSuppliers,
        productsOptions: productsData?.items || [],
        isLoadingProducts,
    };
};

const OrderHeader = ({ values, errors, touched, setFieldValue, suppliersOptions, isLoadingSuppliers }) => (
    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Información General</Typography>
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <Autocomplete
                    options={suppliersOptions}
                    loading={isLoadingSuppliers}
                    value={values.supplier}
                    getOptionLabel={(option) => `${option.business_name} (ID: ${option.tax_id})` || ""}
                    isOptionEqualToValue={(option, value) => option._id === value._id}
                    onChange={(event, newValue) => setFieldValue('supplier', newValue)}
                    renderInput={(params) => (
                        <TextField {...params} label="Seleccionar Proveedor" required error={touched.supplier && Boolean(errors.supplier)} helperText={touched.supplier && errors.supplier}
                            InputProps={{ ...params.InputProps, endAdornment: (<>{isLoadingSuppliers ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</>),}}
                        />
                    )}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <DatePicker label="Fecha de Emisión" value={values.order_date} onChange={(newValue) => setFieldValue('order_date', newValue)} slotProps={{ textField: { fullWidth: true, required: true } }} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <DatePicker label="Entrega Esperada" value={values.expected_delivery_date} onChange={(newValue) => setFieldValue('expected_delivery_date', newValue)} slotProps={{ textField: { fullWidth: true } }} />
            </Grid>
        </Grid>
    </Paper>
);

const OrderItemsArray = ({ values, errors, touched, setFieldValue, productsOptions, isLoadingProducts }) => (
    <>
        <Typography variant="h6" gutterBottom>Productos de la Orden</Typography>
        <FieldArray name="items">
            {({ push, remove }) => (
                <Box>
                    {values.items.map((item, index) => (
                        <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={5}>
                                    <Autocomplete
                                        options={productsOptions}
                                        loading={isLoadingProducts}
                                        value={item.product}
                                        getOptionLabel={(option) => `[${option.sku}] ${option.name}` || ""}
                                        isOptionEqualToValue={(option, value) => option._id === value._id}
                                        onChange={(event, newValue) => {
                                            setFieldValue(`items.${index}.product`, newValue);
                                            setFieldValue(`items.${index}.unit_cost`, newValue?.cost || 0);
                                        }}
                                        renderInput={(params) => <TextField {...params} label="Producto" required error={touched.items?.[index]?.product && Boolean(errors.items?.[index]?.product)} InputProps={{ ...params.InputProps, endAdornment: (<>{isLoadingProducts ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</>),}}/>}
                                    />
                                </Grid>
                                <Grid item xs={6} md={2}>
                                    <TextField fullWidth label="Cantidad" type="number" name={`items.${index}.quantity_ordered`} value={item.quantity_ordered} onChange={(e) => setFieldValue(`items.${index}.quantity_ordered`, e.target.value)} required error={touched.items?.[index]?.quantity_ordered && Boolean(errors.items?.[index]?.quantity_ordered)} />
                                </Grid>
                                <Grid item xs={6} md={2}>
                                    <TextField fullWidth label="Costo Unitario" type="number" name={`items.${index}.unit_cost`} value={item.unit_cost} onChange={(e) => setFieldValue(`items.${index}.unit_cost`, e.target.value)} required error={touched.items?.[index]?.unit_cost && Boolean(errors.items?.[index]?.unit_cost)} />
                                </Grid>
                                <Grid item xs={10} md={2}>
                                    <Typography align="right" variant="h6">S/ {(Number(item.quantity_ordered) * Number(item.unit_cost)).toFixed(2)}</Typography>
                                </Grid>
                                <Grid item xs={2} md={1}>
                                    <IconButton disabled={values.items.length <= 1} onClick={() => remove(index)} color="error"><RemoveCircleOutlineIcon /></IconButton>
                                </Grid>
                            </Grid>
                        </Paper>
                    ))}
                    <Button startIcon={<AddCircleOutlineIcon />} onClick={() => push({ product: null, quantity_ordered: 1, unit_cost: 0 })}>
                        Adicionar Producto
                    </Button>
                </Box>
            )}
        </FieldArray>
    </>
);

const PurchaseOrderForm = ({ initialData = {}, onSubmit, isSubmitting }) => {
    const { suppliersOptions, isLoadingSuppliers, productsOptions, isLoadingProducts } = useFormQueries();

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Formik
                initialValues={{
                    supplier: initialData.supplier || null,
                    order_date: initialData.order_date || new Date(),
                    expected_delivery_date: initialData.expected_delivery_date || null,
                    notes: initialData.notes || '',
                    items: initialData.items || [{ product: null, quantity_ordered: 1, unit_cost: 0 }],
                }}
                validationSchema={purchaseOrderFormValidationSchema} // Se usa el esquema importado
                onSubmit={onSubmit}
                enableReinitialize
            >
                {({ values, errors, touched, setFieldValue }) => {
                    const totalAmount = values.items.reduce((acc, item) => acc + (Number(item.quantity_ordered) * Number(item.unit_cost)), 0);

                    return (
                        <Form noValidate>
                            <OrderHeader
                                values={values} errors={errors} touched={touched} setFieldValue={setFieldValue}
                                suppliersOptions={suppliersOptions} isLoadingSuppliers={isLoadingSuppliers}
                            />

                            <OrderItemsArray
                                values={values} errors={errors} touched={touched} setFieldValue={setFieldValue}
                                productsOptions={productsOptions} isLoadingProducts={isLoadingProducts}
                            />
                            
                            <Divider sx={{ my: 4 }} />

                            <Grid container justifyContent="space-between" alignItems="center">
                                <Grid item xs={12} md={6}>
                                    <TextField fullWidth label="Notas Adicionales" name="notes" value={values.notes} onChange={(e) => setFieldValue('notes', e.target.value)} multiline rows={3} />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Typography variant="h5" align="right">Total de la Orden: S/ {totalAmount.toFixed(2)}</Typography>
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                                <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                                    {isSubmitting ? 'Guardando...' : 'Crear Orden de Compra'}
                                </Button>
                            </Box>
                        </Form>
                    );
                }}
            </Formik>
        </LocalizationProvider>
    );
};

export default PurchaseOrderForm;