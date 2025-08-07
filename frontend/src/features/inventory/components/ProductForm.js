// frontend/src/features/inventory/components/ProductForm.js

/**
 * @file Componente ensamblador del formulario de producto.
 * @description Este componente orquesta el estado del formulario con Formik y
 * compone la UI a partir de sub-componentes de sección especializados.
 * No contiene lógica de renderizado de campos directamente.
 */

// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
import React, { useMemo, useCallback } from 'react';
import { Formik, Form, FieldArray } from 'formik';
import { Box, Button, Paper, Divider, Grid, IconButton, TextField, Typography } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

import { productFormValidationSchema } from '../../../constants/validationSchemas';

// Importación de las nuevas secciones especializadas
import ProductPrimaryInfoSection from './product/ProductPrimaryInfoSection';
import ProductCommercialDataSection from './product/ProductCommercialDataSection';
import ProductSpecificationsSection from './product/ProductSpecificationsSection';
import ProductReferenceSection from './product/ProductReferenceSection';

// SECCIÓN 2: DEFINICIONES Y HOOKS
const INITIAL_APPLICATION_STATE = { brand: '', model: '', year_from: '', year_to: '', engine: '' };

/**
 * Hook personalizado para gestionar los valores iniciales del formulario.
 * @param {object} initialData - Los datos del producto para el modo edición.
 * @param {boolean} isEditMode - Flag para determinar si el formulario está en modo edición.
 * @returns {object} Un objeto con los `initialValues` para Formik.
 */
const useProductFormInitializer = ({ initialData, isEditMode }) => {
    return useMemo(() => {
        const formatApiValue = (value) => (value === null || value === undefined ? '' : String(value));
        
        const defaults = {
            sku: '', name: '', brand: '', category: '', product_type: 'n_a', shape: '',
            description: '', main_image_url: '',
            price: '0', weight_g: '0', points_on_sale: '0',
            stock_quantity: '0', average_cost: '0',
            dimensions: { a: '', b: '', c: '', g: '', h: '', f: '' },
            oem_codes: [{ brand: '', code: '' }],
            cross_references: [{ brand: '', code: '' }],
            applications: [INITIAL_APPLICATION_STATE],
        };
        
        if (!isEditMode || !initialData) {
            return defaults;
        }

        return {
            ...defaults,
            ...initialData,
            price: formatApiValue(initialData.price),
            weight_g: formatApiValue(initialData.weight_g),
            points_on_sale: formatApiValue(initialData.points_on_sale),
            stock_quantity: formatApiValue(initialData.stock_quantity),
            average_cost: formatApiValue(initialData.average_cost),
            dimensions: initialData.dimensions ? { ...defaults.dimensions, ...initialData.dimensions } : defaults.dimensions,
            oem_codes: initialData.oem_codes?.length ? initialData.oem_codes : defaults.oem_codes,
            cross_references: initialData.cross_references?.length ? initialData.cross_references : defaults.cross_references,
            applications: initialData.applications?.length
                ? initialData.applications.map(app => ({
                    ...app,
                    year_from: formatApiValue(app.years?.length ? Math.min(...app.years) : ''),
                    year_to: formatApiValue(app.years?.length ? Math.max(...app.years) : ''),
                  }))
                : defaults.applications,
        };
    }, [initialData, isEditMode]);
};


// SECCIÓN 3: COMPONENTE PRINCIPAL
const ProductForm = ({ onSubmit, initialData = {}, isSubmitting = false }) => {
    const isEditMode = !!initialData.sku;
    const initialValues = useProductFormInitializer({ initialData, isEditMode });
    
    const handleFormSubmit = useCallback((formValues) => {
        onSubmit(formValues);
    }, [onSubmit]);

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={productFormValidationSchema}
            onSubmit={handleFormSubmit}
            enableReinitialize
        >
            {(formikProps) => (
                <Form noValidate>
                    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, boxShadow: 'none' }}>
                        
                        <ProductPrimaryInfoSection formikProps={formikProps} isEditMode={isEditMode} />
                        <Divider sx={{ mb: 3 }} />

                        <ProductSpecificationsSection formikProps={formikProps} />
                        <Divider sx={{ mb: 3 }} />

                        <ProductCommercialDataSection formikProps={formikProps} />
                        <Divider sx={{ mb: 3 }} />

                        <ProductReferenceSection
                            name="oem_codes"
                            title="Códigos de Equipo Original (OEM)"
                            fieldLabels={{ brand: "Marca Vehículo", code: "Código Original" }}
                            formikProps={formikProps}
                        />
                        <Divider sx={{ mb: 3 }} />

                        <ProductReferenceSection
                            name="cross_references"
                            title="Referencias Cruzadas (Aftermarket)"
                            fieldLabels={{ brand: "Marca Referencia", code: "Código Referencia" }}
                            formikProps={formikProps}
                        />
                        <Divider sx={{ mb: 3 }} />
                        
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" gutterBottom>Aplicaciones de Vehículos</Typography>
                            <FieldArray name="applications">
                                {({ push, remove }) => (
                                    <>
                                        {formikProps.values.applications.map((app, index) => (
                                            <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}>
                                                <Grid item xs={12} sm={3}><TextField fullWidth label="Marca Vehículo" name={`applications.${index}.brand`} value={app.brand} onChange={formikProps.handleChange} /></Grid>
                                                <Grid item xs={12} sm={3}><TextField fullWidth label="Modelo" name={`applications.${index}.model`} value={app.model} onChange={formikProps.handleChange} /></Grid>
                                                <Grid item xs={12} sm={3}><TextField fullWidth label="Motor" name={`applications.${index}.engine`} value={app.engine} onChange={formikProps.handleChange} /></Grid>
                                                <Grid item xs={5} sm={1}><TextField fullWidth type="number" label="Desde" name={`applications.${index}.year_from`} value={app.year_from} onChange={formikProps.handleChange} /></Grid>
                                                <Grid item xs={5} sm={1}><TextField fullWidth type="number" label="Hasta" name={`applications.${index}.year_to`} value={app.year_to} onChange={formikProps.handleChange} /></Grid>
                                                <Grid item xs={2}><IconButton disabled={formikProps.values.applications.length <= 1} onClick={() => remove(index)} color="error"><RemoveCircleOutlineIcon /></IconButton></Grid>
                                            </Grid>
                                        ))}
                                        <Button startIcon={<AddCircleOutlineIcon />} onClick={() => push(INITIAL_APPLICATION_STATE)}>Añadir Aplicación</Button>
                                    </>
                                )}
                            </FieldArray>
                        </Box>

                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }} disabled={isSubmitting || !formikProps.isValid}>
                                {isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar Producto' : 'Guardar Nuevo Producto')}
                            </Button>
                        </Box>
                    </Paper>
                </Form>
            )}
        </Formik>
    );
};

export default ProductForm;