// /frontend/src/components/common/FilterBar.js
// Barra de filtros genérica y reutilizable para las páginas de lista.

import React from 'react';
import { Grid, TextField, InputAdornment, MenuItem } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

/**
 * Muestra una barra de filtros configurable.
 * 
 * @param {object} props - Las propiedades del componente.
 * @param {object} props.filters - El objeto de estado que contiene los valores actuales de los filtros.
 * @param {function} props.onFilterChange - La función handler para actualizar el estado de los filtros.
 * @param {Array<object>} props.filterDefinitions - Un array que define qué filtros mostrar.
 */
const FilterBar = ({ filters, onFilterChange, filterDefinitions }) => {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {filterDefinitions.map((filter) => {
        // Determinamos si el campo debe estar deshabilitado
        const isDisabled = filter.disabled ? filter.disabled(filters) : false;
        
        // Renderizamos un TextField de búsqueda o un Select
        if (filter.type === 'search') {
          return (
            <Grid item xs={12} sm={6} md={filter.gridSize || 4} key={filter.name}>
              <TextField
                fullWidth
                variant="outlined"
                label={filter.label}
                name={filter.name}
                value={filters[filter.name] || ''}
                onChange={onFilterChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          );
        }

        if (filter.type === 'select') {
          return (
            <Grid item xs={12} sm={6} md={filter.gridSize || 3} key={filter.name}>
              <TextField
                select
                fullWidth
                label={filter.label}
                name={filter.name}
                value={filters[filter.name] || ''}
                onChange={onFilterChange}
                disabled={isDisabled}
              >
                <MenuItem value="">
                  <em>Todos</em>
                </MenuItem>
                {filter.options.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          );
        }
        
        return null; // En caso de un tipo de filtro no reconocido
      })}
    </Grid>
  );
};

export default FilterBar;