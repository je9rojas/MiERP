// /frontend/src/features/inventory/components/product/ProductCommercialDataSection.js

/**
 * @file Componente de sección para los datos comerciales y de inventario del producto.
 * @description Renderiza campos de formulario relacionados con precios, logística
 * y estado del inventario. Su comportamiento es dinámico: muestra campos de
 * stock inicial en modo 'creación' y datos de stock de solo lectura en modo 'edición'.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
// ==============================================================================

import React from 'react';
import { Grid, TextField, Typography } from '@mui/material';

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DEL COMPONENTE
// ==============================================================================

const ProductCommercialDataSection = ({ formikProps, isEditMode }) => {
    // Desestructuración de propiedades de Formik para un código más limpio.
    const { values, touched, errors, handleChange, handleBlur } = formikProps;

    return (
        <>
            <Typography variant="h6" gutterBottom>Datos Comerciales e Inventario</Typography>
            <Grid container spacing={3} sx={{ mb: 3 }}>

                {/* --- LÓGICA DE RENDERIZADO CONDICIONAL --- */}
                {isEditMode ? (
                    // --- MODO EDICIÓN: Mostrar datos de stock de solo lectura ---
                    <>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Stock Total Actual"
                                name="stock_quantity"
                                value={values.stock_quantity}
                                disabled // El stock no se puede editar directamente.
                                helperText="Calculado desde los lotes de inventario."
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Costo Promedio Actual"
                                name="average_cost"
                                value={values.average_cost}
                                disabled // El costo no se puede editar directamente.
                                helperText="Calculado desde los lotes de inventario."
                            />
                        </Grid>
                    </>
                ) : (
                    // --- MODO CREACIÓN: Mostrar campos para el stock inicial ---
                    <>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Cantidad Inicial"
                                name="initial_quantity"
                                value={values.initial_quantity}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={touched.initial_quantity && Boolean(errors.initial_quantity)}
                                helperText={touched.initial_quantity ? errors.initial_quantity : "Stock para el primer lote."}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Costo Inicial"
                                name="initial_cost"
                                value={values.initial_cost}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={touched.initial_cost && Boolean(errors.initial_cost)}
                                helperText={touched.initial_cost ? errors.initial_cost : "Costo de adquisición por unidad."}
                            />
                        </Grid>
                    </>
                )}

                {/* --- CAMPOS COMUNES A AMBOS MODOS --- */}
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

// Se utiliza React.memo para optimizar el rendimiento, evitando re-renderizados
// innecesarios si las props (formikProps, isEditMode) no han cambiado.
export default React.memo(ProductCommercialDataSection);