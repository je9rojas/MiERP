// /frontend/src/features/crm/components/SupplierForm.js

/**
 * @file Componente de formulario compartido y reutilizable para la creación y edición de proveedores.
 *
 * Arquitectura:
 * - **Formik:** Gestiona el estado del formulario, el manejo de eventos y el envío de datos.
 * - **Yup:** Proporciona validación de datos en tiempo real importando un esquema centralizado.
 * - **Material-UI:** Construye una interfaz de usuario limpia y responsiva.
 * - **Hook Personalizado (`useSupplierForm`):** Aísla la lógica de inicialización de valores,
 *   asegurando que los datos que recibe Formik estén correctamente formateados (como strings).
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useMemo, useCallback } from 'react';
import { Formik, Form } from 'formik';
import { Button, Grid, Box, Typography, Paper, Divider, TextField } from '@mui/material';

import { supplierFormValidationSchema } from '../../../constants/validationSchemas';

// ==============================================================================
// SECCIÓN 2: ESTADOS INICIALES Y LÓGICA DEL FORMULARIO
// ==============================================================================

const INITIAL_CONTACT_STATE = { name: '', email: '', phone: '', position: '' };

/**
 * Hook personalizado que encapsula la lógica de inicialización del formulario.
 * @param {{ initialData: object, onSubmit: (values: object) => void }}
 */
const useSupplierForm = ({ initialData, onSubmit }) => {
    const initialValues = useMemo(() => {
        // Función de ayuda para garantizar que todos los valores sean strings, evitando problemas
        // con el estado 'dirty' de Formik y warnings de React sobre inputs no controlados.
        const formatValue = (value) => (value === null || value === undefined ? '' : String(value));

        const contact = initialData?.contact_person || {};

        return {
            ruc: formatValue(initialData?.ruc),
            business_name: formatValue(initialData?.business_name),
            trade_name: formatValue(initialData?.trade_name),
            address: formatValue(initialData?.address),
            phone: formatValue(initialData?.phone),
            email: formatValue(initialData?.email),
            contact_person: {
                name: formatValue(contact.name),
                email: formatValue(contact.email),
                phone: formatValue(contact.phone),
                position: formatValue(contact.position),
            },
        };
    }, [initialData]);

    const handleFormSubmit = useCallback((values) => {
        onSubmit(values);
    }, [onSubmit]);

    return {
        initialValues,
        validationSchema: supplierFormValidationSchema,
        handleFormSubmit,
    };
};

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL DEL FORMULARIO
// ==============================================================================

const SupplierForm = ({ initialData = {}, onSubmit, isSubmitting = false }) => {
    const { initialValues, validationSchema, handleFormSubmit } = useSupplierForm({ initialData, onSubmit });

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleFormSubmit}
            enableReinitialize
        >
            {({ values, errors, touched, handleChange, handleBlur }) => (
                <Form noValidate>
                    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Datos Principales del Proveedor
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    required
                                    name="ruc"
                                    label="RUC"
                                    value={values.ruc}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.ruc && Boolean(errors.ruc)}
                                    helperText={touched.ruc && errors.ruc}
                                    disabled={!!initialData.ruc} // El RUC no se puede editar
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    required
                                    name="business_name"
                                    label="Razón Social"
                                    value={values.business_name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.business_name && Boolean(errors.business_name)}
                                    helperText={touched.business_name && errors.business_name}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    name="trade_name"
                                    label="Nombre Comercial"
                                    value={values.trade_name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    name="phone"
                                    label="Teléfono Principal"
                                    value={values.phone}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    name="email"
                                    label="Correo Electrónico Principal"
                                    type="email"
                                    value={values.email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.email && Boolean(errors.email)}
                                    helperText={touched.email && errors.email}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    name="address"
                                    label="Dirección Fiscal"
                                    multiline
                                    rows={2}
                                    value={values.address}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 4 }} />

                        <Typography variant="h6" gutterBottom>
                            Persona de Contacto (Opcional)
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    name="contact_person.name"
                                    label="Nombre del Contacto"
                                    value={values.contact_person.name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    name="contact_person.position"
                                    label="Cargo del Contacto"
                                    value={values.contact_person.position}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    name="contact_person.email"
                                    label="Email del Contacto"
                                    type="email"
                                    value={values.contact_person.email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.contact_person?.email && Boolean(errors.contact_person?.email)}
                                    helperText={touched.contact_person?.email && errors.contact_person?.email}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    name="contact_person.phone"
                                    label="Teléfono del Contacto"
                                    value={values.contact_person.phone}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Guardando...' : (initialData.ruc ? 'Actualizar Proveedor' : 'Guardar Proveedor')}
                            </Button>
                        </Box>
                    </Paper>
                </Form>
            )}
        </Formik>
    );
};

export default SupplierForm;