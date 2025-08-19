// /frontend/src/features/sales/components/SalesOrderForm.js

/**
 * @file Componente de presentación reutilizable para el formulario de Órdenes de Venta.
 *
 * Este componente es responsable únicamente de la UI del formulario. Recibe todos
 * los datos, opciones de autocompletado y callbacks como props. Implementa la
 * lógica para "congelar" el precio de los productos al momento de la venta.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field, FieldArray } from 'formik';
import {
    Box, Grid, TextField as MuiTextField, Button, Typography, Paper, Divider,
    IconButton, Autocomplete, CircularProgress
} from '@mui/material';
import { TextField } from 'formik-material-ui';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { es } from 'date-fns/locale/es';

import { salesOrderFormValidationSchema } from '../../../constants/validationSchemas';

// ==============================================================================
// SECCIÓN 2: SUB-COMPONENTES DE UI
// ==============================================================================

const OrderHeader = ({ values, errors, touched, setFieldValue, customerOptions, isLoadingCustomers }) => (
    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Información General</Typography>
        <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
                <Autocomplete
                    options={customerOptions}
                    loading={isLoadingCustomers}
                    value={values.customer}
                    getOptionLabel={(option) => option.business_name ? `${option.business_name} (${option.doc_type.toUpperCase()}: ${option.doc_number})` : ""}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onChange={(_event, newValue) => setFieldValue('customer', newValue)}
                    renderInput={(params) => (
                        <MuiTextField {...params} label="Seleccionar Cliente" required error={touched.customer && Boolean(errors.customer)} helperText={touched.customer && errors.customer}
                            InputProps={{ ...params.InputProps, endAdornment: (<>{isLoadingCustomers ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</>),}}
                        />
                    )}
                />
            </Grid>
            <Grid item xs={12} md={4}>
                <DatePicker label="Fecha de la Orden" value={values.order_date} onChange={(date) => setFieldValue('order_date', date)} slotProps={{ textField: { fullWidth: true, required: true, error: touched.order_date && Boolean(errors.order_date), helperText: touched.order_date && errors.order_date } }} />
            </Grid>
        </Grid>
    </Paper>
);

const OrderItemsArray = ({ values, errors, touched, setFieldValue, productsOptions = [] }) => (
    <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Ítems de la Venta</Typography>
        <FieldArray name="items">
            {({ push, remove }) => (
                <Box>
                    {values.items.map((item, index) => (
                        <Box key={index} sx={{ mb: 2, borderBottom: '1px solid #eee', pb: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={5}>
                                    <Autocomplete
                                        options={productsOptions}
                                        value={item.product}
                                        getOptionLabel={(option) => option.sku ? `[${option.sku}] ${option.name}` : ""}
                                        isOptionEqualToValue={(option, value) => option.id === value.id}
                                        onChange={(_event, newValue) => {
                                            setFieldValue(`items.${index}.product`, newValue);
                                            setFieldValue(`items.${index}.unit_price`, newValue?.price || 0);
                                        }}
                                        renderInput={(params) => <MuiTextField {...params} label="Producto" required error={touched.items?.[index]?.product && Boolean(errors.items?.[index]?.product)} />}
                                    />
                                </Grid>
                                <Grid item xs={6} md={2}>
                                    <Field component={TextField} fullWidth label="Cantidad" type="number" name={`items.${index}.quantity`} inputProps={{ min: 1 }} />
                                </Grid>
                                <Grid item xs={6} md={2}>
                                    <Field component={TextField} fullWidth label="Precio Unit." type="number" name={`items.${index}.unit_price`} inputProps={{ min: 0, step: "0.01" }} />
                                </Grid>
                                <Grid item xs={10} md={2}>
                                    <Typography align="right" variant="h6">
                                        S/ {(Number(item.quantity || 0) * Number(item.unit_price || 0)).toFixed(2)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={2} md={1}>
                                    <IconButton disabled={values.items.length <= 1} onClick={() => remove(index)} color="error">
                                        <RemoveCircleOutlineIcon />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        </Box>
                    ))}
                    <Button startIcon={<AddCircleOutlineIcon />} onClick={() => push({ product: null, quantity: 1, unit_price: 0 })}>
                        Añadir Ítem
                    </Button>
                </Box>
            )}
        </FieldArray>
    </Paper>
);

// ... (El resto del componente principal y los propTypes permanecen igual)
const SalesOrderForm = ({
    initialData = null,
    onSubmit,
    isSubmitting,
    customerOptions = [],
    isLoadingCustomers,
    productsOptions = [],
}) => {
    const isEditMode = !!initialData?.id;

    const initialValues = useMemo(() => {
        const defaults = {
            customer: null,
            order_date: new Date(),
            notes: '',
            items: [{ product: null, quantity: 1, unit_price: 0 }],
        };
        
        if (isEditMode) { return { /* ... */ }; }
        return defaults;
    }, [initialData, isEditMode, customerOptions]);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Formik
                initialValues={initialValues}
                validationSchema={salesOrderFormValidationSchema}
                onSubmit={onSubmit}
                enableReinitialize
            >
                {({ values, errors, touched, setFieldValue }) => {
                    const totalAmount = values.items.reduce((acc, item) => {
                        const quantity = Number(item.quantity) || 0;
                        const price = Number(item.unit_price) || 0;
                        return acc + (quantity * price);
                    }, 0);

                    return (
                        <Form noValidate>
                            <OrderHeader values={values} errors={errors} touched={touched} setFieldValue={setFieldValue} customerOptions={customerOptions} isLoadingCustomers={isLoadingCustomers} />
                            <OrderItemsArray values={values} errors={errors} touched={touched} setFieldValue={setFieldValue} productsOptions={productsOptions} />
                            <Divider sx={{ my: 4 }} />
                            <Grid container justifyContent="space-between" alignItems="flex-start" spacing={3}>
                                <Grid item xs={12} md={7}>
                                    <Field component={TextField} name="notes" label="Notas Adicionales" fullWidth multiline rows={4} />
                                </Grid>
                                <Grid item xs={12} md={5}>
                                    <Typography variant="h5" align="right" fontWeight="bold">
                                        Total de la Venta: S/ {totalAmount.toFixed(2)}
                                    </Typography>
                                </Grid>
                            </Grid>
                            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                                    {isSubmitting ? 'Procesando...' : (isEditMode ? 'Actualizar Orden' : 'Crear Orden de Venta')}
                                </Button>
                            </Box>
                        </Form>
                    );
                }}
            </Formik>
        </LocalizationProvider>
    );
};

SalesOrderForm.propTypes = {
    initialData: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool,
    customerOptions: PropTypes.array,
    isLoadingCustomers: PropTypes.bool,
    productsOptions: PropTypes.array,
};

export default SalesOrderForm;