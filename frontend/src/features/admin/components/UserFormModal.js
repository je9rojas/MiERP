// /frontend/src/features/admin/components/UserFormModal.js

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Typography,
  Box
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Esquema de validación para usuarios internos (empleados)
const validationSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, 'Muy corto')
    .required('El nombre del empleado es requerido'),
  username: Yup.string()
    .min(3, 'Muy corto')
    .required('El nombre de usuario es requerido'),
  role: Yup.string()
    .required('El rol es requerido'),
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
          // Tampoco enviamos la contraseña si está vacía durante la edición
          if (isEditing && !submissionData.password) {
            delete submissionData.password;
          }
          onSubmit(submissionData);
          setSubmitting(false);
        }}
        enableReinitialize // Permite que el formulario se actualice si `initialValues` cambia
      >
        {({ errors, touched, isSubmitting }) => (
          <Form>
            <DialogTitle>{isEditing ? 'Editar Empleado' : 'Crear Nuevo Empleado'}</DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, backgroundColor: 'grey.100', borderRadius: 1, mb: 2 }}>
                <InfoOutlinedIcon color="action" sx={{ mr: 1.5 }} />
                <Typography variant="caption" color="text.secondary">
                  Esta sección es para crear las cuentas de los <strong>empleados</strong> que accederán al sistema. La gestión de clientes se realiza en el módulo de <strong>Ventas y CRM</strong>.
                </Typography>
              </Box>

              <Field
                as={TextField}
                name="name"
                label="Nombre Completo del Empleado"
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
                disabled={isEditing}
                error={touched.username && !!errors.username}
                helperText={touched.username && errors.username}
              />

              <FormControl fullWidth margin="normal" error={touched.role && !!errors.role}>
                <InputLabel>Rol del Empleado</InputLabel>
                <Field as={Select} name="role" label="Rol del Empleado">
                  {/* Filtramos para no mostrar roles que no son de empleados */}
                  {roles.filter(role => role.name !== 'cliente').map((role) => (
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
                label="Sucursal Asignada"
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

            <DialogActions sx={{ p: '16px 24px' }}>
              <Button onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
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