// /frontend/src/features/admin/components/UserFormModal.js
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, FormControl, InputLabel, FormHelperText } from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

// Esquema de validación con Yup
const validationSchema = Yup.object().shape({
  name: Yup.string().min(3, 'Muy corto').required('El nombre es requerido'),
  username: Yup.string().min(3, 'Muy corto').required('El nombre de usuario es requerido'),
  tax_id: Yup.string().max(20, 'Máximo 20 caracteres'),
  role: Yup.string().required('El rol es requerido'),
  branch: Yup.object().shape({
    name: Yup.string().required('El nombre de la sucursal es requerido')
  }),
  password: Yup.string()
    // La contraseña solo es requerida al crear un nuevo usuario
    .when('isEditing', {
      is: false,
      then: (schema) => schema.min(8, 'Debe tener al menos 8 caracteres').required('La contraseña es requerida'),
      otherwise: (schema) => schema.min(8, 'Debe tener al menos 8 caracteres'),
    }),
});

const UserFormModal = ({ open, onClose, onSubmit, initialValues, roles }) => {
  const isEditing = !!initialValues.username;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Formik
        initialValues={{ ...initialValues, isEditing }}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          // No enviamos el campo 'isEditing' a la API
          const { isEditing, ...submissionData } = values;
          onSubmit(submissionData);
          setSubmitting(false);
        }}
        enableReinitialize // Permite que el formulario se reinicie con nuevos initialValues
      >
        {({ errors, touched, isSubmitting }) => (
          <Form>
            <DialogTitle>{isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</DialogTitle>
            <DialogContent dividers>
              <Field
                as={TextField}
                name="name"
                label="Nombre Completo"
                fullWidth
                margin="normal"
                error={touched.name && !!errors.name}
                helperText={touched.name && errors.name}
              />
              <Field
                as={TextField}
                name="username"
                label="Nombre de Usuario (Login)"
                fullWidth
                margin="normal"
                disabled={isEditing} // No se puede cambiar el username
                error={touched.username && !!errors.username}
                helperText={touched.username && errors.username}
              />
              <Field
                as={TextField}
                name="tax_id"
                label="RUC / DNI"
                fullWidth
                margin="normal"
                error={touched.tax_id && !!errors.tax_id}
                helperText={touched.tax_id && errors.tax_id}
              />
              <FormControl fullWidth margin="normal" error={touched.role && !!errors.role}>
                <InputLabel>Rol</InputLabel>
                <Field as={Select} name="role" label="Rol">
                  {roles.map((role) => (
                    <MenuItem key={role.name} value={role.name}>
                      {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                    </MenuItem>
                  ))}
                </Field>
                {touched.role && errors.role && <FormHelperText>{errors.role}</FormHelperText>}
              </FormControl>
               <Field
                as={TextField}
                name="branch.name"
                label="Sucursal"
                fullWidth
                margin="normal"
                error={touched.branch?.name && !!errors.branch?.name}
                helperText={touched.branch?.name && errors.branch?.name}
              />
              <Field
                as={TextField}
                name="password"
                type="password"
                label="Contraseña"
                placeholder={isEditing ? 'Dejar en blanco para no cambiar' : ''}
                fullWidth
                margin="normal"
                error={touched.password && !!errors.password}
                helperText={touched.password && errors.password}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default UserFormModal;