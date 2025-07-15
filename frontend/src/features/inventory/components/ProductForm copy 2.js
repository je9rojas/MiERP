// /frontend/src/features/inventory/components/ProductForm.js
// VERSIÓN FINAL Y PROFESIONAL, USANDO CONSTANTES CENTRALIZADAS Y ARQUITECTURA LIMPIA

import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Button, Grid, MenuItem, Typography, Divider, IconButton
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

// --- ¡IMPORTACIÓN CLAVE! ---
// Importamos las definiciones desde nuestra fuente única de verdad.
import { PRODUCT_CATEGORIES, FILTER_TYPES, PRODUCT_SHAPES } from '../../../constants/productConstants';


// --- SECCIÓN 1: SUB-COMPONENTE PARA DIMENSIONES ---
// Este componente encapsula la lógica para renderizar los campos de medidas correctos.
const DimensionFields = ({ shape, specifications, onSpecChange }) => {
    const handleDimensionChange = (event) => {
        const { name, value } = event.target;
        const isTextField = name === 'B' && shape === 'spin_on'; // La rosca es texto
        const processedValue = value === '' ? '' : isTextField ? value : Number(value);
        onSpecChange({ ...specifications, [name]: processedValue });
    };

    const fieldDefinitions = {
        panel: [ { name: 'A', label: 'Largo (A) mm' }, { name: 'B', label: 'Ancho (B) mm' }, { name: 'H', label: 'Alto (H) mm' } ],
        round: [ { name: 'A', label: 'Diámetro Ext. (A) mm' }, { name: 'B', label: 'Diámetro Int. (B) mm' }, { name: 'H', label: 'Altura (H) mm' } ],
        oval: [ { name: 'A', label: 'Largo Ext. (A) mm' }, { name: 'B', label: 'Ancho Ext. (B) mm' }, { name: 'H', label: 'Altura (H) mm' } ],
        cartridge: [ { name: 'A', label: 'Diámetro Ext. (A) mm' }, { name: 'B', label: 'Diámetro Int. Sup. (B) mm' }, { name: 'C', label: 'Diámetro Int. Inf. (C) mm' }, { name: 'H', label: 'Altura (H) mm' } ],
        spin_on: [ { name: 'A', label: 'Altura Total (A) mm' }, { name: 'B', label: 'Rosca (B)', type: 'text' }, { name: 'C', label: 'Ø Ext. Junta (C) mm' }, { name: 'G', label: 'Ø Int. Junta (G) mm' }, { name: 'H', label: 'Ø Cuerpo (H) mm' } ],
        in_line_diesel: [ { name: 'A', label: 'Largo Total (A) mm' }, { name: 'F', label: 'Tubo Entrada (F) mm' }, { name: 'G', label: 'Tubo Salida (G) mm' }, { name: 'H', label: 'Diámetro Cuerpo (H) mm' } ],
        in_line_gasoline: [ { name: 'A', label: 'Largo Total (A) mm' }, { name: 'F', label: 'Tubo Entrada (F) mm' }, { name: 'G', label: 'Tubo Salida (G) mm' }, { name: 'H', label: 'Diámetro Cuerpo (H) mm' } ],
    };

    const fieldsToRender = fieldDefinitions[shape];
    if (!fieldsToRender) {
        return <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>Seleccione una forma para especificar sus medidas.</Typography>;
    }
    return (
        <Grid container spacing={2}>
            {fieldsToRender.map(field => (
                <Grid item xs={12} sm={4} md={3} key={field.name}><TextField fullWidth label={field.label} name={field.name} value={specifications[field.name] || ''} onChange={handleDimensionChange} type={field.type || 'number'} /></Grid>
            ))}
        </Grid>
    );
};


// --- SECCIÓN 2: COMPONENTE PRINCIPAL DEL FORMULARIO ---
const ProductForm = ({ onSubmit, initialData = {}, isSubmitting = false }) => {
  const [formData, setFormData] = useState({
    sku: '', name: '', brand: '', category: '', product_type: '', shape: '',
    description: '', cost: '0', price: '0', stock_quantity: 0, points_on_sale: 0,
    specifications: {},
    cross_references: [{ brand: '', code: '' }],
    applications: [{ brand: '', model: '', years: '' }],
  });

  // useEffect para poblar el formulario cuando se edita un producto existente
  useEffect(() => {
    if (initialData && initialData.sku) {
        setFormData({
            ...initialData,
            category: initialData.category || '',
            cost: String(initialData.cost || '0'),
            price: String(initialData.price || '0'),
            cross_references: initialData.cross_references?.length ? initialData.cross_references : [{ brand: '', code: '' }],
            applications: initialData.applications?.length ? initialData.applications.map(app => ({...app, years: app.years.join(', ')})) : [{ brand: '', model: '', years: '' }],
        });
    }
  }, [initialData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const newState = { ...formData, [name]: value };
    if (name === 'category') {
      newState.product_type = (value === 'filter') ? '' : 'n_a';
      newState.shape = (value === 'filter') ? '' : 'n_a';
      newState.specifications = {};
    }
    if (name === 'product_type') {
      newState.shape = '';
      newState.specifications = {};
    }
    setFormData(newState);
  };

  const handleDynamicListChange = (index, event, listName) => {
    const { name, value } = event.target;
    const list = formData[listName].map((item, i) => (i === index ? { ...item, [name]: value } : item));
    setFormData(prev => ({ ...prev, [listName]: list }));
  };

  const handleAddRow = (listName, newRowObject) => {
    setFormData(prev => ({ ...prev, [listName]: [...prev[listName], newRowObject] }));
  };

  const handleRemoveRow = (index, listName) => {
    if (formData[listName].length <= 1) return;
    setFormData(prev => ({ ...prev, [listName]: formData[listName].filter((_, i) => i !== index) }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const dataToSend = {
      sku: formData.sku,
      name: formData.name,
      brand: formData.brand,
      description: formData.description,
      category: formData.category,
      product_type: formData.category === 'filter' ? formData.product_type : 'n_a',
      shape: formData.category === 'filter' ? (formData.shape || null) : 'n_a',
      cost: parseFloat(formData.cost) || 0,
      price: parseFloat(formData.price) || 0,
      stock_quantity: parseInt(String(formData.stock_quantity), 10) || 0,
      points_on_sale: parseInt(String(formData.points_on_sale), 10) || 0,
      specifications: formData.specifications,
      cross_references: formData.cross_references.filter(ref => ref.brand.trim() && ref.code.trim()),
      applications: formData.applications
        .filter(app => app.brand.trim() && app.model.trim())
        .map(app => ({...app, years: String(app.years).split(',').map(y => Number(y.trim())).filter(y => !isNaN(y) && y > 1900)})),
    };
    console.log('[ProductForm] Objeto final a enviar:', dataToSend);
    onSubmit(dataToSend);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h6" gutterBottom>Información Principal</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}><TextField required fullWidth label="SKU / Código" name="sku" value={formData.sku} onChange={handleChange} /></Grid>
        <Grid item xs={12} sm={8}><TextField required fullWidth label="Nombre del Producto" name="name" value={formData.name} onChange={handleChange} /></Grid>
        <Grid item xs={12} sm={12}><TextField required fullWidth label="Marca" name="brand" value={formData.brand} onChange={handleChange} /></Grid>
        
        <Grid item xs={12} sm={12}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                    <TextField select required fullWidth label="Producto" name="category" value={formData.category} onChange={handleChange}>
                        {PRODUCT_CATEGORIES.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                    </TextField>
                </Grid>
                {formData.category === 'filter' && (
                <>
                    <Grid item xs={12} sm={4}>
                        <TextField select required fullWidth label="Tipo de producto" name="product_type" value={formData.product_type} onChange={handleChange}>
                            <MenuItem value=""><em>Seleccione...</em></MenuItem>
                            {FILTER_TYPES.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField select fullWidth label="Forma (Opcional)" name="shape" value={formData.shape} onChange={handleChange}>
                            <MenuItem value=""><em>Ninguna</em></MenuItem>
                            {PRODUCT_SHAPES.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                        </TextField>
                    </Grid>
                </>
                )}
            </Grid>
        </Grid>
        <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Descripción / Notas" name="description" value={formData.description} onChange={handleChange} /></Grid>
      </Grid>
      <Divider />

      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Datos Comerciales</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><TextField required fullWidth type="number" label="Costo" name="cost" value={formData.cost} onChange={handleChange} /></Grid>
        <Grid item xs={6} sm={3}><TextField required fullWidth type="number" label="Precio" name="price" value={formData.price} onChange={handleChange} /></Grid>
        <Grid item xs={6} sm={3}><TextField required fullWidth type="number" label="Stock" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} /></Grid>
        <Grid item xs={6} sm={3}><TextField required fullWidth type="number" label="Puntos" name="points_on_sale" value={formData.points_on_sale} onChange={handleChange} /></Grid>
      </Grid>
      <Divider />
      
      {formData.category === 'filter' && (
        <Box sx={{ mt: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Especificaciones y Medidas</Typography>
          <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
            <DimensionFields shape={formData.shape} specifications={formData.specifications} onSpecChange={(newSpecs) => setFormData(prev => ({ ...prev, specifications: newSpecs }))} />
          </Box>
        </Box>
      )}
      <Divider />
      
      <Box sx={{ mt: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Referencias Cruzadas</Typography>
        {formData.cross_references.map((ref, index) => (
          <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}>
            <Grid item xs={10} sm={5}><TextField fullWidth label="Marca Ref." name="brand" value={ref.brand} onChange={e => handleDynamicListChange(index, e, 'cross_references')} /></Grid>
            <Grid item xs={10} sm={5}><TextField fullWidth label="Código Ref." name="code" value={ref.code} onChange={e => handleDynamicListChange(index, e, 'cross_references')} /></Grid>
            <Grid item xs={2}><IconButton onClick={() => handleRemoveRow(index, 'cross_references')} color="error"><RemoveCircleOutlineIcon /></IconButton></Grid>
          </Grid>
        ))}
        <Button startIcon={<AddCircleOutlineIcon />} onClick={() => handleAddRow('cross_references', { brand: '', code: '' })}>Añadir Referencia</Button>
      </Box>
      <Divider />

      <Box sx={{ mt: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Aplicaciones de Vehículos</Typography>
        {formData.applications.map((app, index) => (
          <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}>
            <Grid item xs={12} sm={4}><TextField fullWidth label="Marca Vehículo" name="brand" value={app.brand} onChange={e => handleDynamicListChange(index, e, 'applications')} /></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth label="Modelo" name="model" value={app.model} onChange={e => handleDynamicListChange(index, e, 'applications')} /></Grid>
            <Grid item xs={10} sm={2}><TextField fullWidth label="Años (ej. 2018,2019)" name="years" value={app.years} onChange={e => handleDynamicListChange(index, e, 'applications')} /></Grid>
            <Grid item xs={2}><IconButton onClick={() => handleRemoveRow(index, 'applications')} color="error"><RemoveCircleOutlineIcon /></IconButton></Grid>
          </Grid>
        ))}
        <Button startIcon={<AddCircleOutlineIcon />} onClick={() => handleAddRow('applications', { brand: '', model: '', years: '' })}>Añadir Aplicación</Button>
      </Box>
      
      <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }} disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
      </Button>
    </Box>
  );
};

export default ProductForm;