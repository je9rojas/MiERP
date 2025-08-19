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

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  content,
  isLoading = false
}) => {
  /**
   * Maneja el evento de cierre del diálogo.
   * Previene el cierre al hacer clic en el fondo si una operación está en curso.
   */
  const handleClose = (event, reason) => {
    if (isLoading && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
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
      <DialogActions sx={{ padding: '8px 24px 16px' }}>
        <Button onClick={onClose} disabled={isLoading} color="inherit">
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
  
  /** Función que se invoca para cerrar el diálogo. */
  onClose: PropTypes.func.isRequired,
  
  /** Función que se invoca al hacer clic en el botón de confirmación. */
  onConfirm: PropTypes.func.isRequired,
  
  /** El título que se muestra en la cabecera del diálogo. */
  title: PropTypes.string.isRequired,
  
  /** El contenido principal del diálogo. Puede ser un string o un nodo de React. */
  content: PropTypes.node.isRequired,
  
  /** Si es `true`, muestra un indicador de carga y deshabilita los botones. */
  isLoading: PropTypes.bool,
};

export default ConfirmationDialog;