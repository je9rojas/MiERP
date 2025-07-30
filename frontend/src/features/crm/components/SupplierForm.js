// /frontend/src/features/crm/components/SupplierForm.js

import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { TextField } from 'formik-material-ui';
import {
  Button,
  Grid,
  Box,
  CircularProgress,
  Typography,
  Paper,
  Divider,
} from '@mui/material';

// 1. Esquema de Validación con Yup
const validationSchema = Yup.object().shape({
  ruc: Yup.string()
    .required('El RUC es requerido.')
    .matches(/^[0-9]+$/, 'El RUC solo debe contener números.')
    .min(11, 'El RUC debe tener al menos 11 dígitos.')
    .max(13, 'El RUC no puede tener más de 13 dígitos.'),
  business_name: Yup.string()
    .required('La Razón Social es requerida.')
    .min(3, 'Debe tener al menos 3 caracteres.'),
  trade_name: Yup.string(),
  address: Yup.string(),
  phone: Yup.string(),
  email: Yup.string()
    .email('Debe ser un correo electrónico válido.'),
  contact_person: Yup.object().shape({
    name: Yup.string(),
    email: Yup.string().email('Debe ser un correo electrónico de contacto válido.'),
    phone: Yup.string(),
    position: Yup.string(),
  }),
});


const SupplierForm = ({ initialValues, onSubmit, isSubmitting }) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize // Permite que el formulario se resetee con nuevos initialValues
    >
      {() => (
        <Form>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Datos Principales del Proveedor
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Field
                  component={TextField}
                  name="ruc"
                  label="RUC / ID Fiscal"
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field
                  component={TextField}
                  name="business_name"
                  label="Razón Social"
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field
                  component={TextField}
                  name="trade_name"
                  label="Nombre Comercial"
                  fullWidth
                />
              </Grid>
               <Grid item xs={12} sm={6}>
                <Field
                  component={TextField}
                  name="phone"
                  label="Teléfono Principal"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field
                  component={TextField}
                  name="email"
                  label="Correo Electrónico Principal"
                  type="email"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <Field
                  component={TextField}
                  name="address"
                  label="Dirección Fiscal"
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h6" gutterBottom>
              Persona de Contacto
            </Typography>
            <Grid container spacing={3}>
               <Grid item xs={12} sm={6}>
                <Field
                  component={TextField}
                  name="contact_person.name"
                  label="Nombre del Contacto"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field
                  component={TextField}
                  name="contact_person.position"
                  label="Cargo del Contacto"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field
                  component={TextField}
                  name="contact_person.email"
                  label="Email del Contacto"
                  type="email"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field
                  component={TextField}
                  name="contact_person.phone"
                  label="Teléfono del Contacto"
                  fullWidth
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Proveedor'}
              </Button>
            </Box>
          </Paper>
        </Form>
      )}
    </Formik>
  );
};

export default SupplierForm;