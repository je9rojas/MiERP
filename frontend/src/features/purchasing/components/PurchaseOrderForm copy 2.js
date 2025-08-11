// frontend/src/features/purchasing/components/PurchaseOrderForm.js

/**
 * @file Componente reutilizable y profesional para el formulario de Órdenes de Compra.
 * @description Encapsula la UI y la lógica de estado del formulario utilizando Formik.
 * Es un componente de presentación que recibe todos los datos y opciones como props.
 */

// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
import React, { useMemo } from 'react';
import { Formik, Form, FieldArray } from 'formik';
import {
    Box, Grid, TextField, Button, Typography, Paper, Divider, IconButton,
    Autocomplete, CircularProgress,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { es } from 'date-fns/locale/es';
import { purchaseOrderFormValidationSchema } from '../../../constants/validationSchemas';

// SECCIÓN 2: SUB-COMPONENTES
const OrderHeader = ({ values, errors, touched, setFieldValue, suppliersOptions, isLoadingSuppliers, isEditMode }) => (
    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Información General</Typography>
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <Autocomplete
                    options={suppliersOptions}
                    loading={isLoadingSuppliers}
                    value={values.supplier}
                    getOptionLabel={(option) => option.business_name ? `${option.business_name} (RUC: ${option.tax_id})` : ""}
                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                    onChange={(event, newValue) => setFieldValue('supplier', newValue)}
                    readOnly={isEditMode}
                    renderInput={(params) => (
                        <TextField {...params} label="Proveedor" required error={touched.supplier && Boolean(errors.supplier)} helperText={touched.supplier && errors.supplier}
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
    <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Productos de la Orden</Typography>
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
                                        getOptionLabel={(option) => option.sku ? `[${option.sku}] ${option.name}` : ""}
                                        isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                        onChange={(event, newValue) => {
                                            setFieldValue(`items.${index}.product`, newValue);
                                            setFieldValue(`items.${index}.unit_cost`, newValue?.average_cost || 0);
                                        }}
                                        renderInput={(params) => <TextField {...params} label="Producto" required error={touched.items?.[index]?.product && Boolean(errors.items?.[index]?.product)} InputProps={{ ...params.InputProps, endAdornment: (<>{isLoadingProducts ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</>),}}/>}
                                    />
                                </Grid>
                                <Grid item xs={6} md={2}><TextField fullWidth label="Cantidad" type="number" name={`items.${index}.quantity_ordered`} value={item.quantity_ordered} onChange={(e) => setFieldValue(`items.${index}.quantity_ordered`, Number(e.target.value))} required error={touched.items?.[index]?.quantity_ordered && Boolean(errors.items?.[index]?.quantity_ordered)} inputProps={{ min: 1 }} /></Grid>
                                <Grid item xs={6} md={2}><TextField fullWidth label="Costo Unitario" type="number" name={`items.${index}.unit_cost`} value={item.unit_cost} onChange={(e) => setFieldValue(`items.${index}.unit_cost`, Number(e.target.value))} required error={touched.items?.[index]?.unit_cost && Boolean(errors.items?.[index]?.unit_cost)} inputProps={{ min: 0 }} /></Grid>
                                <Grid item xs={10} md={2}><Typography align="right" variant="h6">S/ {(Number(item.quantity_ordered) * Number(item.unit_cost)).toFixed(2)}</Typography></Grid>
                                <Grid item xs={2} md={1}><IconButton disabled={values.items.length <= 1} onClick={() => remove(index)} color="error"><RemoveCircleOutlineIcon /></IconButton></Grid>
                            </Grid>
                        </Box>
                    ))}
                    <Button startIcon={<AddCircleOutlineIcon />} onClick={() => push({ product: null, quantity_ordered: 1, unit_cost: 0 })}>
                        Adicionar Producto
                    </Button>
                </Box>
            )}
        </FieldArray>
    </Paper>
);

// SECCIÓN 3: COMPONENTE PRINCIPAL DEL FORMULARIO
const PurchaseOrderForm = ({ initialData = {}, onSubmit, isSubmitting, suppliersOptions, productsOptions, isLoadingSuppliers, isLoadingProducts }) => {
    const isEditMode = !!initialData.id;

    const initialValues = useMemo(() => {
        // --- INICIO DE LA SECCIÓN DE DEPURACIÓN ---
        console.groupCollapsed("[DEBUG] PurchaseOrderForm - Cálculo de initialValues");
        console.log("Modo Edición:", isEditMode);
        console.log("Datos Iniciales (initialData):", initialData);
        console.log("Opciones de Productos (productsOptions):", productsOptions);
        // --- FIN DE LA SECCIÓN DE DEPURACIÓN ---

        const parseDate = (date) => {
            if (!date) return null;
            if (date instanceof Date) return date;
            return new Date(date);
        };

        let items = [{ product: null, quantity_ordered: 1, unit_cost: 0 }];
        
        if (isEditMode && initialData.items && productsOptions.length > 0) {
            console.log("Hidratando productos de la orden...");
            items = initialData.items.map((item, index) => {
                const foundProduct = productsOptions.find(p => p.id === item.product_id);
                
                // Log detallado por cada item
                console.log(`Item #${index + 1}: Buscando product_id '${item.product_id}'...`, {
                    idBuscado: item.product_id,
                    tipoIdBuscado: typeof item.product_id,
                    primerIdDeOpciones: productsOptions.length > 0 ? productsOptions[0].id : "N/A",
                    tipoPrimerId: productsOptions.length > 0 ? typeof productsOptions[0].id : "N/A",
                    productoEncontrado: foundProduct || "¡NO ENCONTRADO!"
                });

                return {
                    ...item,
                    product: foundProduct || null
                };
            });
        } else if (isEditMode) {
            console.warn("Modo edición activo, pero no se pudo hidratar la lista de productos. ¿Están llegando los `productsOptions`?");
        }

        const finalValues = {
            supplier: initialData.supplier || null,
            order_date: parseDate(initialData.order_date) || new Date(),
            expected_delivery_date: parseDate(initialData.expected_delivery_date),
            notes: initialData.notes || '',
            items: items,
        };
        
        console.log("Valores Iniciales Finales para Formik:", finalValues);
        console.groupEnd();
        
        return finalValues;

    }, [initialData, isEditMode, productsOptions]);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Formik
                initialValues={initialValues}
                validationSchema={purchaseOrderFormValidationSchema}
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
                                isEditMode={isEditMode}
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
                                    {isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar Orden' : 'Crear Orden de Compra')}
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