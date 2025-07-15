// /frontend/src/components/common/ConfirmationDialog.js
// Diálogo de confirmación genérico y reutilizable.

import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';

/**
 * Muestra un diálogo modal para confirmar una acción potencialmente destructiva.
 * 
 * @param {object} props - Las propiedades del componente.
 * @param {boolean} props.open - Controla si el diálogo está visible.
 * @param {function} props.onClose - Función para cerrar el diálogo (ej. al hacer clic en "Cancelar").
 * @param {function} props.onConfirm - Función que se ejecuta si el usuario confirma la acción.
 * @param {string} props.title - El título del diálogo (ej. "Confirmar Desactivación").
 * @param {React.ReactNode} props.children - El contenido o mensaje principal del diálogo.
 */
const ConfirmationDialog = ({ open, onClose, onConfirm, title, children }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
    >
      <DialogTitle id="confirmation-dialog-title">
        {title}
      </DialogTitle>
      <DialogContent>
        {/* Usamos 'children' para poder pasar JSX complejo como mensaje */}
        <DialogContentText id="confirmation-dialog-description">
          {children}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" autoFocus>
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;