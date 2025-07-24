// /frontend/src/features/inventory/components/CatalogFilterForm.js
// FORMULARIO DE FILTROS PARA LA GENERACIÓN DE CATÁLOGOS DE PRODUCTOS

import React, { useState } from 'react';
import {
  Box, TextField, Button, FormGroup, FormControlLabel, Checkbox,
  CircularProgress, Typography, FormControl, FormLabel
} from '@mui/material';

// --- SECCIÓN 1: IMPORTACIONES DE LA APLICACIÓN ---
// Se importan las constantes necesarias para poblar las opciones del formulario.
import { FILTER_TYPES } from '../../../constants/productConstants';

/**
 * Componente de formulario que permite al usuario definir filtros para la
 * generación de un catálogo de productos en PDF.
 * @param {object} props - Propiedades del componente.
 * @param {function} props.onSubmit - Función a ejecutar cuando se envía el formulario.
 * @param {boolean} props.isLoading - Estado de carga para deshabilitar el formulario.
 */
const CatalogFilterForm = ({ onSubmit, isLoading }) => {
  // --- SECCIÓN 2: ESTADO DEL COMPONENTE ---
  // Se utiliza el estado local para gestionar los valores de los filtros.
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);

  // --- SECCIÓN 3: MANEJADORES DE EVENTOS ---

  /**
   * Actualiza el estado de los tipos de producto seleccionados cuando
   * un checkbox cambia.
   * @param {React.ChangeEvent<HTMLInputElement>} event - El evento del cambio.
   */
  const handleTypeChange = (event) => {
    const { name, checked } = event.target;
    setSelectedTypes(prevSelectedTypes =>
      checked
        ? [...prevSelectedTypes, name]
        : prevSelectedTypes.filter(type => type !== name)
    );
  };

  /**
   * Recopila los datos del estado, los formatea y los envía a la función
   * `onSubmit` proporcionada por el componente padre.
   * @param {React.FormEvent<HTMLFormElement>} event - El evento de envío del formulario.
   */
  const handleSubmit = (event) => {
    event.preventDefault();
    const filters = {
      search_term: searchTerm.trim() || null,
      product_types: selectedTypes.length > 0 ? selectedTypes : null,
    };
    onSubmit(filters);
  };

  // --- SECCIÓN 4: RENDERIZADO DEL COMPONENTE ---
  return (
    <form onSubmit={handleSubmit}>
      <Box display="flex" flexDirection="column" gap={4}>
        <TextField
          label="Buscar por SKU o Nombre (Opcional)"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={isLoading}
          fullWidth
        />
        
        <FormControl component="fieldset" variant="standard">
          <FormLabel component="legend" sx={{ mb: 1 }}>Filtrar por Tipo de Producto</FormLabel>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
            Deje todos sin seleccionar para incluir todos los tipos de filtro.
          </Typography>
          <FormGroup row>
            {FILTER_TYPES.filter(type => type.value !== 'n_a').map(type => (
              <FormControlLabel
                key={type.value}
                control={
                  <Checkbox 
                    checked={selectedTypes.includes(type.value)} 
                    onChange={handleTypeChange} 
                    name={type.value}
                    disabled={isLoading}
                  />
                }
                label={type.label}
              />
            ))}
          </FormGroup>
        </FormControl>
        
        <Box sx={{ position: 'relative', alignSelf: 'flex-start' }}>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={isLoading}
            size="large"
          >
            {isLoading ? 'Generando...' : 'Generar Catálogo PDF'}
          </Button>
          {isLoading && (
            <CircularProgress
              size={24}
              sx={{
                color: 'primary.main',
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: '-12px',
                marginLeft: '-12px',
              }}
            />
          )}
        </Box>
      </Box>
    </form>
  );
};

export default CatalogFilterForm;