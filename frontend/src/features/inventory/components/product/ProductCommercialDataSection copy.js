// frontend/src/features/inventory/components/product/ProductCommercialDataSection.js

/**
 * @file Componente de sección para los datos comerciales y logísticos del producto.
 * @description Renderiza los campos de precio, peso, puntos, y los campos informativos
 * de stock y costo promedio.
 */

// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
import React from 'react';
import { Grid, TextField, Typography } from '@mui/material';

// SECCIÓN 2: DEFINICIÓN DEL COMPONENTE
const ProductCommercialDataSection = ({ formikProps }) => {
    const { values, touched, errors, handleChange, handleBlur } = formikProps;

    return (
        <>
            <Typography variant="h6" gutterBottom>Datos Comerciales y Logísticos</Typography>
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        fullWidth
                        type="number"
                        label="Stock Total"
                        name="stock_quantity"
                        value={values.stock_quantity}
                        disabled // El stock se gestiona por lotes, aquí es solo informativo.
                        helperText="Se calcula por la suma de lotes."
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        fullWidth
                        type="number"
                        label="Costo Promedio"
                        name="average_cost"
                        value={values.average_cost}
                        disabled // El costo se gestiona por lotes, aquí es solo informativo.
                        helperText="Se calcula desde los lotes."
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        fullWidth
                        required
                        type="number"
                        label="Precio de Venta"
                        name="price"
                        value={values.price}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.price && Boolean(errors.price)}
                        helperText={touched.price && errors.price}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        fullWidth
                        type="number"
                        label="Peso (g)"
                        name="weight_g"
                        value={values.weight_g}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.weight_g && Boolean(errors.weight_g)}
                        helperText={touched.weight_g && errors.weight_g}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        fullWidth
                        type="number"
                        label="Puntos por Venta"
                        name="points_on_sale"
                        value={values.points_on_sale}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.points_on_sale && Boolean(errors.points_on_sale)}
                        helperText={touched.points_on_sale && errors.points_on_sale}
                    />
                </Grid>
            </Grid>
        </>
    );
};

export default React.memo(ProductCommercialDataSection);