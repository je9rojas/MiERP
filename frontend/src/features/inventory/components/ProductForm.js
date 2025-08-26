// File: /frontend/src/features/inventory/components/ProductForm.js

/**
 * @file Componente ensamblador del formulario de producto.
 * @description Este componente orquesta el estado del formulario con Formik,
 * transforma los datos para la API y compone la UI a partir de
 * sub-componentes de sección especializados. Mantiene la lógica de estado
 * separada de la renderización de campos.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field, FieldArray } from 'formik';
import { Box, Button, Paper, Divider, Grid, IconButton, Typography } from '@mui/material';
import { TextField } from 'formik-material-ui';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

import { productFormValidationSchema } from '../../../constants/validationSchemas';
import ProductPrimaryInfoSection from './product/ProductPrimaryInfoSection';
import ProductCommercialDataSection from './product/ProductCommercialDataSection';
import ProductSpecificationsSection from './product/ProductSpecificationsSection';
import ProductReferenceSection from './product/ProductReferenceSection';

// ==============================================================================
// SECCIÓN 2: DEFINICIONES AUXILIARES
// ==============================================================================

const INITIAL_APPLICATION_STATE = { brand: '', model: '', year_from: '', year_to: '', engine: '' };

/**
 * Prepara los datos del formulario para que coincidan con el DTO esperado por la API.
 * @param {object} formValues - Los valores brutos del formulario de Formik.
 * @returns {object} Un objeto con `catalogData` y `initialInventoryData`.
 */
const prepareSubmitData = (formValues) => {
    const data = { ...formValues };

    data.price = parseFloat(data.price || 0);
    data.weight_g = data.weight_g ? parseFloat(data.weight_g) : null;
    data.points_on_sale = parseFloat(data.points_on_sale || 0);

    const cleanedDimensions = {};
    for (const key in data.dimensions) {
        const value = data.dimensions[key];
        if (value !== null && value !== '') {
            cleanedDimensions[key] = (key === 'g') ? value : parseFloat(value);
        }
    }
    data.dimensions = cleanedDimensions;

    data.oem_codes = (data.oem_codes || []).filter(item => item.brand && item.code);
    data.cross_references = (data.cross_references || []).filter(item => item.brand && item.code);
    
    data.applications = (data.applications || [])
        .filter(app => app.brand)
        .map(app => {
            const { year_from, year_to, ...restOfApp } = app;
            const years = [];
            const yearFromNum = parseInt(year_from, 10);
            const yearToNum = parseInt(year_to, 10);
            if (!isNaN(yearFromNum) && !isNaN(yearToNum)) {
                for (let y = yearFromNum; y <= yearToNum; y++) {
                    years.push(y);
                }
            }
            return { ...restOfApp, years };
        });

    const initialInventoryData = {
        initial_quantity: parseInt(data.initial_quantity || 0, 10),
        initial_cost: parseFloat(data.initial_cost || 0),
    };

    delete data.initial_quantity;
    delete data.initial_cost;
    delete data.stock_quantity;
    delete data.average_cost;

    return { catalogData: data, initialInventoryData };
};

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL
// ==============================================================================

const ProductForm = ({ onSubmit, initialData = null, isSubmitting = false }) => {
    const isEditMode = Boolean(initialData?.sku);

    const initialValues = useMemo(() => {
        const defaults = {
            sku: '', name: '', brand: '', category: '', product_type: 'n_a', shape: '',
            description: '', main_image_url: '',
            price: '0', weight_g: '0', points_on_sale: '0',
            initial_quantity: '0', initial_cost: '0',
            stock_quantity: '0', average_cost: '0',
            dimensions: { a: '', b: '', c: '', g: '', h: '', f: '' },
            oem_codes: [{ brand: '', code: '' }],
            cross_references: [{ brand: '', code: '' }],
            applications: [INITIAL_APPLICATION_STATE],
        };

        if (!isEditMode) return defaults;
        
        const formatValue = (value) => (value === null || value === undefined ? '' : String(value));
        const applications = (initialData.applications || []).map(app => ({
            ...app,
            year_from: formatValue(app.years?.length ? Math.min(...app.years) : ''),
            year_to: formatValue(app.years?.length ? Math.max(...app.years) : ''),
        }));

        return {
            ...defaults,
            ...initialData,
            price: formatValue(initialData.price),
            weight_g: formatValue(initialData.weight_g),
            points_on_sale: formatValue(initialData.points_on_sale),
            stock_quantity: formatValue(initialData.stock_quantity),
            average_cost: formatValue(initialData.average_cost),
            dimensions: initialData.dimensions ? { ...defaults.dimensions, ...initialData.dimensions } : defaults.dimensions,
            oem_codes: initialData.oem_codes?.length ? initialData.oem_codes : defaults.oem_codes,
            cross_references: initialData.cross_references?.length ? initialData.cross_references : defaults.cross_references,
            applications: applications.length ? applications : defaults.applications,
        };
    }, [initialData, isEditMode]);
    
    const handleFormSubmit = useCallback((formValues) => {
        const { catalogData, initialInventoryData } = prepareSubmitData(formValues);
        const payload = isEditMode ? catalogData : { ...catalogData, ...initialInventoryData };
        onSubmit(payload);
    }, [onSubmit, isEditMode]);

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={productFormValidationSchema}
            onSubmit={handleFormSubmit}
            enableReinitialize
        >
            {({ values, isSubmitting: formikIsSubmitting }) => (
                <Form noValidate>
                    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, boxShadow: 'none' }}>
                        
                        <ProductPrimaryInfoSection isEditMode={isEditMode} isSubmitting={isSubmitting || formikIsSubmitting} />
                        <Divider sx={{ mb: 3 }} />

                        <ProductSpecificationsSection isSubmitting={isSubmitting || formikIsSubmitting} />
                        <Divider sx={{ mb: 3 }} />
                        
                        <ProductCommercialDataSection isEditMode={isEditMode} isSubmitting={isSubmitting || formikIsSubmitting} />
                        <Divider sx={{ mb: 3 }} />

                        <ProductReferenceSection name="oem_codes" title="Códigos de Equipo Original (OEM)" fieldLabels={{ brand: "Marca Vehículo", code: "Código Original" }} isSubmitting={isSubmitting || formikIsSubmitting} />
                        <Divider sx={{ mb: 3 }} />

                        <ProductReferenceSection name="cross_references" title="Referencias Cruzadas (Aftermarket)" fieldLabels={{ brand: "Marca Referencia", code: "Código Referencia" }} isSubmitting={isSubmitting || formikIsSubmitting} />
                        <Divider sx={{ mb: 3 }} />
                        
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" gutterBottom>Aplicaciones de Vehículos</Typography>
                            <FieldArray name="applications">
                                {({ push, remove }) => (
                                    <>
                                        {values.applications.map((app, index) => (
                                            <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}>
                                                <Grid item xs={12} sm={3}><Field component={TextField} fullWidth label="Marca Vehículo" name={`applications.${index}.brand`} disabled={isSubmitting || formikIsSubmitting} /></Grid>
                                                <Grid item xs={12} sm={3}><Field component={TextField} fullWidth label="Modelo" name={`applications.${index}.model`} disabled={isSubmitting || formikIsSubmitting} /></Grid>
                                                <Grid item xs={12} sm={3}><Field component={TextField} fullWidth label="Motor" name={`applications.${index}.engine`} disabled={isSubmitting || formikIsSubmitting} /></Grid>
                                                <Grid item xs={5} sm={1}><Field component={TextField} fullWidth type="number" label="Desde" name={`applications.${index}.year_from`} disabled={isSubmitting || formikIsSubmitting} /></Grid>
                                                <Grid item xs={5} sm={1}><Field component={TextField} fullWidth type="number" label="Hasta" name={`applications.${index}.year_to`} disabled={isSubmitting || formikIsSubmitting} /></Grid>
                                                <Grid item xs={2}><IconButton disabled={values.applications.length <= 1 || isSubmitting || formikIsSubmitting} onClick={() => remove(index)} color="error"><RemoveCircleOutlineIcon /></IconButton></Grid>
                                            </Grid>
                                        ))}
                                        <Button startIcon={<AddCircleOutlineIcon />} onClick={() => push(INITIAL_APPLICATION_STATE)} disabled={isSubmitting || formikIsSubmitting}>Añadir Aplicación</Button>
                                    </>
                                )}
                            </FieldArray>
                        </Box>

                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }} disabled={isSubmitting || formikIsSubmitting}>
                                {isSubmitting || formikIsSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar Producto' : 'Guardar Nuevo Producto')}
                            </Button>
                        </Box>
                    </Paper>
                </Form>
            )}
        </Formik>
    );
};

ProductForm.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    initialData: PropTypes.object,
    isSubmitting: PropTypes.bool,
};

export default ProductForm;