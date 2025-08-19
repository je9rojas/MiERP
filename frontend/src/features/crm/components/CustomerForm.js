// frontend/src/features/crm/components/CustomerForm.js

/**
 * @file Componente reutilizable con el formulario para crear o editar un Cliente.
 *
 * @description Utiliza Formik para la gestión del estado y Yup para la validación.
 * Está diseñado para ser controlado desde un componente padre que le proporcionará
 * los datos iniciales y la lógica de envío.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field } from 'formik';
import * as yup from 'yup';
import {
    Box, Grid, Button, Typography, Paper, Divider,
    MenuItem
} from '@mui/material';
import { TextField } from 'formik-material-ui';

// ==============================================================================
// SECCIÓN 2: ESQUEMA DE VALIDACIÓN
// ==============================================================================

const customerValidationSchema = yup.object().shape({
    business_name: yup.string()
        .trim()
        .max(200, 'La Razón Social no puede exceder los 200 caracteres.')
        .required('La Razón Social es obligatoria.'),
    
    doc_number: yup.string()
        .trim()
        .max(20, 'El N° de Documento no puede exceder los 20 caracteres.')
        .required('El N° de Documento es obligatorio.'),
    
    // --- CORRECCIONES DE VALIDACIÓN ---
    // Los siguientes campos son opcionales y solo se validan si tienen valor.
    
    doc_type: yup.string()
        .oneOf(['ruc', 'dni', 'ce', 'other'], 'Tipo de documento no válido.'),

    address: yup.string()
        .trim()
        .max(255, 'La dirección no puede exceder los 255 caracteres.'),

    phone: yup.string()
        .trim()
        .max(20, 'El teléfono no puede exceder los 20 caracteres.'),
    
    contact_person: yup.object().shape({
        name: yup.string().trim().max(100, 'El nombre del contacto no puede exceder los 100 caracteres.'),
        // Yup no aplicará la validación .email() si el string está vacío, solucionando el error.
        email: yup.string().email('Formato de correo inválido.'),
        phone: yup.string().trim().max(20, 'El teléfono del contacto no puede exceder los 20 caracteres.'),
        position: yup.string().trim().max(100, 'El cargo del contacto no puede exceder los 100 caracteres.'),
    }),
});

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL DEL FORMULARIO
// ==============================================================================

const CustomerForm = ({
    initialData = null,
    onSubmit,
    isSubmitting = false
}) => {
    const initialValues = useMemo(() => ({
        business_name: initialData?.business_name || '',
        doc_type: initialData?.doc_type || 'ruc',
        doc_number: initialData?.doc_number || '',
        address: initialData?.address || '',
        phone: initialData?.phone || '',
        emails: initialData?.emails || [],
        contact_person: {
            name: initialData?.contact_person?.name || '',
            email: initialData?.contact_person?.email || '',
            phone: initialData?.contact_person?.phone || '',
            position: initialData?.contact_person?.position || '',
        },
    }), [initialData]);

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={customerValidationSchema}
            onSubmit={onSubmit}
            enableReinitialize
        >
            {({ isSubmitting: formikIsSubmitting }) => (
                <Form noValidate>
                    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>Datos Principales</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={8}>
                                <Field component={TextField} name="business_name" label="Razón Social / Nombre Completo" fullWidth required disabled={isSubmitting || formikIsSubmitting} />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Field component={TextField} name="phone" label="Teléfono Principal" fullWidth disabled={isSubmitting || formikIsSubmitting} />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Field component={TextField} type="text" name="doc_type" label="Tipo de Documento" select fullWidth disabled={isSubmitting || formikIsSubmitting}>
                                    <MenuItem value="ruc">RUC</MenuItem>
                                    <MenuItem value="dni">DNI</MenuItem>
                                    <MenuItem value="ce">Carnet de Extranjería</MenuItem>
                                    <MenuItem value="other">Otro</MenuItem>
                                </Field>
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <Field component={TextField} name="doc_number" label="N° de Documento" fullWidth required disabled={isSubmitting || formikIsSubmitting} />
                            </Grid>
                            <Grid item xs={12}>
                                <Field component={TextField} name="address" label="Dirección Fiscal" fullWidth disabled={isSubmitting || formikIsSubmitting} />
                            </Grid>
                        </Grid>
                    </Paper>

                    <Divider sx={{ my: 4 }} />

                    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>Persona de Contacto (Opcional)</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Field component={TextField} name="contact_person.name" label="Nombre del Contacto" fullWidth disabled={isSubmitting || formikIsSubmitting} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Field component={TextField} name="contact_person.position" label="Cargo / Puesto" fullWidth disabled={isSubmitting || formikIsSubmitting} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Field component={TextField} name="contact_person.email" label="Email del Contacto" type="email" fullWidth disabled={isSubmitting || formikIsSubmitting} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Field component={TextField} name="contact_person.phone" label="Teléfono del Contacto" fullWidth disabled={isSubmitting || formikIsSubmitting} />
                            </Grid>
                        </Grid>
                    </Paper>

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={isSubmitting || formikIsSubmitting}
                        >
                            {isSubmitting || formikIsSubmitting ? 'Guardando...' : 'Guardar Cliente'}
                        </Button>
                    </Box>
                </Form>
            )}
        </Formik>
    );
};

// ==============================================================================
// SECCIÓN 4: DEFINICIÓN DE PROPTYPES
// ==============================================================================

CustomerForm.propTypes = {
    initialData: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool,
};

export default CustomerForm;