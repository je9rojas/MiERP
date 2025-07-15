// /frontend/src/components/common/PageHeader.js
// Componente reutilizable para el encabezado de las páginas de lista.

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add'; // Usamos un icono genérico

/**
 * Muestra un encabezado de página estandarizado con un título y un botón de acción.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {string} props.title - El título que se mostrará en la página (ej. "Gestión de Productos").
 * @param {string} props.buttonText - El texto para el botón de acción (ej. "Añadir Producto").
 * @param {function} props.onButtonClick - La función que se ejecutará al hacer clic en el botón.
 */
const PageHeader = ({ title, buttonText, onButtonClick }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3, // Margen inferior para separarlo del contenido
        flexWrap: 'wrap', // Permite que se ajuste en pantallas pequeñas
        gap: 2, // Espacio entre el título y el botón si se envuelven
      }}
    >
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
        {title}
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onButtonClick}
        sx={{ fontWeight: 'bold' }}
      >
        {buttonText}
      </Button>
    </Box>
  );
};

export default PageHeader;