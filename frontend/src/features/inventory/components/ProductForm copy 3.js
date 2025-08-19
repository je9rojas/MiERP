// /frontend/src/features/inventory/components/ProductForm.js

/**
 * @file Componente ensamblador del formulario de producto.
 * @description Este componente orquesta el estado del formulario con Formik,
 * transforma los datos para la API y compone la UI a partir de
 * sub-componentes de sección especializados. Mantiene la lógica de estado
 * separada de la renderización de campos.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
// ==============================================================================

import React, { useMemo, useCallback } from 'react';
import { Formik, Form, FieldArray } from 'formik';
import { Box, Button, Paper, Divider, Grid, IconButton, TextField, Typography } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

import { productFormValidationSchema } from '../../../constants/validationSchemas';

// Componentes de sección para la estructura del formulario
import ProductPrimaryInfoSection from './product/ProductPrimaryInfoSection';
import ProductCommercialDataSection from './product/ProductCommercialDataSection';
import ProductSpecificationsSection from './product/ProductSpecificationsSection';
import ProductReferenceSection from './product/ProductReferenceSection';

// ==============================================================================
// SECCIÓN 2: DEFINICIONES Y HOOKS AUXILIARES
// ==============================================================================

const INITIAL_APPLICATION_STATE = { brand: '', model: '', year_from: '', year_to: '', engine: '' };

/**
 * Hook personalizado para inicializar los valores del formulario de producto.
 * Separa la lógica de inicialización para modo 'creación' y 'edición'.
 * @param {object} initialData - Los datos del producto para el modo edición.
 * @param {boolean} isEditMode - Flag que determina el modo del formulario.
 * @returns {object} El objeto `initialValues` para Formik.
 */
const useProductFormInitializer = ({ initialData, isEditMode }) => {
    return useMemo(() => {
        const formatApiValue = (value) => (value === null || value === undefined ? '' : String(value));
        
        // --- VALORES POR DEFECTO PARA UN NUEVO PRODUCTO ---
        const defaults = {
            sku: '', name: '', brand: '', category: '', product_type: 'n_a', shape: '',
            description: '', main_image_url: '',
            price: '0', weight_g: '0', points_on_sale: '0',
            // --- NUEVOS CAMPOS ---
            // Estos campos son para el payload de creación, no son propiedades del producto.
            initial_quantity: '0',
            initial_cost: '0',
            // --- DATOS DE SOLO LECTURA ---
            // Se incluyen para poder mostrarlos en modo edición, pero se eliminarán al enviar.
            stock_quantity: '0',
            average_cost: '0',
            // --- ESTRUCTURAS COMPLEJAS ---
            dimensions: { a: '', b: '', c: '', g: '', h: '', f: '' },
            oem_codes: [{ brand: '', code: '' }],
            cross_references: [{ brand: '', code: '' }],
            applications: [INITIAL_APPLICATION_STATE],
        };
        
        if (!isEditMode || !initialData) {
            return defaults;
        }

        // --- VALORES PARA EL MODO EDICIÓN ---
        return {
            ...defaults,
            ...initialData,
            price: formatApiValue(initialData.price),
            weight_g: formatApiValue(initialData.weight_g),
            points_on_sale: formatApiValue(initialData.points_on_sale),
            // Los valores de stock son solo informativos en modo edición.
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

/**
 * Prepara los datos del formulario para que coincidan con el DTO esperado por la API.
 * @param {object} formValues - Los valores brutos del formulario de Formik.
 * @returns {object} Un objeto limpio y tipado, listo para ser enviado a la API.
 */
const prepareSubmitData = (formValues) => {
    const data = { ...formValues };

    // --- TRANSFORMACIÓN DE DATOS ---
    // Convierte campos numéricos de string a número.
    data.price = parseFloat(data.price || 0);
    data.weight_g = parseFloat(data.weight_g || 0);
    data.points_on_sale = parseFloat(data.points_on_sale || 0);

    // Mapea los años de las aplicaciones al formato esperado por la API.
    if (data.applications) {
        data.applications = data.applications.map(app => {
            const years = [];
            const yearFrom = parseInt(app.year_from, 10);
            const yearTo = parseInt(app.year_to, 10);
            if (!isNaN(yearFrom) && !isNaN(yearTo)) {
                for (let y = yearFrom; y <= yearTo; y++) {
                    years.push(y);
                }
            }
            return { ...app, years };
        });
    }

    // --- SEPARACIÓN DE CONCERNS (Lógica de Creación vs. Catálogo) ---
    // Extrae los datos de inventario inicial para el payload de creación.
    const initial_quantity = parseInt(data.initial_quantity || 0, 10);
    const initial_cost = parseFloat(data.initial_cost || 0);

    // Elimina los campos que no pertenecen al DTO de `ProductCreate` o `ProductUpdate`.
    delete data.initial_quantity;
    delete data.initial_cost;
    delete data.stock_quantity; // Campo de solo lectura.
    delete data.average_cost; // Campo de solo lectura.

    return {
        catalogData: data,
        initialInventoryData: { initial_quantity, initial_cost }
    };
};

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL
// ==============================================================================

const ProductForm = ({ onSubmit, initialData = {}, isSubmitting = false }) => {
    const isEditMode = !!initialData.sku;
    const initialValues = useProductFormInitializer({ initialData, isEditMode });
    
    const handleFormSubmit = useCallback((formValues) => {
        const { catalogData, initialInventoryData } = prepareSubmitData(formValues);
        
        if (isEditMode) {
            onSubmit(catalogData); // En modo edición, solo se envían los datos del catálogo.
        } else {
            // En modo creación, se envían tanto el catálogo como el inventario inicial.
            const payload = { ...catalogData, ...initialInventoryData };
            onSubmit(payload);
        }
    }, [onSubmit, isEditMode]);

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

                        {/* Se pasa `isEditMode` para que la sección sepa si debe renderizar los campos de stock inicial. */}
                        <ProductCommercialDataSection formikProps={formikProps} isEditMode={isEditMode} />
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