// File: /frontend/src/features/crm/components/SupplierForm.js

/**
 * @file Componente de formulario compartido y reutilizable para la creación y edición de proveedores.
 *
 * Arquitectura:
 * - **Formik:** Gestiona el estado del formulario, incluyendo el array dinámico de correos.
 * - **Yup:** Valida los datos a través de un esquema importado.
 * - **Material-UI y formik-material-ui:** Construyen una interfaz de usuario limpia y declarativa.
 * - **Sub-componentes:** Descompone la UI en piezas manejables (ej. `EmailArraySection`).
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field, FieldArray } from 'formik';
import {
    Button, Grid, Box, Typography, Paper, Divider,
    IconButton, MenuItem,
} from '@mui/material';
import { TextField } from 'formik-material-ui';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

import { supplierFormValidationSchema } from '../../../constants/validationSchemas';
import { EMAIL_PURPOSES } from '../../../constants/crmConstants';

// ==============================================================================
// SECCIÓN 2: CONSTANTES Y ESTADOS INICIALES
// ==============================================================================

const INITIAL_EMAIL_STATE = { address: '', purpose: 'general' };

// ==============================================================================
// SECCIÓN 3: SUB-COMPONENTES DE UI
// ==============================================================================

const EmailArraySection = ({ values, isSubmitting }) => (
    <FieldArray name="emails">
        {({ push, remove }) => (
            <Box>
                {values.emails.map((email, index) => (
                    <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}>
                        <Grid item xs={12} sm={6}>
                            <Field
                                component={TextField}
                                name={`emails.${index}.address`}
                                label={`Correo Electrónico #${index + 1}`}
                                type="email"
                                fullWidth
                                disabled={isSubmitting}
                            />
                        </Grid>
                        <Grid item xs={10} sm={4}>
                            <Field
                                component={TextField}
                                name={`emails.${index}.purpose`}
                                label="Propósito"
                                select
                                fullWidth
                                disabled={isSubmitting}
                            >
                                {EMAIL_PURPOSES.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Field>
                        </Grid>
                        <Grid item xs={2} sm={2}>
                            <IconButton onClick={() => remove(index)} color="error" aria-label="Eliminar correo" disabled={isSubmitting}>
                                <RemoveCircleOutlineIcon />
                            </IconButton>
                        </Grid>
                    </Grid>
                ))}
                <Button startIcon={<AddCircleOutlineIcon />} onClick={() => push(INITIAL_EMAIL_STATE)} disabled={isSubmitting}>
                    Añadir Correo
                </Button>
            </Box>
        )}
    </FieldArray>
);

// ==============================================================================
// SECCIÓN 4: COMPONENTE PRINCIPAL DEL FORMULARIO
// ==============================================================================

const SupplierForm = ({ initialData = null, onSubmit, isSubmitting = false }) => {
    const isEditMode = Boolean(initialData);

    const initialValues = useMemo(() => ({
        tax_id: initialData?.tax_id || '',
        business_name: initialData?.business_name || '',
        trade_name: initialData?.trade_name || '',
        address: initialData?.address || '',
        phone: initialData?.phone || '',
        emails: initialData?.emails?.length ? initialData.emails : [INITIAL_EMAIL_STATE],
        contact_person: {
            name: initialData?.contact_person?.name || '',
            email: initialData?.contact_person?.email || '',
            phone: initialData?.contact_person?.phone || '',
            position: initialData?.contact_person?.position || '',
        },
    }), [initialData]);
    
    const handleFormSubmit = (values, actions) => {
        const cleanedValues = {
            ...values,
            emails: values.emails.filter(email => email.address && email.address.trim() !== ''),
        };
        onSubmit(cleanedValues, actions);
    };

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={supplierFormValidationSchema}
            onSubmit={handleFormSubmit}
            enableReinitialize
        >
            {({ values, isSubmitting: formikIsSubmitting }) => (
                <Form noValidate>
                    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom>Datos Principales del Proveedor</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}><Field component={TextField} required name="tax_id" label="ID Fiscal / RUC" fullWidth disabled={isSubmitting || formikIsSubmitting || isEditMode} /></Grid>
                            <Grid item xs={12} sm={6}><Field component={TextField} required name="business_name" label="Razón Social" fullWidth disabled={isSubmitting || formikIsSubmitting} /></Grid>
                            <Grid item xs={12} sm={6}><Field component={TextField} name="trade_name" label="Nombre Comercial" fullWidth disabled={isSubmitting || formikIsSubmitting} /></Grid>
                            <Grid item xs={12} sm={6}><Field component={TextField} name="phone" label="Teléfono Principal" fullWidth disabled={isSubmitting || formikIsSubmitting} /></Grid>
                            <Grid item xs={12}><Field component={TextField} name="address" label="Dirección Fiscal" multiline rows={2} fullWidth disabled={isSubmitting || formikIsSubmitting} /></Grid>
                        </Grid>

                        <Divider sx={{ my: 4 }} />
                        <Typography variant="h6" gutterBottom>Correos Electrónicos de Contacto</Typography>
                        <EmailArraySection values={values} isSubmitting={isSubmitting || formikIsSubmitting} />

                        <Divider sx={{ my: 4 }} />
                        <Typography variant="h6" gutterBottom>Persona de Contacto (Opcional)</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}><Field component={TextField} name="contact_person.name" label="Nombre del Contacto" fullWidth disabled={isSubmitting || formikIsSubmitting} /></Grid>
                            <Grid item xs={12} sm={6}><Field component={TextField} name="contact_person.position" label="Cargo del Contacto" fullWidth disabled={isSubmitting || formikIsSubmitting} /></Grid>
                            <Grid item xs={12} sm={6}><Field component={TextField} name="contact_person.email" label="Email del Contacto" type="email" fullWidth disabled={isSubmitting || formikIsSubmitting} /></Grid>
                            <Grid item xs={12} sm={6}><Field component={TextField} name="contact_person.phone" label="Teléfono del Contacto" fullWidth disabled={isSubmitting || formikIsSubmitting} /></Grid>
                        </Grid>

                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button type="submit" variant="contained" size="large" disabled={isSubmitting || formikIsSubmitting}>
                                {isSubmitting || formikIsSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar Proveedor' : 'Guardar Proveedor')}
                            </Button>
                        </Box>
                    </Paper>
                </Form>
            )}
        </Formik>
    );
};

SupplierForm.propTypes = {
    initialData: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool,
};

export default SupplierForm;