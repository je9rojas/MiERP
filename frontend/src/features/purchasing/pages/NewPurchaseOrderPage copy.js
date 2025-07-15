// /frontend/src/features/purchasing/pages/NewPurchaseOrderPage.js
// CÓDIGO COMPLETO, REFACTORIZADO Y PROFESIONAL - LISTO PARA COPIAR Y PEGAR

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Paper, Grid, TextField, Button, Box, IconButton, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import es from 'date-fns/locale/es';

// Los autocompletados ahora son componentes comunes
import SupplierAutocomplete from '../../../components/common/SupplierAutocomplete';
import ProductAutocomplete from '../../../components/common/ProductAutocomplete';

// El archivo de API ahora está dentro de su propia feature
// import { createPurchaseOrderAPI } from '../api/purchasingAPI'; // Comentado hasta que se implemente
import { useAuth } from '../../../app/contexts/AuthContext';

// --- HOOK PERSONALIZADO: Contiene toda la lógica del formulario ---
const usePurchaseOrder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [supplier, setSupplier] = useState(null);
  const [headerData, setHeaderData] = useState({
    supplier_invoice_code: '',
    purchase_date: new Date(),
    issue_date: new Date(),
    due_date: new Date(),
    payment_method: 'Crédito 30 días',
  });
  const [items, setItems] = useState([{ id: Date.now(), product_code: '', description: '', quantity: 1, unit_cost: 0 }]);
  const [taxPercentage, setTaxPercentage] = useState(18.0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [apiState, setApiState] = useState({ isLoading: false, error: null, success: '' });

  // --- Manejadores de eventos (usamos useCallback para optimización) ---
  const handleHeaderChange = useCallback((e) => {
    setHeaderData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);
  
  const handleDateChange = useCallback((name, newValue) => {
    setHeaderData(prev => ({ ...prev, [name]: newValue }));
  }, []);

  const handleItemChange = useCallback((index, e) => {
    const { name, value } = e.target;
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [name]: value } : item));
  }, []);
  
  const handleProductSelect = useCallback((index, product) => {
    if (!product) return;
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, product_code: product.main_code, description: product.name } : item
    ));
  }, []);

  const addNewItemRow = useCallback(() => {
    setItems(prev => [...prev, { id: Date.now(), product_code: '', description: '', quantity: 1, unit_cost: 0 }]);
  }, []);

  const removeItemRow = useCallback((index) => {
    setItems(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.length > 0 ? updated : [{ id: Date.now(), product_code: '', description: '', quantity: 1, unit_cost: 0 }];
    });
  }, []);

  // --- Cálculos (useMemo para eficiencia) ---
  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_cost)), 0);
    const taxAmount = subtotal * (Number(taxPercentage) / 100);
    const totalAmount = subtotal + taxAmount + Number(otherCharges);
    return { subtotal, taxAmount, totalAmount };
  }, [items, taxPercentage, otherCharges]);

  // --- Lógica de envío a la API ---
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!supplier) {
      setApiState({ isLoading: false, error: "Por favor, seleccione un proveedor.", success: '' });
      return;
    }
    setApiState({ isLoading: true, error: null, success: '' });

    const payload = {
      supplier_code: supplier.code,
      supplier_invoice_code: headerData.supplier_invoice_code || null,
      purchase_date: headerData.purchase_date.toISOString().split('T')[0],
      issue_date: headerData.issue_date.toISOString().split('T')[0],
      due_date: headerData.due_date.toISOString().split('T')[0],
      payment_method: headerData.payment_method,
      items: items.map(({ product_code, description, quantity, unit_cost }) => ({
        product_code, description,
        quantity: parseInt(quantity, 10),
        unit_cost: parseFloat(unit_cost),
      })).filter(item => item.product_code),
      tax_percentage: parseFloat(taxPercentage),
      other_charges: parseFloat(otherCharges),
      registered_by_user_id: user?.username,
    };

    try {
      await createPurchaseOrderAPI(payload);
      setApiState({ isLoading: false, error: null, success: '¡Orden guardada como borrador exitosamente!' });
      setTimeout(() => navigate('/compras/ordenes'), 2000);
    } catch (err) {
      setApiState({ isLoading: false, error: err.response?.data?.detail || 'Ocurrió un error al guardar.', success: '' });
    }
  }, [supplier, headerData, items, taxPercentage, otherCharges, user, navigate]);

  return {
    models: { supplier, headerData, items, taxPercentage, otherCharges, apiState, totals },
    handlers: { setSupplier, handleHeaderChange, handleDateChange, handleItemChange, handleProductSelect, addNewItemRow, removeItemRow, setTaxPercentage, setOtherCharges, handleSubmit }
  };
};

// --- COMPONENTES HIJOS (Presentacionales) ---

const OrderHeader = ({ models, handlers }) => (
  <Grid container spacing={3} sx={{ mb: 4 }}>
    <Grid item xs={12} md={6}>
      <SupplierAutocomplete 
        value={models.supplier} 
        onSelect={handlers.setSupplier}
        error={!!(models.apiState.error && !models.supplier)}
        helperText={models.apiState.error && !models.supplier ? "Seleccione un proveedor" : ''}
      /> 
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField name="supplier_invoice_code" label="N° Factura Proveedor (Opcional)" value={models.headerData.supplier_invoice_code} onChange={handlers.handleHeaderChange} fullWidth />
    </Grid>
    <Grid item xs={12} sm={6} md={4}>
      <DatePicker label="Fecha de Compra" value={models.headerData.purchase_date} onChange={(val) => handlers.handleDateChange('purchase_date', val)} renderInput={(params) => <TextField {...params} fullWidth required />} />
    </Grid>
    <Grid item xs={12} sm={6} md={4}>
      <DatePicker label="Fecha de Emisión OC" value={models.headerData.issue_date} onChange={(val) => handlers.handleDateChange('issue_date', val)} renderInput={(params) => <TextField {...params} fullWidth required />} />
    </Grid>
    <Grid item xs={12} sm={6} md={4}>
      <DatePicker label="Fecha de Vencimiento" value={models.headerData.due_date} onChange={(val) => handlers.handleDateChange('due_date', val)} renderInput={(params) => <TextField {...params} fullWidth required />} />
    </Grid>
  </Grid>
);

const OrderItemsTable = ({ items, handlers }) => (
  <>
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{width: '25%', p: 1.5}}>Código Producto</TableCell>
            <TableCell sx={{ p: 1.5 }}>Descripción</TableCell>
            <TableCell sx={{width: '10%', p: 1.5}}>Cantidad</TableCell>
            <TableCell sx={{width: '15%', p: 1.5}}>Costo Unit.</TableCell>
            <TableCell sx={{width: '15%', p: 1.5}}>Total</TableCell>
            <TableCell sx={{width: '5%', p: 1.5}}></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={item.id}>
              <TableCell><ProductAutocomplete onSelect={(prod) => handlers.handleProductSelect(index, prod)} /></TableCell>
              <TableCell><TextField variant="outlined" size="small" name="description" value={item.description} onChange={(e) => handlers.handleItemChange(index, e)} fullWidth /></TableCell>
              <TableCell><TextField variant="outlined" size="small" type="number" name="quantity" value={item.quantity} onChange={(e) => handlers.handleItemChange(index, e)} InputProps={{ inputProps: { min: 1 } }} fullWidth /></TableCell>
              <TableCell><TextField variant="outlined" size="small" type="number" name="unit_cost" value={item.unit_cost} onChange={(e) => handlers.handleItemChange(index, e)} InputProps={{ inputProps: { step: 0.01, min: 0 } }} fullWidth /></TableCell>
              <TableCell>S/ {(item.quantity * item.unit_cost).toFixed(2)}</TableCell>
              <TableCell align="right">
                <IconButton onClick={() => handlers.removeItemRow(index)} color="error" disabled={items.length <= 1}><DeleteIcon /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    <Button onClick={handlers.addNewItemRow} sx={{ mt: 2 }}>Añadir Fila</Button>
  </>
);

const OrderTotals = ({ totals, taxPercentage, onTaxChange, otherCharges, onOtherChargesChange }) => (
  <Grid container sx={{ mt: 2 }} justifyContent="flex-end">
    <Grid item xs={12} md={5} lg={4}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" mb={1}><Typography>Subtotal Neto:</Typography><Typography fontWeight="bold">S/ {totals.subtotal.toFixed(2)}</Typography></Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography>Impuesto (%):</Typography>
          <TextField size="small" type="number" value={taxPercentage} onChange={onTaxChange} sx={{ width: '100px' }} InputProps={{ inputProps: { step: 0.01, min: 0 } }} />
        </Box>
        <Box display="flex" justifyContent="space-between" mb={1}><Typography>Monto Impuesto:</Typography><Typography fontWeight="bold">S/ {totals.taxAmount.toFixed(2)}</Typography></Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography>Otros Cargos:</Typography>
          <TextField size="small" type="number" value={otherCharges} onChange={onOtherChargesChange} sx={{ width: '100px' }} InputProps={{ inputProps: { step: 0.01, min: 0 } }} />
        </Box>
        <Divider />
        <Box display="flex" justifyContent="space-between" mt={2}><Typography variant="h6">TOTAL:</Typography><Typography variant="h6" fontWeight="bold">S/ {totals.totalAmount.toFixed(2)}</Typography></Box>
      </Paper>
    </Grid>
  </Grid>
);

// --- COMPONENTE PRINCIPAL (Orquestador) ---
const NewPurchaseOrderPage = () => {
  const { models, handlers } = usePurchaseOrder();

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <Paper sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Registrar Nueva Orden de Compra
          </Typography>
          
          <form onSubmit={handlers.handleSubmit}>
            <OrderHeader models={models} handlers={handlers} />
            <OrderItemsTable items={models.items} handlers={handlers} />
            <OrderTotals 
              totals={models.totals}
              taxPercentage={models.taxPercentage}
              onTaxChange={(e) => handlers.setTaxPercentage(e.target.value)}
              otherCharges={models.otherCharges}
              onOtherChargesChange={(e) => handlers.setOtherCharges(e.target.value)}
            />
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained" color="primary" size="large" disabled={models.apiState.isLoading || !models.supplier}>
                {models.apiState.isLoading ? 'Guardando...' : 'Guardar Borrador de Orden'}
              </Button>
            </Box>
            
            {models.apiState.error && <Alert severity="error" sx={{ mt: 2 }}>{models.apiState.error}</Alert>}
            {models.apiState.success && <Alert severity="success" sx={{ mt: 2 }}>{models.apiState.success}</Alert>}
          </form>
        </Paper>
      </LocalizationProvider>
    </Container>
  );
};

export default NewPurchaseOrderPage;