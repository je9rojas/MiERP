// /frontend/src/features/inventory/components/ProductForm.js

/**
 * @file Componente de formulario compartido, robusto y reutilizable para la creación y edición de productos.
 * Utiliza Formik para la gestión del estado, Yup para la validación de datos en tiempo real,
 * y Material-UI para la interfaz de usuario. Está diseñado para manejar la complejidad
 * de los datos de un producto, incluyendo sub-documentos anidados como códigos y aplicaciones.
 */

// --- SECCIÓN 1: IMPORTACIONES ---
import React from 'react';
import { Formik, Form, FieldArray } from 'formik';
import {
  Box, TextField, Button, Grid, MenuItem, Typography, Divider, IconButton
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

import { PRODUCT_CATEGORIES, FILTER_TYPES, PRODUCT_SHAPES } from '../../../constants/productConstants';
import { productSchema } from '../../../constants/validationSchemas';


// --- SECCIÓN 2: SUB-COMPONENTE PARA DIMENSIONES ---
const DimensionFields = ({ shape, formik }) => {
    const { values, setFieldValue } = formik;

    const handleDimensionChange = (event) => {
        const { name, value } = event.target;
        const isTextField = name.includes('B') && shape === 'spin_on';
        const processedValue = value === '' ? '' : isTextField ? value : Number(value);
        setFieldValue(name, processedValue);
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
            {fieldsToRender.map(field => {
                const fieldName = `specifications.${field.name}`;
                return (
                    <Grid item xs={12} sm={4} md={3} key={field.name}>
                        <TextField fullWidth label={field.label} name={fieldName} value={values.specifications[field.name] || ''} onChange={handleDimensionChange} type={field.type || 'number'} />
                    </Grid>
                );
            })}
        </Grid>
    );
};


// --- SECCIÓN 3: COMPONENTE PRINCIPAL DEL FORMULARIO ---
const ProductForm = ({ onSubmit, initialData = {}, isSubmitting = false }) => {
  return (
    <Formik
      initialValues={{
        sku: initialData.sku || '',
        name: initialData.name || '',
        brand: initialData.brand || '',
        category: initialData.category || '',
        product_type: initialData.product_type || '',
        shape: initialData.shape || '',
        description: initialData.description || '',
        main_image_url: initialData.main_image_url || '',
        cost: initialData.cost || 0,
        price: initialData.price || 0,
        stock_quantity: initialData.stock_quantity || 0,
        points_on_sale: initialData.points_on_sale || 0,
        weight_g: initialData.weight_g || '',
        specifications: initialData.specifications || {},
        oem_codes: initialData.oem_codes?.length ? initialData.oem_codes : [{ brand: '', code: '' }],
        cross_references: initialData.cross_references?.length ? initialData.cross_references : [{ brand: '', code: '' }],
        applications: initialData.applications?.length 
          ? initialData.applications.map(app => ({
              brand: app.brand || '',
              model: app.model || '',
              year_from: app.years?.length ? Math.min(...app.years) : '',
              year_to: app.years?.length ? Math.max(...app.years) : '',
            }))
          : [{ brand: '', model: '', year_from: '', year_to: '' }],
      }}
      validationSchema={productSchema}
      enableReinitialize={true}
      onSubmit={(values) => {
        const dataToSend = {
          ...values,
          cost: parseFloat(String(values.cost)) || 0,
          price: parseFloat(String(values.price)) || 0,
          stock_quantity: parseInt(String(values.stock_quantity), 10) || 0,
          points_on_sale: parseFloat(String(values.points_on_sale)) || 0.0,
          weight_g: values.weight_g ? parseFloat(String(values.weight_g)) : null,
          oem_codes: values.oem_codes.filter(oem => oem.brand.trim() || oem.code.trim()),
          cross_references: values.cross_references.filter(ref => ref.brand.trim() || ref.code.trim()),
          applications: values.applications
            .filter(app => app.brand && app.brand.trim() !== '')
            .map(app => {
              const startYear = parseInt(app.year_from, 10);
              const endYear = parseInt(app.year_to, 10);
              const years = [];
              
              if (!isNaN(startYear) && !isNaN(endYear) && startYear <= endYear) {
                for (let year = startYear; year <= endYear; year++) {
                  years.push(year);
                }
              } else if (!isNaN(startYear) && isNaN(endYear)) {
                years.push(startYear);
              }
              
              return {
                brand: app.brand.trim(),
                model: app.model && app.model.trim() ? app.model.trim() : null,
                years: years,
              };
            }),
        };
        onSubmit(dataToSend);
      }}
    >
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isValid, dirty }) => (
        <Form noValidate>
          {/* --- 3.1: Sub-sección de Información Principal --- */}
          <Typography variant="h6" gutterBottom>Información Principal</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}><TextField fullWidth required name="sku" label="SKU / Código" value={values.sku} onChange={handleChange} onBlur={handleBlur} error={touched.sku && Boolean(errors.sku)} helperText={touched.sku && errors.sku} disabled={!!initialData.sku} /></Grid>
            <Grid item xs={12} sm={8}><TextField fullWidth required name="name" label="Nombre del Producto" value={values.name} onChange={handleChange} onBlur={handleBlur} error={touched.name && Boolean(errors.name)} helperText={touched.name && errors.name} /></Grid>
            <Grid item xs={12}><TextField fullWidth required name="brand" label="Marca" value={values.brand} onChange={handleChange} onBlur={handleBlur} error={touched.brand && Boolean(errors.brand)} helperText={touched.brand && errors.brand} /></Grid>
            <Grid item xs={12}><TextField fullWidth name="main_image_url" label="URL de la Imagen Principal (Opcional)" value={values.main_image_url} onChange={handleChange} onBlur={handleBlur} error={touched.main_image_url && Boolean(errors.main_image_url)} helperText={touched.main_image_url && errors.main_image_url} placeholder="https://ejemplo.com/imagen.jpg" /></Grid>
            <Grid item xs={12}><Grid container spacing={2}><Grid item xs={12} sm={4}><TextField select required fullWidth label="Categoría" name="category" value={values.category} onChange={(e) => { setFieldValue('category', e.target.value); const isFilter = e.target.value === 'filter'; setFieldValue('product_type', isFilter ? '' : 'n_a'); setFieldValue('shape', isFilter ? '' : 'n_a'); setFieldValue('specifications', {}); }} onBlur={handleBlur} error={touched.category && Boolean(errors.category)} helperText={touched.category && errors.category}>{PRODUCT_CATEGORIES.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}</TextField></Grid>{values.category === 'filter' && (<><Grid item xs={12} sm={4}><TextField select required fullWidth label="Tipo de Filtro" name="product_type" value={values.product_type} onChange={(e) => { setFieldValue('shape', ''); setFieldValue('specifications', {}); handleChange(e); }} onBlur={handleBlur} error={touched.product_type && Boolean(errors.product_type)} helperText={touched.product_type && errors.product_type}><MenuItem value=""><em>Seleccione...</em></MenuItem>{FILTER_TYPES.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}</TextField></Grid><Grid item xs={12} sm={4}><TextField select fullWidth label="Forma" name="shape" value={values.shape} onChange={handleChange} onBlur={handleBlur} error={touched.shape && Boolean(errors.shape)} helperText={touched.shape && errors.shape}><MenuItem value=""><em>Ninguna</em></MenuItem>{PRODUCT_SHAPES.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}</TextField></Grid></>)}</Grid></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Descripción y Notas" name="description" value={values.description} onChange={handleChange} /></Grid>
          </Grid>
          <Divider />
          
          {/* --- 3.2: Sub-sección de Datos Comerciales y Logísticos --- */}
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Datos Comerciales y Logísticos</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}><TextField fullWidth required type="number" label="Costo" name="cost" value={values.cost} onChange={handleChange} onBlur={handleBlur} error={touched.cost && Boolean(errors.cost)} helperText={touched.cost && errors.cost} /></Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth required type="number" label="Precio" name="price" value={values.price} onChange={handleChange} onBlur={handleBlur} error={touched.price && Boolean(errors.price)} helperText={touched.price && errors.price} /></Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth type="number" label="Stock" name="stock_quantity" value={values.stock_quantity} onChange={handleChange} /></Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth type="number" label="Peso (g)" name="weight_g" value={values.weight_g} onChange={handleChange} onBlur={handleBlur} error={touched.weight_g && Boolean(errors.weight_g)} helperText={touched.weight_g && errors.weight_g} InputProps={{ endAdornment: <Typography variant="caption" sx={{ mr: 1 }}>g</Typography>, }}/></Grid>
            <Grid item xs={12} sm={3}><TextField fullWidth type="number" label="Puntos por Venta" name="points_on_sale" value={values.points_on_sale} onChange={handleChange} /></Grid>
          </Grid>
          <Divider />

          {/* --- 3.3: Sub-sección Condicional para Especificaciones --- */}
          {values.category === 'filter' && (<Box sx={{ mt: 3, mb: 3 }}><Typography variant="h6" gutterBottom>Especificaciones y Medidas</Typography><Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 1 }}><DimensionFields shape={values.shape} formik={{ values, setFieldValue }} /></Box></Box>)}
          <Divider />

          {/* --- 3.4: Sub-secciones de Datos Anidados (Códigos y Aplicaciones) --- */}
          <FieldArray name="oem_codes">{({ push, remove }) => (<Box sx={{ mt: 3, mb: 3 }}><Typography variant="h6" gutterBottom>Códigos de Equipo Original (OEM)</Typography>{values.oem_codes.map((oem, index) => (<Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}><Grid item xs={10} sm={5}><TextField fullWidth label="Marca Vehículo" name={`oem_codes.${index}.brand`} value={oem.brand} onChange={handleChange} /></Grid><Grid item xs={10} sm={5}><TextField fullWidth label="Código Original" name={`oem_codes.${index}.code`} value={oem.code} onChange={handleChange} /></Grid><Grid item xs={2}><IconButton disabled={values.oem_codes.length <= 1} onClick={() => remove(index)} color="error"><RemoveCircleOutlineIcon /></IconButton></Grid></Grid>))}<Button startIcon={<AddCircleOutlineIcon />} onClick={() => push({ brand: '', code: '' })}>Añadir Código OEM</Button></Box>)}</FieldArray>
          <Divider />
          <FieldArray name="cross_references">{({ push, remove }) => (<Box sx={{ mt: 3, mb: 3 }}><Typography variant="h6" gutterBottom>Referencias Cruzadas (Aftermarket)</Typography>{values.cross_references.map((ref, index) => (<Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}><Grid item xs={10} sm={5}><TextField fullWidth label="Marca Referencia" name={`cross_references.${index}.brand`} value={ref.brand} onChange={handleChange} /></Grid><Grid item xs={10} sm={5}><TextField fullWidth label="Código Referencia" name={`cross_references.${index}.code`} value={ref.code} onChange={handleChange} /></Grid><Grid item xs={2}><IconButton disabled={values.cross_references.length <= 1} onClick={() => remove(index)} color="error"><RemoveCircleOutlineIcon /></IconButton></Grid></Grid>))}<Button startIcon={<AddCircleOutlineIcon />} onClick={() => push({ brand: '', code: '' })}>Añadir Referencia</Button></Box>)}</FieldArray>
          <Divider />
          <FieldArray name="applications">
            {({ push, remove }) => (
              <Box sx={{ mt: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Aplicaciones de Vehículos</Typography>
                {values.applications.map((app, index) => (
                  <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}>
                    <Grid item xs={12} sm={4}><TextField fullWidth label="Marca Vehículo" name={`applications[${index}].brand`} value={app.brand} onChange={handleChange} /></Grid>
                    <Grid item xs={12} sm={3}><TextField fullWidth label="Modelo" name={`applications[${index}].model`} value={app.model} onChange={handleChange} /></Grid>
                    <Grid item xs={5} sm={2}><TextField fullWidth type="number" label="Año Desde" name={`applications[${index}].year_from`} value={app.year_from} onChange={handleChange} /></Grid>
                    <Grid item xs={5} sm={2}><TextField fullWidth type="number" label="Año Hasta" name={`applications[${index}].year_to`} value={app.year_to} onChange={handleChange} /></Grid>
                    <Grid item xs={2}><IconButton disabled={values.applications.length <= 1} onClick={() => remove(index)} color="error"><RemoveCircleOutlineIcon /></IconButton></Grid>
                  </Grid>
                ))}
                <Button startIcon={<AddCircleOutlineIcon />} onClick={() => push({ brand: '', model: '', year_from: '', year_to: '' })}>Añadir Aplicación</Button>
              </Box>
            )}
          </FieldArray>

          {/* --- 3.5: Sub-sección del Botón de Acción --- */}
          <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 4 }} disabled={isSubmitting || !isValid || !dirty}>
            {isSubmitting ? 'Guardando...' : (initialData.sku ? 'Actualizar Producto' : 'Guardar Producto')}
          </Button>
        </Form>
      )}
    </Formik>
  );
};

export default ProductForm;