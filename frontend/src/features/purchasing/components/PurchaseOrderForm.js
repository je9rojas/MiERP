// /frontend/src/features/purchasing/components/PurchaseOrderForm.js

/**
 * @file Componente reutilizable y profesional para el formulario de Órdenes de Compra.
 * Carga dinámicamente proveedores y productos desde la API, incluye lógica avanzada para
 * condiciones de pago (Contado/Crédito) y gestiona el estado con Formik y Yup.
 */

// --- SECCIÓN 1: IMPORTACIONES ---
import React, { useState } from 'react';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import {
  Box, Grid, TextField, Button, Typography, Paper, Divider, IconButton,
  MenuItem, Autocomplete, Alert, CircularProgress
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { es } from 'date-fns/locale/es';
import { addDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

import { getSuppliersAPI } from '../../crm/api/suppliersAPI';
import { getProductsAPI } from '../../inventory/api/productsAPI';


// --- SECCIÓN 2: ESQUEMA DE VALIDACIÓN ---
const validationSchema = Yup.object().shape({
  supplier: Yup.object().nullable().required('Debe seleccionar un proveedor.'),
  order_date: Yup.date().required('La fecha de emisión es requerida.').typeError('Formato de fecha inválido.'),
  transaction_type: Yup.string().required('El tipo de transacción es requerido.'),
  items: Yup.array()
    .of(Yup.object().shape({
      product: Yup.object().nullable().required('Debe seleccionar un producto.'),
      quantity: Yup.number().min(1, 'La cantidad debe ser mayor a 0.').required('La cantidad es requerida.'),
      unit_cost: Yup.number().min(0, 'El costo no puede ser negativo.').required('El costo es requerido.'),
    }))
    .min(1, 'Debe añadir al menos un producto a la orden.'),
});


// --- SECCIÓN 3: COMPONENTE PRINCIPAL DEL FORMULARIO ---
const PurchaseOrderForm = ({ initialData = {}, onSubmit, isSubmitting }) => {

  const { data: suppliersData, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliersListForForm'],
    queryFn: () => getSuppliersAPI({ page: 1, pageSize: 1000 }),
  });
  const suppliersOptions = suppliersData?.items || [];

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['productsListForForm'],
    queryFn: () => getProductsAPI({ page: 1, pageSize: 1000 }),
  });
  const productsOptions = productsData?.items || [];

  const [taxPercentage, setTaxPercentage] = useState('18');

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Formik
        initialValues={{
          supplier: initialData.supplier || null,
          order_date: initialData.order_date || new Date(),
          expected_delivery_date: initialData.expected_delivery_date || null,
          transaction_type: initialData.transaction_type || 'contado',
          currency: initialData.currency || 'PEN',
          notes: initialData.notes || '',
          items: initialData.items || [{ product: null, quantity: 1, unit_cost: 0 }],
          installments: initialData.installments || [],
        }}
        validationSchema={validationSchema}
        onSubmit={(values) => {
          const apiPayload = {
            ...values,
            supplier_id: values.supplier?._id,
            items: values.items.map(item => ({
              product_id: item.product?._id,
              quantity: Number(item.quantity),
              unit_cost: Number(item.unit_cost),
            })),
          };
          delete apiPayload.supplier;
          onSubmit(apiPayload, taxPercentage);
        }}
        enableReinitialize
      >
        {({ values, errors, touched, setFieldValue, handleChange }) => {
          
          const subtotal = values.items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_cost)), 0);
          const taxAmount = subtotal * (parseFloat(taxPercentage) / 100);
          const totalAmount = subtotal + taxAmount;
          const installmentsTotal = values.installments.reduce((acc, inst) => acc + (Number(inst.amount) || 0), 0);

          const handleGenerateInstallments = (count) => {
            const installmentCount = parseInt(count, 10);
            if (isNaN(installmentCount) || installmentCount <= 0) {
              setFieldValue('installments', []);
              return;
            }
            const amountPerInstallment = totalAmount > 0 ? totalAmount / installmentCount : 0;
            const newInstallments = Array.from({ length: installmentCount }, (_, i) => ({
              due_date: addDays(values.order_date, (i + 1) * 30),
              amount: amountPerInstallment.toFixed(2),
            }));
            setFieldValue('installments', newInstallments);
          };

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
                      renderInput={(params) => <TextField {...params} label="Seleccionar Proveedor" required error={touched.supplier && Boolean(errors.supplier)} helperText={touched.supplier && errors.supplier} InputProps={{...params.InputProps, endAdornment: (<>{isLoadingSuppliers ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</>),}}/>}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField select fullWidth label="Empresa que emite" defaultValue="empresa1">
                      <MenuItem value="empresa1">MiEmpresa Principal S.A.C.</MenuItem>
                      <MenuItem value="empresa2">MiDistribuidora Global S.A.</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker label="Fecha de Emisión" value={values.order_date} onChange={(newValue) => setFieldValue('order_date', newValue)} slotProps={{ textField: { fullWidth: true, required: true } }} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker label="Entrega Esperada" value={values.expected_delivery_date} onChange={(newValue) => setFieldValue('expected_delivery_date', newValue)} slotProps={{ textField: { fullWidth: true } }} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField select fullWidth label="Tipo de Transacción" name="transaction_type" value={values.transaction_type} onChange={handleChange} required error={touched.transaction_type && Boolean(errors.transaction_type)}>
                      <MenuItem value="contado">Contado</MenuItem>
                      <MenuItem value="credito">Crédito</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField select fullWidth label="Moneda" name="currency" value={values.currency} onChange={handleChange}>
                      <MenuItem value="PEN">Soles (S/)</MenuItem>
                      <MenuItem value="USD">Dólares ($)</MenuItem>
                    </TextField>
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
                                  onChange={(event, newValue) => setFieldValue(`items.${index}.product`, newValue)}
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

              {values.transaction_type === 'credito' && (
                <Paper variant="outlined" sx={{ p: 3, my: 3 }}>
                  <Typography variant="h6" gutterBottom>Plan de Pagos a Crédito</Typography>
                  <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={4} md={3}>
                      <TextField
                        label="Generar N° de Cuotas"
                        type="number"
                        onChange={(event) => handleGenerateInstallments(event.target.value)}
                        InputProps={{ inputProps: { min: 1 } }}
                        fullWidth
                      />
                    </Grid>
                    {installmentsTotal > 0 && Math.abs(installmentsTotal - totalAmount) > 0.01 && (
                      <Grid item xs={12} sm={8} md={9}>
                        <Alert severity="warning" sx={{ width: '100%' }}>
                          La suma de las cuotas (S/ {installmentsTotal.toFixed(2)}) no coincide con el total de la orden (S/ {totalAmount.toFixed(2)}).
                        </Alert>
                      </Grid>
                    )}
                  </Grid>

                  <FieldArray name="installments">
                    {() => (
                      <Box>
                        {values.installments.map((installment, index) => (
                           <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 2, bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
                              <Grid item xs={12} sm={2}><Typography variant="body2" fontWeight="bold">Cuota #{index + 1}</Typography></Grid>
                              <Grid item xs={12} sm={5}>
                                <DatePicker label="Fecha de Vencimiento" value={installment.due_date} onChange={(newValue) => setFieldValue(`installments.${index}.due_date`, newValue)} slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
                              </Grid>
                              <Grid item xs={12} sm={5}><TextField fullWidth label="Monto" type="number" name={`installments.${index}.amount`} value={installment.amount} onChange={handleChange} size="small" /></Grid>
                           </Grid>
                        ))}
                      </Box>
                    )}
                  </FieldArray>
                </Paper>
              )}

              <Grid container justifyContent="flex-end">
                <Grid item xs={12} sm={5} md={4}>
                  <Box>
                    <Grid container spacing={1} sx={{ mb: 1 }}><Grid item xs={6}><Typography>Subtotal:</Typography></Grid><Grid item xs={6}><Typography align="right">S/ {subtotal.toFixed(2)}</Typography></Grid></Grid>
                    <Grid container spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Grid item xs={6}><TextField size="small" select fullWidth label="IGV" value={taxPercentage} onChange={(event) => setTaxPercentage(event.target.value)}><MenuItem value="18">IGV (18%)</MenuItem><MenuItem value="10">IGV (10%)</MenuItem><MenuItem value="0">Exonerado (0%)</MenuItem></TextField></Grid>
                      <Grid item xs={6}><Typography align="right">S/ {taxAmount.toFixed(2)}</Typography></Grid>
                    </Grid>
                    <Divider />
                    <Grid container spacing={1} sx={{ mt: 1 }}><Grid item xs={6}><Typography variant="h6">Total:</Typography></Grid><Grid item xs={6}><Typography align="right" variant="h6">S/ {totalAmount.toFixed(2)}</Typography></Grid></Grid>
                  </Box>
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