// /frontend/src/features/purchasing/pages/NewPurchaseOrderPage.js
// PÁGINA PARA CREAR ÓRDENES DE COMPRA CON ARQUITECTURA DE HOOKS Y COMPONENTES

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';


import { 
  Container, Typography, Paper, Grid, TextField, Button, Box, IconButton, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider
} from '@mui/material'; // 'Alert' ha sido eliminado


import DeleteIcon from '@mui/icons-material/Delete';
import { DatePicker } from '@mui/x-date-pickers'; // LocalizationProvider ya está en index.js
import { useSnackbar } from 'notistack';

// --- SECCIÓN 1: IMPORTACIONES CORREGIDAS ---
import { useAuth } from '../../../app/contexts/AuthContext';
// Importamos los componentes comunes desde su ubicación centralizada
import SupplierAutocomplete from '../../../components/common/SupplierAutocomplete';
import ProductAutocomplete from '../../../components/common/ProductAutocomplete';
// Importamos la función de la API desde su nuevo módulo
import { createPurchaseOrderAPI } from '../api/purchasingAPI';


// --- SECCIÓN 2: CUSTOM HOOK (Lógica del Estado) ---
/**
 * Hook personalizado que encapsula toda la lógica de estado y los handlers
 * para el formulario de la orden de compra.
 * Esto mantiene el componente principal de la UI limpio y centrado en la presentación.
 */
const usePurchaseOrderForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [supplier, setSupplier] = useState(null);
  const [headerData, setHeaderData] = useState({
    order_date: new Date(),
    expected_delivery_date: null,
    notes: '',
  });
  const [items, setItems] = useState([{ id: Date.now(), product: null, quantity: 1, unit_cost: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Handlers de Eventos Optimizados ---
  const handleDateChange = useCallback((name, newValue) => {
    setHeaderData(prev => ({ ...prev, [name]: newValue }));
  }, []);

  const handleProductSelect = useCallback((index, selectedProduct) => {
    setItems(prevItems => prevItems.map((item, i) => 
      i === index ? { 
        ...item, 
        product: selectedProduct,
        unit_cost: selectedProduct?.cost || 0 
      } : item
    ));
  }, []);

const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    if (!supplier) {
      enqueueSnackbar("Por favor, seleccione un proveedor.", { variant: 'warning' });
      return;
    }
    setIsSubmitting(true);

    const payload = {
      supplier_id: supplier._id,
      order_date: headerData.order_date,
      expected_delivery_date: headerData.expected_delivery_date,
      notes: headerData.notes,
      items: items.map(item => ({
        product_id: item.product._id,
        quantity_ordered: parseInt(String(item.quantity), 10),
        unit_cost: parseFloat(String(item.unit_cost)),
      })).filter(item => item.product_id),
    };

    try {
      await createPurchaseOrderAPI(payload);
      enqueueSnackbar('Orden de Compra creada exitosamente.', { variant: 'success' });
      setTimeout(() => navigate('/compras/ordenes'), 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Ocurrió un error al guardar la orden.';
      enqueueSnackbar(errorMsg, { variant: 'error' });
      setIsSubmitting(false);
    }
}, [supplier, headerData, items, navigate, enqueueSnackbar]); // <-- 'user' ha sido eliminado de las dependencias





  return {
    models: { supplier, headerData, items, isSubmitting },
    handlers: { setSupplier, handleDateChange, handleProductSelect, handleItemFieldChange, addNewItemRow, removeItemRow, handleSubmit }
  };
};


// --- SECCIÓN 3: COMPONENTES DE PRESENTACIÓN (UI) ---
// Estos componentes son "tontos" y solo se encargan de mostrar la UI.

const OrderHeader = ({ supplier, onSupplierSelect, headerData, onDateChange }) => (
  <Grid container spacing={2} sx={{ mb: 4 }}>
    <Grid item xs={12} md={6}><SupplierAutocomplete value={supplier} onSelect={onSupplierSelect} /></Grid>
    <Grid item xs={12} sm={6} md={3}><DatePicker label="Fecha de Orden" value={headerData.order_date} onChange={(val) => onDateChange('order_date', val)} renderInput={(params) => <TextField {...params} fullWidth required />} /></Grid>
    <Grid item xs={12} sm={6} md={3}><DatePicker label="Fecha de Entrega Estimada" value={headerData.expected_delivery_date} onChange={(val) => onDateChange('expected_delivery_date', val)} renderInput={(params) => <TextField {...params} fullWidth />} /></Grid>
  </Grid>
);

const OrderItemsTable = ({ items, handlers }) => (
  <>
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead><TableRow><TableCell>Producto</TableCell><TableCell>Descripción</TableCell><TableCell>Cantidad</TableCell><TableCell>Costo Unit.</TableCell><TableCell>Total</TableCell><TableCell></TableCell></TableRow></TableHead>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={item.id}>
              <TableCell sx={{ width: '25%' }}><ProductAutocomplete onSelect={(prod) => handlers.handleProductSelect(index, prod)} /></TableCell>
              <TableCell><Typography variant="body2">{item.product?.name || ''}</Typography></TableCell>
              <TableCell sx={{ width: '10%' }}><TextField type="number" name="quantity" value={item.quantity} onChange={(e) => handlers.handleItemFieldChange(index, e)} size="small" fullWidth /></TableCell>
              <TableCell sx={{ width: '15%' }}><TextField type="number" name="unit_cost" value={item.unit_cost} onChange={(e) => handlers.handleItemFieldChange(index, e)} size="small" fullWidth /></TableCell>
              <TableCell>S/ {(item.quantity * item.unit_cost).toFixed(2)}</TableCell>
              <TableCell align="right">
                {items.length > 1 && <IconButton onClick={() => handlers.removeItemRow(index)} color="error" size="small"><DeleteIcon /></IconButton>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    <Button onClick={handlers.addNewItemRow} sx={{ mt: 2 }}>Añadir Producto</Button>
  </>
);

const OrderTotals = ({ items }) => {
  const totalAmount = useMemo(() => items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_cost)), 0), [items]);
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
      <Typography variant="h5" fontWeight="bold">Total de la Orden: S/ {totalAmount.toFixed(2)}</Typography>
    </Box>
  );
};


// --- SECCIÓN 4: COMPONENTE PRINCIPAL DE LA PÁGINA (Orquestador) ---
const NewPurchaseOrderPage = () => {
  const { models, handlers } = usePurchaseOrderForm();

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Paper component="form" onSubmit={handlers.handleSubmit} sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Registrar Nueva Orden de Compra
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        <OrderHeader supplier={models.supplier} onSupplierSelect={handlers.setSupplier} headerData={models.headerData} onDateChange={handlers.handleDateChange} />
        <OrderItemsTable items={models.items} handlers={handlers} />
        <OrderTotals items={models.items} />
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" variant="contained" size="large" disabled={models.isSubmitting || !models.supplier}>
            {models.isSubmitting ? 'Guardando...' : 'Guardar Orden de Compra'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default NewPurchaseOrderPage;