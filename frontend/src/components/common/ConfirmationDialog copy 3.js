// /frontend/src/components/common/ConfirmationDialog.js

/**
 * @file Componente de diálogo de confirmación genérico y reutilizable.
 *
 * Este componente encapsula la lógica y la presentación de un diálogo modal
 * estándar de MUI para solicitar al usuario la confirmación de una acción.
 * Es altamente configurable a través de props.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress
} from '@mui/material';

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DEL COMPONENTE
// ==============================================================================

/**
 * Muestra un diálogo modal para confirmar una acción.
 * Utiliza parámetros por defecto de JavaScript para `isLoading` como buena práctica moderna.
 */
const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  content,
  isLoading = false // <- CORRECCIÓN: Valor por defecto aplicado aquí
}) => {
  // Previene el cierre del diálogo al hacer clic fuera si está en estado de carga.
  const handleClose = (event, reason) => {
    if (reason === 'backdropClick' && isLoading) {
      return;
    }
    onClose();
  };
  
  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
      disableEscapeKeyDown={isLoading}
    >
      <DialogTitle id="confirmation-dialog-title">
        {title}
      </DialogTitle>
      <DialogContent>
        {typeof content === 'string' ? (
          <DialogContentText id="confirmation-dialog-description">
            {content}
          </DialogContentText>
        ) : (
          content
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          color="primary"
          variant="contained"
          autoFocus
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isLoading ? 'Confirmando...' : 'Confirmar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ==============================================================================
// SECCIÓN 3: DEFINICIÓN DE PROPTYPES
// ==============================================================================

ConfirmationDialog.propTypes = {
  /** Controla si el diálogo está visible. */
  isOpen: PropTypes.bool.isRequired,
  
  /** Función para cerrar el diálogo. */
  onClose: PropTypes.func.isRequired,
  
  /** Función que se ejecuta al confirmar. */
  onConfirm: PropTypes.func.isRequired,
  
  /** El título del diálogo. */
  title: PropTypes.string.isRequired,
  
  /** El contenido principal. Puede ser un string o un nodo de React. */
  content: PropTypes.node.isRequired,
  
  /** Si es `true`, muestra un indicador de carga y deshabilita los botones. */
  isLoading: PropTypes.bool,
};

// El bloque de defaultProps ya no es necesario.

export default ConfirmationDialog;