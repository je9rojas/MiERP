// /frontend/src/features/purchasing/pages/NewPurchaseOrderPage.js
// CÓDIGO COMPLETO LISTO PARA PROGRAMAR LA INTERFAZ

import React, { useState, useEffect, useMemo } from 'react';
import { Container, Typography, Paper, Grid, TextField, Button, Box, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
// Asumimos que tienes componentes de autocompletado y selectores de fecha
// import SupplierAutocomplete from '../components/SupplierAutocomplete';
// import ProductAutocomplete from '../components/ProductAutocomplete';
// import { DatePicker } from '@mui/x-date-pickers'; // Ejemplo de librería de fechas
import { createPurchaseOrderAPI } from '../../../api/purchasingAPI'; // API a crear
import { useAuth } from '../../../app/contexts/AuthContext';

// Plantilla para un nuevo ítem en la tabla
const initialItemRow = {
  product_code: '',
  description: '',
  related_quote: '',
  quantity: 1,
  unit_cost: 0,
};

const NewPurchaseOrderPage = () => {
  const { user } = useAuth(); // Para auditoría
  const [supplier, setSupplier] = useState(null); // Objeto del proveedor seleccionado
  const [headerData, setHeaderData] = useState({
    supplier_invoice_code: '',
    purchase_date: new Date(),
    issue_date: new Date(),
    due_date: new Date(),
    payment_method: 'Crédito 30 días',
  });
  const [items, setItems] = useState([initialItemRow]);
  const [taxPercentage, setTaxPercentage] = useState(18.0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // --- MANEJADORES DE ESTADO ---

  const handleHeaderChange = (e) => {
    setHeaderData({ ...headerData, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, e) => {
    const updatedItems = [...items];
    updatedItems[index][e.target.name] = e.target.value;
    setItems(updatedItems);
  };
  
  // Función para manejar la selección de un producto desde un autocompletado
  const handleProductSelect = (index, product) => {
    const updatedItems = [...items];
    updatedItems[index].product_code = product.main_code;
    updatedItems[index].description = product.name;
    // podrías autocompletar el costo si tienes un historial
    setItems(updatedItems);
  };

  const addNewItemRow = () => {
    setItems([...items, { ...initialItemRow }]);
  };

  const removeItemRow = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  // --- CÁLCULOS FINANCIEROS (usando useMemo para optimización) ---

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_cost)), 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    return subtotal * (Number(taxPercentage) / 100);
  }, [subtotal, taxPercentage]);

  const totalAmount = useMemo(() => {
    return subtotal + taxAmount + Number(otherCharges);
  }, [subtotal, taxAmount, otherCharges]);


  // --- LÓGICA DE ENVÍO ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const purchaseOrderPayload = {
      // --- Datos del Encabezado ---
      supplier_code: supplier.code,
      supplier_invoice_code: headerData.supplier_invoice_code,
      // Formatear fechas a YYYY-MM-DD para el backend
      purchase_date: headerData.purchase_date.toISOString().split('T')[0],
      issue_date: headerData.issue_date.toISOString().split('T')[0],
      due_date: headerData.due_date.toISOString().split('T')[0],
      payment_method: headerData.payment_method,
      
      // --- Ítems ---
      items: items.map(item => ({
        product_code: item.product_code,
        description: item.description,
        related_quote: item.related_quote,
        quantity: parseInt(item.quantity, 10),
        unit_cost: parseFloat(item.unit_cost),
      })),
      
      // --- Financiero ---
      tax_percentage: parseFloat(taxPercentage),
      other_charges: parseFloat(otherCharges),
      
      // --- Auditoría ---
      registered_by_user_id: user.id, // o user.username, según tu modelo

      // Datos de nuestra empresa (deberían venir de una configuración global)
      buyer_name: "Mi Empresa de Filtros S.A.C",
      buyer_tax_id: "98765432-1",
      buyer_legal_address: "Calle Falsa 123, Mi Ciudad"
    };

    try {
      // await createPurchaseOrderAPI(purchaseOrderPayload);
      console.log("Enviando al backend:", purchaseOrderPayload);
      alert('Orden de Compra registrada exitosamente!');
      // Resetear formulario o redirigir
    } catch (error) {
      console.error("Error al registrar la compra:", error);
      alert(error.response?.data?.detail || 'Ocurrió un error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Registrar Nueva Compra</Typography>
        
        <form onSubmit={handleSubmit}>
          {/* --- SECCIÓN DE PROVEEDOR (AQUÍ IRÍA TU AUTOCOMPLETADO) --- */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              {/* <SupplierAutocomplete onSelect={setSupplier} /> */}
              <TextField label="Buscar Proveedor" fullWidth disabled />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                name="supplier_invoice_code" 
                label="N° Factura Proveedor" 
                value={headerData.supplier_invoice_code}
                onChange={handleHeaderChange}
                fullWidth required
              />
            </Grid>
            {/* ... más campos de fecha ... */}
          </Grid>
          
          {/* --- SECCIÓN DE ÍTEMS (TABLA) --- */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Código Producto</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Costo Unit.</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {/* <ProductAutocomplete onSelect={(prod) => handleProductSelect(index, prod)} /> */}
                      <TextField size="small" name="product_code" value={item.product_code} onChange={(e) => handleItemChange(index, e)} />
                    </TableCell>
                    <TableCell><TextField size="small" name="description" value={item.description} fullWidth /></TableCell>
                    <TableCell><TextField size="small" type="number" name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} /></TableCell>
                    <TableCell><TextField size="small" type="number" name="unit_cost" value={item.unit_cost} onChange={(e) => handleItemChange(index, e)} /></TableCell>
                    <TableCell>{(item.quantity * item.unit_cost).toFixed(2)}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => removeItemRow(index)}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button onClick={addNewItemRow} sx={{ mt: 2 }}>Añadir Fila</Button>
          
          {/* --- SECCIÓN DE TOTALES --- */}
          <Grid container spacing={2} sx={{ mt: 4 }} justifyContent="flex-end">
            <Grid item xs={12} md={5}>
              <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <Typography>Subtotal: S/ {subtotal.toFixed(2)}</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography>Impuesto (%):</Typography>
                  <TextField size="small" type="number" value={taxPercentage} onChange={(e) => setTaxPercentage(e.target.value)} sx={{width: '80px'}}/>
                </Box>
                <Typography>Monto Impuesto: S/ {taxAmount.toFixed(2)}</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography>Otros Cargos:</Typography>
                  <TextField size="small" type="number" value={otherCharges} onChange={(e) => setOtherCharges(e.target.value)} />
                </Box>
                <Typography variant="h6" sx={{ mt: 1 }}>TOTAL: S/ {totalAmount.toFixed(2)}</Typography>
              </Box>
            </Grid>
          </Grid>
          
          {/* --- BOTÓN DE ENVÍO --- */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained" color="primary" size="large" disabled={isLoading}>
              {isLoading ? 'Registrando...' : 'Confirmar y Recibir Mercancía'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default NewPurchaseOrderPage;