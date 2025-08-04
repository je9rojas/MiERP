// /frontend/src/features/purchasing/pages/NewPurchaseOrderPage.js
// PÁGINA FINAL Y PROFESIONAL PARA CREAR ÓRDENES DE COMPRA

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Paper, Grid, TextField, Button, Box, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { DatePicker } from '@mui/x-date-pickers';
import { useSnackbar } from 'notistack';

// --- SECCIÓN 1: IMPORTACIONES DE LA APLICACIÓN ---
import { createPurchaseOrderAPI } from '../api/purchasingAPI';
import SupplierAutocomplete from '../../../components/common/SupplierAutocomplete';
import ProductAutocomplete from '../../../components/common/ProductAutocomplete';


// --- SECCIÓN 2: CUSTOM HOOK (Encapsula toda la lógica de estado y handlers) ---
const usePurchaseOrderForm = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Estados del formulario
  const [supplier, setSupplier] = useState(null);
  const [headerData, setHeaderData] = useState({
    order_date: new Date(),
    expected_delivery_date: null,
    notes: '',
  });
  const [items, setItems] = useState([{ id: Date.now(), product: null, quantity: 1, unit_cost: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Handlers de Eventos Optimizados con useCallback ---
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
  
  const handleItemFieldChange = useCallback((index, event) => {
    const { name, value } = event.target;
    setItems(prevItems => prevItems.map((item, i) => 
      i === index ? { ...item, [name]: value } : item
    ));
  }, []);

  const addNewItemRow = useCallback(() => {
    setItems(prev => [...prev, { id: Date.now(), product: null, quantity: 1, unit_cost: 0 }]);
  }, []);

  const removeItemRow = useCallback((index) => {
    setItems(prev => {
      if (prev.length <= 1) return prev; // No permitir borrar la última fila
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // --- Lógica de Envío a la API ---
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
      items: items
        .filter(item => item.product?._id)
        .map(item => ({
          product_id: item.product._id,
          quantity_ordered: parseInt(String(item.quantity), 10) || 1,
          unit_cost: parseFloat(String(item.unit_cost)) || 0,
        })),
    };
    
    if (payload.items.length === 0) {
        enqueueSnackbar("Debe añadir al menos un producto a la orden.", { variant: 'warning' });
        setIsSubmitting(false);
        return;
    }

    try {
      await createPurchaseOrderAPI(payload);
      enqueueSnackbar('Orden de Compra creada exitosamente.', { variant: 'success' });
      setTimeout(() => navigate('/compras/ordenes'), 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Ocurrió un error al guardar la orden.';
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }, [supplier, headerData, items, navigate, enqueueSnackbar]);

  // Objeto de retorno del hook, separando modelos y handlers
  return {
    models: { supplier, headerData, items, isSubmitting },
    handlers: { setSupplier, handleDateChange, handleProductSelect, handleItemFieldChange, addNewItemRow, removeItemRow, handleSubmit }
  };
};


// --- SECCIÓN 3: COMPONENTES DE PRESENTACIÓN (UI) ---
const OrderHeader = ({ supplier, onSupplierSelect, headerData, onDateChange }) => (
  <Grid container spacing={2} sx={{ mb: 3 }}>
    <Grid item xs={12} md={6}>
      <SupplierAutocomplete 
        value={supplier} 
        onSelect={onSupplierSelect}
      />
    </Grid>
    <Grid item xs={12} sm={6} md={3}>
      <DatePicker 
        label="Fecha de Orden" 
        value={headerData.order_date} 
        onChange={(val) => onDateChange('order_date', val)} 
        renderInput={(params) => <TextField {...params} fullWidth required />} 
      />
    </Grid>
    <Grid item xs={12} sm={6} md={3}>
      <DatePicker 
        label="Fecha de Entrega Estimada" 
        value={headerData.expected_delivery_date} 
        onChange={(val) => onDateChange('expected_delivery_date', val)} 
        renderInput={(params) => <TextField {...params} fullWidth />} 
      />
    </Grid>
  </Grid>
);

const OrderItemsTable = ({ items, handlers }) => (
  <Box>
    <Typography variant="h6" gutterBottom>Ítems de la Orden</Typography>
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '35%', fontWeight: 'bold' }}>Producto</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Descripción</TableCell>
            <TableCell align="right" sx={{ width: '10%', fontWeight: 'bold' }}>Cantidad</TableCell>
            <TableCell align="right" sx={{ width: '15%', fontWeight: 'bold' }}>Costo Unit.</TableCell>
            <TableCell align="right" sx={{ width: '15%', fontWeight: 'bold' }}>Total</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={item.id}>
              <TableCell><ProductAutocomplete onSelect={(prod) => handlers.handleProductSelect(index, prod)} /></TableCell>
              <TableCell><Typography variant="body2" color="text.secondary">{item.product?.name || '---'}</Typography></TableCell>
              <TableCell><TextField type="number" name="quantity" value={item.quantity} onChange={(e) => handlers.handleItemFieldChange(index, e)} size="small" fullWidth inputProps={{ style: { textAlign: 'right' }}} /></TableCell>
              <TableCell><TextField type="number" name="unit_cost" value={item.unit_cost} onChange={(e) => handlers.handleItemFieldChange(index, e)} size="small" fullWidth inputProps={{ style: { textAlign: 'right' }}} /></TableCell>
              <TableCell align="right"><Typography variant="body2" fontWeight="bold">S/ {(Number(item.quantity) * Number(item.unit_cost)).toFixed(2)}</Typography></TableCell>
              <TableCell align="center">
                {items.length > 1 && <IconButton onClick={() => handlers.removeItemRow(index)} color="error" size="small"><DeleteIcon fontSize="small" /></IconButton>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    <Button startIcon={<AddCircleOutlineIcon />} onClick={handlers.addNewItemRow} sx={{ mt: 2 }}>
      Añadir Ítem
    </Button>
  </Box>
);

const OrderTotals = ({ items }) => {
  const totalAmount = useMemo(() => 
    items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_cost)), 0), 
    [items]
  );
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
      <Typography variant="h5" fontWeight="bold">
        Total de la Orden: S/ {totalAmount.toFixed(2)}
      </Typography>
    </Box>
  );
};


// --- SECCIÓN 4: COMPONENTE PRINCIPAL DE LA PÁGINA (Orquestador) ---
const NewPurchaseOrderPage = () => {
  const { models, handlers } = usePurchaseOrderForm();

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Paper component="form" onSubmit={handlers.handleSubmit} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Registrar Nueva Orden de Compra
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        <OrderHeader 
          supplier={models.supplier} 
          onSupplierSelect={handlers.setSupplier} 
          headerData={models.headerData} 
          onDateChange={handlers.handleDateChange} 
        />
        
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