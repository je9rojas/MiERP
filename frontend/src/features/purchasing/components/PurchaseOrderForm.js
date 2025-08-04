/**
 * @file Componente reutilizable y profesional para el formulario de Órdenes de Compra.
 * Carga dinámicamente proveedores y productos desde la API usando React Query,
 * incluye lógica avanzada para condiciones de pago y gestiona el estado con Formik.
 */

import React from 'react';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Grid, TextField, Button, Typography, Paper, Divider, IconButton,
  MenuItem, Autocomplete, Alert, CircularProgress
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { es } from 'date-fns/locale/es';
import { getSuppliersAPI } from '../../crm/api/suppliersAPI';
import { getProductsAPI } from '../../inventory/api/productsAPI';

// Esquema de Validación de Yup
const validationSchema = Yup.object().shape({
  supplier: Yup.object().nullable().required('Debe seleccionar un proveedor.'),
  order_date: Yup.date().required('La fecha de emisión es requerida.').typeError('Formato de fecha inválido.'),
  items: Yup.array()
    .of(Yup.object().shape({
      product: Yup.object().nullable().required('Debe seleccionar un producto.'),
      quantity: Yup.number().min(1, 'La cantidad debe ser mayor a 0.').required('La cantidad es requerida.'),
      unit_cost: Yup.number().min(0, 'El costo no puede ser negativo.').required('El costo es requerido.'),
    }))
    .min(1, 'Debe añadir al menos un producto a la orden.'),
});

const PurchaseOrderForm = ({ initialData = {}, onSubmit, isSubmitting }) => {
  // Carga de datos para los autocompletables usando React Query
  const { data: suppliersData, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliersList'],
    queryFn: () => getSuppliersAPI({ page: 1, pageSize: 1000 }), // Pedimos hasta 1000 proveedores
  });
  const suppliersOptions = suppliersData?.items || [];

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['productsList'],
    queryFn: () => getProductsAPI({ page: 1, pageSize: 1000 }),
  });
  const productsOptions = productsData?.items || [];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Formik
        initialValues={{
          supplier: initialData.supplier || null,
          order_date: initialData.order_date || new Date(),
          expected_delivery_date: initialData.expected_delivery_date || null,
          notes: initialData.notes || '',
          items: initialData.items || [{ product: null, quantity: 1, unit_cost: 0 }],
        }}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, setFieldValue, handleChange }) => {
          const totalAmount = values.items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_cost)), 0);

          return (
            <Form noValidate>
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Información General</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={suppliersOptions}
                      loading={isLoadingSuppliers}
                      value={values.supplier}
                      getOptionLabel={(option) => `${option.business_name} (RUC: ${option.ruc})` || ""}
                      isOptionEqualToValue={(option, value) => option._id === value._id}
                      onChange={(event, newValue) => setFieldValue('supplier', newValue)}
                      renderInput={(params) => (
                        <TextField {...params} label="Seleccionar Proveedor" required error={touched.supplier && Boolean(errors.supplier)} helperText={touched.supplier && errors.supplier}
                          InputProps={{ ...params.InputProps, endAdornment: (<>{isLoadingSuppliers ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</>), }}
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
                                  renderInput={(params) => <TextField {...params} label="Producto" required error={touched.items?.[index]?.product && Boolean(errors.items?.[index]?.product)} InputProps={{...params.InputProps, endAdornment: (<>{isLoadingProducts ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</>),}}/>}
                              />
                            </Grid>
                            <Grid item xs={6} md={2}><TextField fullWidth label="Cantidad" type="number" name={`items.${index}.quantity`} value={item.quantity} onChange={handleChange} required error={touched.items?.[index]?.quantity && Boolean(errors.items?.[index]?.quantity)} /></Grid>
                            <Grid item xs={6} md={2}><TextField fullWidth label="Costo Unitario" type="number" name={`items.${index}.unit_cost`} value={item.unit_cost} onChange={handleChange} required error={touched.items?.[index]?.unit_cost && Boolean(errors.items?.[index]?.unit_cost)} /></Grid>
                            <Grid item xs={10} md={2}><Typography align="right" variant="h6">S/ {(Number(item.quantity) * Number(item.unit_cost)).toFixed(2)}</Typography></Grid>
                            <Grid item xs={2} md={1}><IconButton disabled={values.items.length <= 1} onClick={() => remove(index)} color="error"><RemoveCircleOutlineIcon /></IconButton></Grid>
                         </Grid>
                      </Paper>
                    ))}
                    <Button startIcon={<AddCircleOutlineIcon />} onClick={() => push({ product: null, quantity: 1, unit_cost: 0 })}>
                      Adicionar Producto
                    </Button>
                  </Box>
                )}
              </FieldArray>
              
              <Divider sx={{ my: 4 }} />

              <Grid container justifyContent="flex-end">
                  <Grid item xs={12} md={4}>
                      <Typography variant="h5" align="right">Total: S/ {totalAmount.toFixed(2)}</Typography>
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