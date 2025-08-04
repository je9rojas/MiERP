/**
 * @file Componente de formulario compartido y reutilizable para la creación y edición de productos.
 *
 * Arquitectura:
 * - **Formik:** Gestiona el estado del formulario, el manejo de eventos y el ciclo de vida del envío.
 * - **Yup:** Proporciona validación de datos en tiempo real a través de un esquema centralizado.
 * - **Material-UI:** Construye una interfaz de usuario limpia y responsiva.
 * - **Hook Personalizado (`useProductForm`):** Aísla toda la lógica de negocio compleja (inicialización,
 *   transformación de datos) del componente de renderizado, promoviendo la separación de conceptos.
 * - **Sub-componentes Memoizados:** Descompone la UI en piezas más pequeñas y optimizadas para
 *   mejorar la legibilidad y el rendimiento.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useMemo, useCallback } from 'react';
import { Formik, Form, FieldArray } from 'formik';
import { Box, TextField, Button, Grid, MenuItem, Typography, Divider, IconButton } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

import { PRODUCT_CATEGORIES, FILTER_TYPES, PRODUCT_SHAPES } from '../../../constants/productConstants';
import { productFormValidationSchema } from '../../../constants/validationSchemas';

// ==============================================================================
// SECCIÓN 2: DEFINICIONES DE DATOS Y ESTADOS INICIALES
// ==============================================================================

const INITIAL_DIMENSIONS_STATE = { a: '', b: '', c: '', g: '', h: '', f: '' };
const INITIAL_REFERENCE_STATE = { brand: '', code: '' };
const INITIAL_APPLICATION_STATE = { brand: '', model: '', year_from: '', year_to: '', engine: '' };

const DIMENSION_FIELD_DEFINITIONS = {
    panel: [ { name: 'a', label: 'Largo (A) mm' }, { name: 'b', label: 'Ancho (B) mm' }, { name: 'h', label: 'Alto (H) mm' } ],
    round: [ { name: 'a', label: 'Diámetro Ext. (A) mm' }, { name: 'b', label: 'Diámetro Int. (B) mm' }, { name: 'h', label: 'Altura (H) mm' } ],
    oval: [ { name: 'a', label: 'Largo Ext. (A) mm' }, { name: 'b', label: 'Ancho Ext. (B) mm' }, { name: 'h', label: 'Altura (H) mm' } ],
    cartridge: [ { name: 'a', label: 'Diámetro Ext. (A) mm' }, { name: 'b', label: 'Diámetro Int. Sup. (B) mm' }, { name: 'c', label: 'Diámetro Int. Inf. (C) mm' }, { name: 'h', label: 'Altura (H) mm' } ],
    spin_on: [ { name: 'h', label: 'Altura Total (H) mm' }, { name: 'g', label: 'Rosca (G)', type: 'text' }, { name: 'a', label: 'Ø Cuerpo (A) mm' }, { name: 'b', label: 'Ø Ext. Junta (B) mm' }, { name: 'c', label: 'Ø Int. Junta (C) mm' } ],
    in_line_diesel: [ { name: 'a', label: 'Largo Total (A) mm' }, { name: 'f', label: 'Tubo Entrada (F) mm' }, { name: 'g', label: 'Tubo Salida (G) mm' }, { name: 'h', label: 'Diámetro Cuerpo (H) mm' } ],
    in_line_gasoline: [ { name: 'a', label: 'Largo Total (A) mm' }, { name: 'f', label: 'Tubo Entrada (F) mm' }, { name: 'g', label: 'Tubo Salida (G) mm' }, { name: 'h', 'label': 'Diámetro Cuerpo (H) mm' } ],
};

// ==============================================================================
// SECCIÓN 3: SUB-COMPONENTES DE UI REUTILIZABLES Y MEMOIZADOS
// ==============================================================================

const DimensionFields = React.memo(({ shape, formikProps }) => {
    const fieldsToRender = DIMENSION_FIELD_DEFINITIONS[shape];

    if (!fieldsToRender) {
        return <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>Seleccione una forma para especificar sus medidas.</Typography>;
    }

    return (
        <Grid container spacing={2}>
            {fieldsToRender.map(field => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={field.name}>
                    <TextField
                        fullWidth
                        name={`dimensions.${field.name}`}
                        label={field.label}
                        type={field.type || 'text'} // 'text' para permitir números y formatos de rosca
                        value={formikProps.values.dimensions[field.name] || ''}
                        onChange={formikProps.handleChange}
                        onBlur={formikProps.handleBlur}
                        error={formikProps.touched.dimensions?.[field.name] && Boolean(formikProps.errors.dimensions?.[field.name])}
                        helperText={formikProps.touched.dimensions?.[field.name] && formikProps.errors.dimensions?.[field.name]}
                    />
                </Grid>
            ))}
        </Grid>
    );
});

const ReferenceArraySection = React.memo(({ name, title, fieldLabels, formikProps }) => (
    <FieldArray name={name}>
        {({ push, remove }) => (
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>{title}</Typography>
                {formikProps.values[name].map((item, index) => (
                    <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}>
                        <Grid item xs={10} sm={5}><TextField fullWidth label={fieldLabels.brand} name={`${name}.${index}.brand`} value={item.brand} onChange={formikProps.handleChange} /></Grid>
                        <Grid item xs={10} sm={5}><TextField fullWidth label={fieldLabels.code} name={`${name}.${index}.code`} value={item.code} onChange={formikProps.handleChange} /></Grid>
                        <Grid item xs={2}><IconButton disabled={formikProps.values[name].length <= 1} onClick={() => remove(index)} color="error"><RemoveCircleOutlineIcon /></IconButton></Grid>
                    </Grid>
                ))}
                <Button startIcon={<AddCircleOutlineIcon />} onClick={() => push(INITIAL_REFERENCE_STATE)}>Añadir Fila</Button>
            </Box>
        )}
    </FieldArray>
));


// ==============================================================================
// SECCIÓN 4: HOOK PERSONALIZADO PARA LA LÓGICA DEL FORMULARIO
// ==============================================================================

/**
 * Encapsula toda la lógica de negocio para el formulario de producto.
 * @param {{ initialData: object, onSubmit: (data: object) => void }}
 * @returns {{ initialValues: object, validationSchema: object, handleFormSubmit: (values: object) => void }}
 */
const useProductForm = ({ initialData, onSubmit }) => {

    const initialValues = useMemo(() => {
        const applications = initialData.applications?.length
            ? initialData.applications.map(app => ({
                ...app,
                year_from: app.years?.length ? Math.min(...app.years) : '',
                year_to: app.years?.length ? Math.max(...app.years) : ''
              }))
            : [INITIAL_APPLICATION_STATE];

        return {
            sku: initialData.sku || '',
            name: initialData.name || '',
            brand: initialData.brand || '',
            category: initialData.category || '',
            product_type: initialData.product_type || '',
            shape: initialData.shape || '',
            description: initialData.description || '',
            main_image_url: initialData.main_image_url || '',
            cost: initialData.cost ?? '',
            price: initialData.price ?? '',
            stock_quantity: initialData.stock_quantity ?? '',
            weight_g: initialData.weight_g ?? '',
            dimensions: initialData.dimensions ? { ...INITIAL_DIMENSIONS_STATE, ...initialData.dimensions } : INITIAL_DIMENSIONS_STATE,
            oem_codes: initialData.oem_codes?.length ? initialData.oem_codes : [INITIAL_REFERENCE_STATE],
            cross_references: initialData.cross_references?.length ? initialData.cross_references : [INITIAL_REFERENCE_STATE],
            applications,
        };
    }, [initialData]);

    const handleFormSubmit = useCallback((values) => {
        // 1. Limpiar y transformar datos para la API
        const cleanedDimensions = Object.fromEntries(
            Object.entries(values.dimensions).filter(([, value]) => value !== null && String(value).trim() !== '')
        );

        const dataToSend = {
            ...values,
            // 2. Asegurar tipos numéricos correctos
            cost: parseFloat(String(values.cost)),
            price: parseFloat(String(values.price)),
            stock_quantity: parseInt(String(values.stock_quantity || 0), 10),
            weight_g: String(values.weight_g).trim() === '' ? null : parseFloat(String(values.weight_g)),

            // 3. Normalizar valores vacíos o no aplicables
            product_type: values.category === 'filter' ? values.product_type : 'n_a',
            shape: values.category === 'filter' ? (values.shape || 'n_a') : 'n_a',

            // 4. Asignar dimensiones limpias (o null si está vacío)
            dimensions: Object.keys(cleanedDimensions).length > 0 ? cleanedDimensions : null,

            // 5. Filtrar filas de arrays que estén completamente vacías
            oem_codes: values.oem_codes.filter(oem => oem.brand.trim() || oem.code.trim()),
            cross_references: values.cross_references.filter(ref => ref.brand.trim() || ref.code.trim()),

            // 6. Procesar aplicaciones: filtrar vacías y generar el array de años
            applications: values.applications
                .filter(app => app.brand.trim() || app.model.trim() || app.engine.trim())
                .map(app => {
                    const startYear = parseInt(app.year_from, 10);
                    const endYear = parseInt(app.year_to || app.year_from, 10); // Si 'to' está vacío, usa 'from'
                    const years = [];
                    if (!isNaN(startYear) && !isNaN(endYear) && startYear <= endYear) {
                        for (let year = startYear; year <= endYear; year++) {
                            years.push(year);
                        }
                    }
                    return {
                        brand: app.brand.trim(),
                        model: app.model?.trim() || null,
                        engine: app.engine?.trim() || null,
                        years,
                    };
                }),
        };

        // 7. Llamar a la función onSubmit del componente padre
        onSubmit(dataToSend);

    }, [onSubmit]);

    return {
        initialValues,
        validationSchema: productFormValidationSchema,
        handleFormSubmit,
    };
};

// ==============================================================================
// SECCIÓN 5: COMPONENTE PRINCIPAL DEL FORMULARIO
// ==============================================================================

const ProductForm = ({ onSubmit, initialData = {}, isSubmitting = false }) => {

    const { initialValues, validationSchema, handleFormSubmit } = useProductForm({ initialData, onSubmit });

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleFormSubmit}
            enableReinitialize // Permite que el formulario se reinicie si `initialData` cambia
        >
            {(formikProps) => (
                <Form noValidate>
                    <Typography variant="h6" gutterBottom>Información Principal</Typography>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={4}><TextField fullWidth required name="sku" label="SKU / Código" value={formikProps.values.sku} onChange={formikProps.handleChange} onBlur={formikProps.handleBlur} error={formikProps.touched.sku && Boolean(formikProps.errors.sku)} helperText={formikProps.touched.sku && formikProps.errors.sku} disabled={!!initialData.sku} /></Grid>
                        <Grid item xs={12} sm={8}><TextField fullWidth required name="name" label="Nombre del Producto" value={formikProps.values.name} onChange={formikProps.handleChange} onBlur={formikProps.handleBlur} error={formikProps.touched.name && Boolean(formikProps.errors.name)} helperText={formikProps.touched.name && formikProps.errors.name} /></Grid>
                        <Grid item xs={12}><TextField fullWidth required name="brand" label="Marca" value={formikProps.values.brand} onChange={formikProps.handleChange} onBlur={formikProps.handleBlur} error={formikProps.touched.brand && Boolean(formikProps.errors.brand)} helperText={formikProps.touched.brand && formikProps.errors.brand} /></Grid>
                        <Grid item xs={12}><TextField fullWidth name="main_image_url" label="URL de la Imagen Principal" value={formikProps.values.main_image_url} onChange={formikProps.handleChange} onBlur={formikProps.handleBlur} error={formikProps.touched.main_image_url && Boolean(formikProps.errors.main_image_url)} helperText={formikProps.touched.main_image_url && formikProps.errors.main_image_url} placeholder="https://ejemplo.com/imagen.jpg" /></Grid>
                        <Grid item xs={12}><Grid container spacing={2}><Grid item xs={12} sm={4}><TextField select required fullWidth label="Categoría" name="category" value={formikProps.values.category} onChange={(e) => { const isFilter = e.target.value === 'filter'; formikProps.setFieldValue('category', e.target.value); if (!isFilter) { formikProps.setFieldValue('product_type', 'n_a'); formikProps.setFieldValue('shape', 'n_a'); formikProps.setFieldValue('dimensions', INITIAL_DIMENSIONS_STATE); } }} onBlur={formikProps.handleBlur} error={formikProps.touched.category && Boolean(formikProps.errors.category)} helperText={formikProps.touched.category && formikProps.errors.category}>{PRODUCT_CATEGORIES.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}</TextField></Grid>{formikProps.values.category === 'filter' && (<><Grid item xs={12} sm={4}><TextField select required fullWidth label="Tipo de Filtro" name="product_type" value={formikProps.values.product_type} onChange={formikProps.handleChange} onBlur={formikProps.handleBlur} error={formikProps.touched.product_type && Boolean(formikProps.errors.product_type)} helperText={formikProps.touched.product_type && formikProps.errors.product_type}>{FILTER_TYPES.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}</TextField></Grid><Grid item xs={12} sm={4}><TextField select fullWidth label="Forma" name="shape" value={formikProps.values.shape} onChange={formikProps.handleChange} onBlur={formikProps.handleBlur}>{PRODUCT_SHAPES.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}</TextField></Grid></>)}</Grid></Grid>
                        <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Descripción y Notas" name="description" value={formikProps.values.description} onChange={formikProps.handleChange} /></Grid>
                    </Grid>
                    <Divider sx={{ mb: 3 }} />

                    <Typography variant="h6" sx={{ mb: 2 }}>Datos Comerciales y Logísticos</Typography>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6} sm={3}><TextField fullWidth required type="text" label="Costo" name="cost" value={formikProps.values.cost} onChange={formikProps.handleChange} onBlur={formikProps.handleBlur} error={formikProps.touched.cost && Boolean(formikProps.errors.cost)} helperText={formikProps.touched.cost && formikProps.errors.cost} /></Grid>
                        <Grid item xs={6} sm={3}><TextField fullWidth required type="text" label="Precio" name="price" value={formikProps.values.price} onChange={formikProps.handleChange} onBlur={formikProps.handleBlur} error={formikProps.touched.price && Boolean(formikProps.errors.price)} helperText={formikProps.touched.price && formikProps.errors.price} /></Grid>
                        <Grid item xs={6} sm={3}><TextField fullWidth type="number" label="Stock" name="stock_quantity" value={formikProps.values.stock_quantity} onChange={formikProps.handleChange} /></Grid>
                        <Grid item xs={6} sm={3}><TextField fullWidth type="text" label="Peso (g)" name="weight_g" value={formikProps.values.weight_g} onChange={formikProps.handleChange} onBlur={formikProps.handleBlur} error={formikProps.touched.weight_g && Boolean(formikProps.errors.weight_g)} helperText={formikProps.touched.weight_g && formikProps.errors.weight_g} /></Grid>
                    </Grid>
                    <Divider sx={{ mb: 3 }} />

                    {formikProps.values.category === 'filter' && (
                        <>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom>Especificaciones y Medidas</Typography>
                                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                    <DimensionFields shape={formikProps.values.shape} formikProps={formikProps} />
                                </Box>
                            </Box>
                            <Divider sx={{ mb: 3 }} />
                        </>
                    )}

                    <ReferenceArraySection name="oem_codes" title="Códigos de Equipo Original (OEM)" fieldLabels={{ brand: "Marca Vehículo", code: "Código Original" }} formikProps={formikProps} />
                    <Divider sx={{ mb: 3 }} />

                    <ReferenceArraySection name="cross_references" title="Referencias Cruzadas (Aftermarket)" fieldLabels={{ brand: "Marca Referencia", code: "Código Referencia" }} formikProps={formikProps} />
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

                    <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }} disabled={isSubmitting || !formikProps.isValid || !formikProps.dirty}>
                        {isSubmitting ? 'Guardando...' : (initialData.sku ? 'Actualizar Producto' : 'Guardar Nuevo Producto')}
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

export default ProductForm;