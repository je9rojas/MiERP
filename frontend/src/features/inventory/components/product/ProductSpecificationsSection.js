// frontend/src/features/inventory/components/product/ProductSpecificationsSection.js

/**
 * @file Componente de sección para las especificaciones técnicas del producto.
 * @description Renderiza campos de categoría y especificaciones condicionales para
 * productos de tipo 'filtro', incluyendo tipo, forma y dimensiones.
 */

// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
import React, { useMemo } from 'react';
import { Box, Grid, TextField, MenuItem, Typography, Divider } from '@mui/material';
import { PRODUCT_CATEGORIES, FILTER_TYPES, PRODUCT_SHAPES } from '../../../../constants/productConstants';

// SECCIÓN 2: DEFINICIONES DE DATOS Y SUB-COMPONENTES INTERNOS
const INITIAL_DIMENSIONS_STATE = { a: '', b: '', c: '', g: '', h: '', f: '' };

const DIMENSION_FIELD_DEFINITIONS = {
    panel: [ { name: 'a', label: 'Largo (A) mm' }, { name: 'b', label: 'Ancho (B) mm' }, { name: 'h', label: 'Alto (H) mm' } ],
    round: [ { name: 'a', label: 'Diámetro Ext. (A) mm' }, { name: 'b', label: 'Diámetro Int. (B) mm' }, { name: 'h', label: 'Altura (H) mm' } ],
    oval: [ { name: 'a', label: 'Largo Ext. (A) mm' }, { name: 'b', label: 'Ancho Ext. (B) mm' }, { name: 'h', label: 'Altura (H) mm' } ],
    cartridge: [ { name: 'a', label: 'Diámetro Ext. (A) mm' }, { name: 'b', label: 'Diámetro Int. Sup. (B) mm' }, { name: 'c', label: 'Diámetro Int. Inf. (C) mm' }, { name: 'h', label: 'Altura (H) mm' } ],
    spin_on: [ { name: 'h', label: 'Altura Total (H) mm' }, { name: 'g', label: 'Rosca (G)', type: 'text' }, { name: 'a', label: 'Ø Cuerpo (A) mm' }, { name: 'b', label: 'Ø Ext. Junta (B) mm' }, { name: 'c', label: 'Ø Int. Junta (C) mm' } ],
    in_line_diesel: [ { name: 'a', label: 'Largo Total (A) mm' }, { name: 'f', label: 'Tubo Entrada (F) mm' }, { name: 'g', label: 'Tubo Salida (G) mm' }, { name: 'h', label: 'Diámetro Cuerpo (H) mm' } ],
    in_line_gasoline: [ { name: 'a', label: 'Largo Total (A) mm' }, { name: 'f', label: 'Tubo Entrada (F) mm' }, { name: 'g', label: 'Tubo Salida (G) mm' }, { name: 'h', label: 'Diámetro Cuerpo (H) mm' } ],
};

// Sub-componente memoizado solo para las dimensiones
const DimensionFields = React.memo(({ shape, formikProps }) => {
    const fieldsToRender = useMemo(() => DIMENSION_FIELD_DEFINITIONS[shape] || [], [shape]);

    if (fieldsToRender.length === 0) {
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
                        type={field.type || 'text'}
                        value={formikProps.values.dimensions?.[field.name] || ''}
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


// SECCIÓN 3: DEFINICIÓN DEL COMPONENTE PRINCIPAL
const ProductSpecificationsSection = ({ formikProps }) => {
    const { values, touched, errors, handleChange, handleBlur, setFieldValue } = formikProps;

    const handleCategoryChange = (event) => {
        const newCategory = event.target.value;
        setFieldValue('category', newCategory);
        // Si la nueva categoría no es 'filtro', limpiar los campos dependientes.
        if (newCategory !== 'filter') {
            setFieldValue('product_type', 'n_a');
            setFieldValue('shape', '');
            setFieldValue('dimensions', INITIAL_DIMENSIONS_STATE);
        }
    };

    return (
        <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <TextField
                        select
                        required
                        fullWidth
                        label="Categoría"
                        name="category"
                        value={values.category}
                        onChange={handleCategoryChange}
                        onBlur={handleBlur}
                        error={touched.category && Boolean(errors.category)}
                        helperText={touched.category && errors.category}
                    >
                        {PRODUCT_CATEGORIES.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                    </TextField>
                </Grid>

                {values.category === 'filter' && (
                    <>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                select
                                required
                                fullWidth
                                label="Tipo de Filtro"
                                name="product_type"
                                value={values.product_type}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={touched.product_type && Boolean(errors.product_type)}
                                helperText={touched.product_type && errors.product_type}
                            >
                                {FILTER_TYPES.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                select
                                fullWidth
                                label="Forma"
                                name="shape"
                                value={values.shape || ''}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            >
                                {PRODUCT_SHAPES.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                            </TextField>
                        </Grid>
                    </>
                )}
            </Grid>
            
            {values.category === 'filter' && (
                <>
                    <Divider sx={{ mb: 3 }} />
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>Especificaciones y Medidas</Typography>
                        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <DimensionFields shape={values.shape} formikProps={formikProps} />
                        </Box>
                    </Box>
                </>
            )}
        </>
    );
};

export default React.memo(ProductSpecificationsSection);