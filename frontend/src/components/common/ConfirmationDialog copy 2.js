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
  CircularProgress // Para indicar feedback visual en la confirmación
} from '@mui/material';

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DEL COMPONENTE
// ==============================================================================

/**
 * Muestra un diálogo modal para confirmar una acción.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {boolean} props.isOpen - Controla si el diálogo está visible.
 * @param {function} props.onClose - Función para cerrar el diálogo.
 * @param {function} props.onConfirm - Función que se ejecuta al confirmar.
 * @param {string} props.title - El título del diálogo.
 * @param {string | React.ReactNode} props.content - El contenido o mensaje principal.
 * @param {boolean} props.isLoading - (Opcional) Si es true, muestra un spinner en el botón de confirmar.
 */
const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, content, isLoading }) => {
  // Se previene el cierre del diálogo al hacer clic fuera de él si está en estado de carga.
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
      disableEscapeKeyDown={isLoading} // Previene el cierre con la tecla ESC durante la carga
    >
      <DialogTitle id="confirmation-dialog-title">
        {title}
      </DialogTitle>
      <DialogContent>
        {/* DialogContentText es ideal para strings, pero si el contenido es un componente, no lo necesita. */}
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
// SECCIÓN 3: DEFINICIÓN DE PROPTYPES Y DEFAULTPROPS
// ==============================================================================

ConfirmationDialog.propTypes = {
  /** Controla si el diálogo está visible. */
  isOpen: PropTypes.bool.isRequired,
  
  /** Función para cerrar el diálogo (ej. al hacer clic en "Cancelar" o fuera del diálogo). */
  onClose: PropTypes.func.isRequired,
  
  /** Función que se ejecuta si el usuario hace clic en "Confirmar". */
  onConfirm: PropTypes.func.isRequired,
  
  /** El título que se muestra en la cabecera del diálogo. */
  title: PropTypes.string.isRequired,
  
  /** El contenido principal del diálogo. Puede ser un string o un nodo de React. */
  content: PropTypes.node.isRequired,
  
  /** Si es `true`, deshabilita los botones y muestra un indicador de carga. */
  isLoading: PropTypes.bool,
};

ConfirmationDialog.defaultProps = {
  // Asegura que `isLoading` sea `false` si no se proporciona.
  isLoading: false,
};

export default ConfirmationDialog;