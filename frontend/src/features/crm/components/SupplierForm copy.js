// /frontend/src/features/crm/components/SupplierForm.js

/**
 * @file Componente de formulario compartido y reutilizable para la creación y edición de proveedores.
 *
 * Arquitectura:
 * - **Formik:** Gestiona el estado del formulario, incluyendo el array dinámico de correos.
 * - **Yup:** Valida los datos a través de un esquema importado.
 * - **Material-UI:** Construye una interfaz de usuario limpia.
 * - **Hook Personalizado (`useSupplierForm`):** Aísla la lógica de inicialización de valores.
 * - **Sub-componentes:** Descompone la UI en piezas manejables (ej. `EmailArraySection`).
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useMemo, useCallback } from 'react';
import { Formik, Form, FieldArray } from 'formik';
import {
    Button, Grid, Box, Typography, Paper, Divider, TextField,
    IconButton, MenuItem,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

import { supplierFormValidationSchema } from '../../../constants/validationSchemas';
import { EMAIL_PURPOSES } from '../../../constants/crmConstants';

// ==============================================================================
// SECCIÓN 2: ESTADOS INICIALES Y LÓGICA DEL FORMULARIO
// ==============================================================================

const INITIAL_EMAIL_STATE = { address: '', purpose: 'general' };
const INITIAL_CONTACT_STATE = { name: '', email: '', phone: '', position: '' };

const useSupplierForm = ({ initialData, onSubmit }) => {
    const initialValues = useMemo(() => {
        const formatValue = (value) => (value === null || value === undefined ? '' : String(value));
        const contact = initialData?.contact_person || {};

        return {
            tax_id: formatValue(initialData?.tax_id),
            business_name: formatValue(initialData?.business_name),
            trade_name: formatValue(initialData?.trade_name),
            address: formatValue(initialData?.address),
            phone: formatValue(initialData?.phone),
            emails: initialData?.emails?.length ? initialData.emails : [INITIAL_EMAIL_STATE],
            contact_person: {
                name: formatValue(contact.name),
                email: formatValue(contact.email),
                phone: formatValue(contact.phone),
                position: formatValue(contact.position),
            },
        };
    }, [initialData]);

    const handleFormSubmit = useCallback((values) => {
        // Limpiamos las filas de correos vacías antes de enviar
        const cleanedValues = {
            ...values,
            emails: values.emails.filter(email => email.address && email.address.trim() !== ''),
        };
        onSubmit(cleanedValues);
    }, [onSubmit]);

    return {
        initialValues,
        validationSchema: supplierFormValidationSchema,
        handleFormSubmit,
    };
};

// ==============================================================================
// SECCIÓN 3: SUB-COMPONENTES DE UI
// ==============================================================================

const EmailArraySection = ({ formikProps }) => (
    <FieldArray name="emails">
        {({ push, remove }) => (
            <Box>
                {formikProps.values.emails.map((email, index) => (
                    <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                name={`emails.${index}.address`}
                                label={`Correo Electrónico #${index + 1}`}
                                type="email"
                                value={email.address}
                                onChange={formikProps.handleChange}
                                onBlur={formikProps.handleBlur}
                                error={formikProps.touched.emails?.[index]?.address && Boolean(formikProps.errors.emails?.[index]?.address)}
                                helperText={formikProps.touched.emails?.[index]?.address && formikProps.errors.emails?.[index]?.address}
                            />
                        </Grid>
                        <Grid item xs={10} sm={4}>
                            <TextField
                                select
                                fullWidth
                                name={`emails.${index}.purpose`}
                                label="Propósito"
                                value={email.purpose}
                                onChange={formikProps.handleChange}
                                onBlur={formikProps.handleBlur}
                            >
                                {EMAIL_PURPOSES.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={2} sm={2}>
                            <IconButton onClick={() => remove(index)} color="error" aria-label="Eliminar correo">
                                <RemoveCircleOutlineIcon />
                            </IconButton>
                        </Grid>
                    </Grid>
                ))}
                <Button startIcon={<AddCircleOutlineIcon />} onClick={() => push(INITIAL_EMAIL_STATE)}>
                    Añadir Correo
                </Button>
            </Box>
        )}
    </FieldArray>
);


// ==============================================================================
// SECCIÓN 4: COMPONENTE PRINCIPAL DEL FORMULARIO
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
            {(formikProps) => (
                <Form noValidate>
                    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom>Datos Principales del Proveedor</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}><TextField fullWidth required name="tax_id" label="ID Fiscal / RUC" value={formikProps.values.tax_id} onChange={formikProps.handleChange} onBlur={formikProps.handleBlur} error={formikProps.touched.tax_id && Boolean(formikProps.errors.tax_id)} helperText={formikProps.touched.tax_id && formikProps.errors.tax_id} disabled={!!initialData.tax_id} /></Grid>
                            <Grid item xs={12} sm={6}><TextField fullWidth required name="business_name" label="Razón Social" value={formikProps.values.business_name} onChange={formikProps.handleChange} onBlur={formikProps.handleBlur} error={formikProps.touched.business_name && Boolean(formikProps.errors.business_name)} helperText={formikProps.touched.business_name && formikProps.errors.business_name} /></Grid>
                            <Grid item xs={12} sm={6}><TextField fullWidth name="trade_name" label="Nombre Comercial" value={formikProps.values.trade_name} onChange={formikProps.handleChange} onBlur={formikProps.handleBlur} /></Grid>
                            <Grid item xs={12} sm={6}><TextField fullWidth name="phone" label="Teléfono Principal" value={formikProps.values.phone} onChange={formikProps.handleChange} onBlur={formikProps.handleBlur} /></Grid>
                            <Grid item xs={12}><TextField fullWidth name="address" label="Dirección Fiscal" multiline rows={2} value={formikProps.values.address} onChange={formikProps.handleChange} onBlur={formikProps.handleBlur} /></Grid>
                        </Grid>

                        <Divider sx={{ my: 4 }} />
                        <Typography variant="h6" gutterBottom>Correos Electrónicos de Contacto</Typography>
                        <EmailArraySection formikProps={formikProps} />

                        <Divider sx={{ my: 4 }} />
                        <Typography variant="h6" gutterBottom>Persona de Contacto (Opcional)</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}><TextField fullWidth name="contact_person.name" label="Nombre del Contacto" value={formikProps.values.contact_person.name} onChange={formikProps.handleChange} onBlur={formikProps.handleBlur} /></Grid>
                            <Grid item xs={12} sm={6}><TextField fullWidth name="contact_person.position" label="Cargo del Contacto" value={formikProps.values.contact_person.position} onChange={formikProps.handleChange} onBlur={formikProps.handleBlur} /></Grid>
                            <Grid item xs={12} sm={6}><TextField fullWidth name="contact_person.email" label="Email del Contacto" type="email" value={formikProps.values.contact_person.email} onChange={formikProps.handleChange} onBlur={formikProps.handleBlur} error={formikProps.touched.contact_person?.email && Boolean(formikProps.errors.contact_person?.email)} helperText={formikProps.touched.contact_person?.email && formikProps.errors.contact_person?.email} /></Grid>
                            <Grid item xs={12} sm={6}><TextField fullWidth name="contact_person.phone" label="Teléfono del Contacto" value={formikProps.values.contact_person.phone} onChange={formikProps.handleChange} onBlur={formikProps.handleBlur} /></Grid>
                        </Grid>

                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button type="submit" variant="contained" size="large" disabled={isSubmitting || !formikProps.dirty}>
                                {isSubmitting ? 'Guardando...' : (initialData.tax_id ? 'Actualizar Proveedor' : 'Guardar Proveedor')}
                            </Button>
                        </Box>
                    </Paper>
                </Form>
            )}
        </Formik>
    );
};

export default SupplierForm;