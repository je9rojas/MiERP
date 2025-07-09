// /frontend/src/features/inventory/components/ProductForm.js
// FORMULARIO COMPLETO Y CORREGIDO

import React, { useState } from 'react';
import { Box, TextField, Button, Grid, MenuItem, Typography, Divider } from '@mui/material';

// Deberías obtener estos valores de una llamada a la API en el futuro
const productTypes = [
  { value: 'filter_air', label: 'Filtro de Aire' },
  { value: 'filter_oil', label: 'Filtro de Aceite' },
  { value: 'filter_fuel', label: 'Filtro de Combustible' },
  { value: 'filter_cabin', label: 'Filtro de Cabina' },
  { value: 'lubricant', label: 'Lubricante' },
  { value: 'spare_part', label: 'Repuesto' },
];

const ProductForm = ({ onSubmit, initialData = {}, isSubmitting }) => {
  const [formData, setFormData] = useState({
    sku: initialData.sku || '',
    name: initialData.name || '',
    brand: initialData.brand || '',
    product_type: initialData.product_type || '',
    description: initialData.description || '',
    cost: initialData.cost || '0', // Usamos string para el input
    price: initialData.price || '0',
    stock_quantity: initialData.stock_quantity || 0,
    points_on_sale: initialData.points_on_sale || 0,
    // Inicializamos los campos complejos como arrays/objetos vacíos
    specifications: initialData.specifications || {},
    cross_references: initialData.cross_references || [],
    applications: initialData.applications || [],
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Convertimos los campos numéricos de string a número antes de enviar
    const dataToSend = {
      ...formData,
      cost: parseFloat(formData.cost),
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity, 10),
      points_on_sale: parseInt(formData.points_on_sale, 10),
    };
    onSubmit(dataToSend);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h6" gutterBottom>Información Básica</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <TextField required fullWidth id="sku" label="SKU / Código Principal" name="sku" value={formData.sku} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={8}>
          <TextField required fullWidth id="name" label="Nombre del Producto" name="name" value={formData.name} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField required fullWidth id="brand" label="Marca" name="brand" value={formData.brand} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField select required fullWidth id="product_type" label="Tipo de Producto" name="product_type" value={formData.product_type} onChange={handleChange}>
            {productTypes.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth multiline rows={3} id="description" label="Descripción (Opcional)" name="description" value={formData.description} onChange={handleChange} />
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 4 }} />
      
      <Typography variant="h6" gutterBottom>Datos Comerciales y de Stock</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={3}>
          <TextField required fullWidth type="number" id="cost" label="Costo" name="cost" value={formData.cost} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField required fullWidth type="number" id="price" label="Precio" name="price" value={formData.price} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField required fullWidth type="number" id="stock_quantity" label="Stock Inicial" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField required fullWidth type="number" id="points_on_sale" label="Puntos por Venta" name="points_on_sale" value={formData.points_on_sale} onChange={handleChange} />
        </Grid>
      </Grid>

      {/* Aquí podrías añadir secciones para editar specifications, cross_references, etc. en el futuro */}

      <Button type="submit" fullWidth variant="contained" sx={{ mt: 4, mb: 2 }} disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
      </Button>
    </Box>
  );
};

export default ProductForm;