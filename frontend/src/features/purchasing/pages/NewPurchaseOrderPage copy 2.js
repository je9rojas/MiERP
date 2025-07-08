// /frontend/src/features/purchasing/pages/NewPurchaseOrderPage.js

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Paper, Grid, TextField, Button, Box, IconButton, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, Divider 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import es from 'date-fns/locale/es';

import SupplierAutocomplete from '../components/SupplierAutocomplete';
import ProductAutocomplete from '../components/ProductAutocomplete';
import { createPurchaseOrderAPI } from '../../../api/purchasingAPI';
import { useAuth } from '../../../app/contexts/AuthContext';

const createInitialItemRow = () => ({
  id: Date.now() + Math.random(),
  product_code: '',
  description: '',
  related_quote: '',
  quantity: 1,
  unit_cost: 0,
});

const NewPurchaseOrderPage = () => {
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
  const [items, setItems] = useState([createInitialItemRow()]);
  const [taxPercentage, setTaxPercentage] = useState(18.0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  const handleHeaderChange = (e) => {
    setHeaderData({ ...headerData, [e.target.name]: e.target.value });
  };
  
  const handleDateChange = (name, newValue) => {
    setHeaderData({ ...headerData, [name]: newValue });
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = items.map((item, i) => 
      i === index ? { ...item, [name]: value } : item
    );
    setItems(updatedItems);
  };
  
  const handleProductSelect = (index, product) => {
    if (!product) return;
    const updatedItems = items.map((item, i) => 
      i === index ? { ...item, product_code: product.main_code, description: product.name } : item
    );
    setItems(updatedItems);
  };

  const addNewItemRow = () => {
    setItems([...items, createInitialItemRow()]);
  };

  const removeItemRow = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    if (updatedItems.length === 0) {
      setItems([createInitialItemRow()]);
    } else {
      setItems(updatedItems);
    }
  };

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_cost)), 0), [items]);
  const taxAmount = useMemo(() => subtotal * (Number(taxPercentage) / 100), [subtotal, taxPercentage]);
  const totalAmount = useMemo(() => subtotal + taxAmount + Number(otherCharges), [subtotal, taxAmount, otherCharges]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplier) {
      setError("Por favor, seleccione un proveedor.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess('');

    const purchaseOrderPayload = {
      supplier_code: supplier.code,
      supplier_invoice_code: headerData.supplier_invoice_code || null,
      purchase_date: headerData.purchase_date.toISOString().split('T')[0],
      issue_date: headerData.issue_date.toISOString().split('T')[0],
      due_date: headerData.due_date.toISOString().split('T')[0],
      payment_method: headerData.payment_method,
      items: items.map(item => ({
        product_code: item.product_code, description: item.description, related_quote: item.related_quote,
        quantity: parseInt(item.quantity, 10), unit_cost: parseFloat(item.unit_cost),
      })).filter(item => item.product_code),
      tax_percentage: parseFloat(taxPercentage),
      other_charges: parseFloat(otherCharges),
      registered_by_user_id: user?.username,
      buyer_name: "Mi Empresa de Filtros S.A.C",
      buyer_tax_id: "98765432-1",
      buyer_legal_address: "Calle Falsa 123, Mi Ciudad"
    };

    try {
      await createPurchaseOrderAPI(purchaseOrderPayload);
      setSuccess('¡Orden de Compra registrada exitosamente!');
      setSupplier(null);
      setHeaderData({
          supplier_invoice_code: '', purchase_date: new Date(),
          issue_date: new Date(), due_date: new Date(), payment_method: 'Crédito 30 días',
      });
      setItems([createInitialItemRow()]);
    } catch (err) {
      setError(err.response?.data?.detail || 'Ocurrió un error al registrar la compra.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <Paper sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Registrar Nueva Compra
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <SupplierAutocomplete 
                  value={supplier} 
                  onSelect={(newValue) => {
                    setSupplier(newValue);
                    if (newValue) setError(null);
                  }}
                  error={!!(error && !supplier)}
                  helperText={error && !supplier ? error : ''}
                /> 
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField name="supplier_invoice_code" label="N° Factura Proveedor" value={headerData.supplier_invoice_code} onChange={handleHeaderChange} fullWidth required />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <DatePicker label="Fecha de Compra" value={headerData.purchase_date} onChange={(val) => handleDateChange('purchase_date', val)} renderInput={(params) => <TextField {...params} fullWidth required />} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <DatePicker label="Fecha de Emisión" value={headerData.issue_date} onChange={(val) => handleDateChange('issue_date', val)} renderInput={(params) => <TextField {...params} fullWidth required />} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <DatePicker label="Fecha de Vencimiento" value={headerData.due_date} onChange={(val) => handleDateChange('due_date', val)} renderInput={(params) => <TextField {...params} fullWidth required />} />
              </Grid>
            </Grid>
            
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
                      <TableCell><ProductAutocomplete onSelect={(prod) => handleProductSelect(index, prod)} /></TableCell>
                      <TableCell><TextField variant="outlined" size="small" name="description" value={item.description} onChange={(e) => handleItemChange(index, e)} fullWidth /></TableCell>
                      <TableCell><TextField variant="outlined" size="small" type="number" name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} InputProps={{ inputProps: { min: 1 } }} fullWidth /></TableCell>
                      <TableCell><TextField variant="outlined" size="small" type="number" name="unit_cost" value={item.unit_cost} onChange={(e) => handleItemChange(index, e)} InputProps={{ inputProps: { step: 0.01, min: 0 } }} fullWidth /></TableCell>
                      <TableCell>S/ {(item.quantity * item.unit_cost).toFixed(2)}</TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => removeItemRow(index)} color="error" disabled={items.length <= 1}><DeleteIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Button onClick={addNewItemRow} sx={{ mt: 2 }}>Añadir Fila</Button>
            
            <Grid container sx={{ mt: 2 }} justifyContent="flex-end">
              <Grid item xs={12} md={5} lg={4}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">Subtotal Neto:</Typography>
                    <Typography variant="body1" fontWeight="bold">S/ {subtotal.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body1">Impuesto (%):</Typography>
                    <TextField 
                      size="small" 
                      type="number" 
                      value={taxPercentage} 
                      onChange={(e) => setTaxPercentage(e.target.value)}
                      sx={{ width: '100px' }}
                      InputProps={{ inputProps: { step: 0.01, min: 0 } }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">Monto Impuesto:</Typography>
                    <Typography variant="body1" fontWeight="bold">S/ {taxAmount.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body1">Otros Cargos:</Typography>
                    <TextField 
                      size="small" 
                      type="number" 
                      value={otherCharges} 
                      onChange={(e) => setOtherCharges(e.target.value)}
                      sx={{ width: '100px' }}
                      InputProps={{ inputProps: { step: 0.01, min: 0 } }}
                    />
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Typography variant="h6">TOTAL:</Typography>
                    <Typography variant="h6" fontWeight="bold">S/ {totalAmount.toFixed(2)}</Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained" color="primary" size="large" disabled={isLoading || !supplier}>
                {isLoading ? 'Registrando...' : 'Confirmar y Recibir Mercancía'}
              </Button>
            </Box>
            
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
          </form>
        </Paper>
      </LocalizationProvider>
    </Container>
  );
};

export default NewPurchaseOrderPage;