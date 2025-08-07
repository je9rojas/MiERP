// frontend/src/features/inventory/components/product/ProductPrimaryInfoSection.js

/**
 * @file Componente de sección para la información principal del producto.
 * @description Renderiza los campos de identificación básicos del producto como SKU, nombre, marca y descripción.
 */

// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
import React from 'react';
import { Grid, TextField, Typography } from '@mui/material';

// SECCIÓN 2: DEFINICIÓN DEL COMPONENTE
const ProductPrimaryInfoSection = ({ formikProps, isEditMode }) => {
    const { values, touched, errors, handleChange, handleBlur } = formikProps;

    return (
        <>
            <Typography variant="h6" gutterBottom>Información Principal</Typography>
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <TextField
                        fullWidth
                        required
                        name="sku"
                        label="SKU / Código"
                        value={values.sku}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.sku && Boolean(errors.sku)}
                        helperText={touched.sku && errors.sku}
                        disabled={isEditMode}
                    />
                </Grid>
                <Grid item xs={12} sm={8}>
                    <TextField
                        fullWidth
                        required
                        name="name"
                        label="Nombre del Producto"
                        value={values.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.name && Boolean(errors.name)}
                        helperText={touched.name && errors.name}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        required
                        name="brand"
                        label="Marca"
                        value={values.brand}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.brand && Boolean(errors.brand)}
                        helperText={touched.brand && errors.brand}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        name="main_image_url"
                        label="URL de la Imagen Principal"
                        value={values.main_image_url}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.main_image_url && Boolean(errors.main_image_url)}
                        helperText={touched.main_image_url && errors.main_image_url}
                        placeholder="https://ejemplo.com/imagen.jpg"
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Descripción y Notas"
                        name="description"
                        value={values.description}
                        onChange={handleChange}
                    />
                </Grid>
            </Grid>
        </>
    );
};

export default React.memo(ProductPrimaryInfoSection);