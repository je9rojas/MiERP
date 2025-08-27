// File: /frontend/src/features/purchasing/components/PurchaseOrderForm.js

/**
 * @file Componente reutilizable y profesional para el formulario de Órdenes de Compra.
 * @description Encapsula la UI y la lógica de estado del formulario utilizando Formik.
 * Es un componente de presentación que puede operar en modo de creación, edición o solo lectura.
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
import { purchaseOrderFormValidationSchema } from '../../../constants/validationSchemas';

// ==============================================================================
// SECCIÓN 2: SUB-COMPONENTES DE UI MODULARIZADOS
// ==============================================================================

const OrderHeader = ({ values, errors, touched, setFieldValue, suppliersOptions, isLoadingSuppliers, isReadOnly }) => (
    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Información General</Typography>
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <Autocomplete
                    options={suppliersOptions}
                    loading={isLoadingSuppliers}
                    value={values.supplier || null}
                    getOptionLabel={(option) => option?.business_name ? `${option.business_name} (RUC: ${option.tax_id})` : ""}
                    onChange={(_, newValue) => setFieldValue('supplier', newValue)}
                    readOnly={isReadOnly}
                    renderInput={(params) => (
                        <MuiTextField
                            {...params}
                            label="Proveedor"
                            required
                            error={touched.supplier && Boolean(errors.supplier)}
                            helperText={touched.supplier && errors.supplier}
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {isLoadingSuppliers ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <DatePicker label="Fecha de Emisión" value={values.order_date} readOnly={isReadOnly} onChange={(date) => setFieldValue('order_date', date)} slotProps={{ textField: { fullWidth: true, required: true } }} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <DatePicker label="Entrega Esperada" value={values.expected_delivery_date} readOnly={isReadOnly} onChange={(date) => setFieldValue('expected_delivery_date', date)} slotProps={{ textField: { fullWidth: true } }} />
            </Grid>
        </Grid>
    </Paper>
);

const OrderItemsArray = ({ values, setFieldValue, productsOptions, isReadOnly }) => (
    <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Ítems de la Orden</Typography>
        <FieldArray name="items">
            {({ push, remove }) => (
                <Box>
                    {values.items.map((item, index) => (
                        <Box key={index} sx={{ mb: 2, borderBottom: '1px solid #eee', pb: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={5}>
                                    <Autocomplete
                                        options={productsOptions}
                                        value={item.product || null}
                                        getOptionLabel={(option) => option?.sku ? `[${option.sku}] ${option.name}` : ""}
                                        onChange={(_, newValue) => {
                                            setFieldValue(`items.${index}.product`, newValue);
                                            setFieldValue(`items.${index}.unit_cost`, newValue?.average_cost || 0);
                                        }}
                                        readOnly={isReadOnly}
                                        renderInput={(params) => <MuiTextField {...params} name={`items.${index}.product`} label="Producto" required />}
                                    />
                                </Grid>
                                <Grid item xs={6} md={2}><Field component={TextField} fullWidth label="Cantidad" type="number" name={`items.${index}.quantity_ordered`} InputProps={{ readOnly: isReadOnly }} /></Grid>
                                <Grid item xs={6} md={2}><Field component={TextField} fullWidth label="Costo Unit." type="number" name={`items.${index}.unit_cost`} InputProps={{ readOnly: isReadOnly }} /></Grid>
                                <Grid item xs={10} md={2}><Typography align="right" variant="h6">S/ {(Number(item.quantity_ordered || 0) * Number(item.unit_cost || 0)).toFixed(2)}</Typography></Grid>
                                {!isReadOnly && (
                                    <Grid item xs={2} md={1}><IconButton disabled={values.items.length <= 1} onClick={() => remove(index)} color="error"><RemoveCircleOutlineIcon /></IconButton></Grid>
                                )}
                            </Grid>
                        </Box>
                    ))}
                    {!isReadOnly && (
                        <Button startIcon={<AddCircleOutlineIcon />} onClick={() => push({ product: null, quantity_ordered: 1, unit_cost: 0 })}>Añadir Ítem</Button>
                    )}
                </Box>
            )}
        </FieldArray>
    </Paper>
);

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL DEL FORMULARIO
// ==============================================================================

const PurchaseOrderForm = ({ initialData = null, onSubmit, isSubmitting, suppliersOptions = [], productsOptions = [], isLoadingSuppliers = false, isReadOnly = false }) => {
    const isEditMode = Boolean(initialData?.id);

    const initialValues = useMemo(() => {
        const parseDate = (dateString) => dateString ? new Date(dateString) : null;
        
        const defaults = {
            supplier: null,
            order_date: new Date(),
            expected_delivery_date: null,
            notes: '',
            items: [{ product: null, quantity_ordered: 1, unit_cost: 0 }],
        };

        if (!isEditMode) {
            return defaults;
        }

        return {
            ...defaults,
            ...initialData,
            order_date: parseDate(initialData.order_date) || new Date(),
            expected_delivery_date: parseDate(initialData.expected_delivery_date),
            // El `initialData` ahora se asume que llega con el objeto `supplier` completo
            // y con los `items` ya conteniendo los objetos `product` completos.
            // Esto elimina la necesidad de búsquedas `.find()` en el frontend.
        };
    }, [initialData, isEditMode]);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Formik initialValues={initialValues} validationSchema={purchaseOrderFormValidationSchema} onSubmit={onSubmit} enableReinitialize>
                {({ values, errors, touched, setFieldValue }) => {
                    const totalAmount = values.items.reduce((acc, item) => acc + (Number(item.quantity_ordered || 0) * Number(item.unit_cost || 0)), 0);
                    return (
                        <Form noValidate>
                            <OrderHeader values={values} errors={errors} touched={touched} setFieldValue={setFieldValue} suppliersOptions={suppliersOptions} isLoadingSuppliers={isLoadingSuppliers} isReadOnly={isReadOnly} />
                            <OrderItemsArray values={values} setFieldValue={setFieldValue} productsOptions={productsOptions} isReadOnly={isReadOnly} />
                            <Divider sx={{ my: 4 }} />
                            <Grid container justifyContent="space-between" alignItems="center">
                                <Grid item xs={12} md={7}>
                                    <Field component={TextField} name="notes" label="Notas Adicionales" fullWidth multiline rows={3} InputProps={{ readOnly: isReadOnly }} />
                                </Grid>
                                <Grid item xs={12} md={5}>
                                    <Typography variant="h5" align="right" fontWeight="bold">Total de la Orden: S/ {totalAmount.toFixed(2)}</Typography>
                                </Grid>
                            </Grid>
                            {!isReadOnly && (
                                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                                        {isSubmitting ? 'Procesando...' : (isEditMode ? 'Actualizar Orden' : 'Crear Orden de Compra')}
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

PurchaseOrderForm.propTypes = {
    initialData: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool,
    suppliersOptions: PropTypes.array,
    productsOptions: PropTypes.array,
    isLoadingSuppliers: PropTypes.bool,
    isReadOnly: PropTypes.bool,
};

export default PurchaseOrderForm;