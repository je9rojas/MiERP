// frontend/src/features/inventory/components/product/ProductReferenceSection.js

/**
 * @file Componente de sección genérico para manejar arrays de referencias (marca/código).
 * @description Se utiliza para renderizar las tablas dinámicas de Códigos OEM y
 * Referencias Cruzadas, permitiendo al usuario añadir o quitar filas.
 */

// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
import React from 'react';
import { FieldArray } from 'formik';
import { Box, Grid, TextField, Button, Typography, IconButton } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

// SECCIÓN 2: DEFINICIONES DE DATOS Y ESTADOS INICIALES
const INITIAL_REFERENCE_STATE = { brand: '', code: '' };

// SECCIÓN 3: DEFINICIÓN DEL COMPONENTE
const ProductReferenceSection = ({ name, title, fieldLabels, formikProps }) => {
    const { values, handleChange } = formikProps;

    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>{title}</Typography>
            <FieldArray name={name}>
                {({ push, remove }) => (
                    <>
                        {values[name] && values[name].length > 0 && values[name].map((item, index) => (
                            <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}>
                                <Grid item xs={12} sm={5}>
                                    <TextField
                                        fullWidth
                                        label={fieldLabels.brand}
                                        name={`${name}.${index}.brand`}
                                        value={item.brand}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={5}>
                                    <TextField
                                        fullWidth
                                        label={fieldLabels.code}
                                        name={`${name}.${index}.code`}
                                        value={item.code}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={2}>
                                    <IconButton
                                        aria-label={`Quitar fila ${index + 1}`}
                                        disabled={values[name].length <= 1}
                                        onClick={() => remove(index)}
                                        color="error"
                                    >
                                        <RemoveCircleOutlineIcon />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        ))}
                        <Button
                            startIcon={<AddCircleOutlineIcon />}
                            onClick={() => push(INITIAL_REFERENCE_STATE)}
                        >
                            Añadir Fila
                        </Button>
                    </>
                )}
            </FieldArray>
        </Box>
    );
};

export default React.memo(ProductReferenceSection);