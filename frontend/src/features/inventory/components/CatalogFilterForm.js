// /frontend/src/features/inventory/components/CatalogFilterForm.js
import React, { useState } from 'react';
import { Box, TextField, Button, FormGroup, FormControlLabel, Checkbox, CircularProgress, Typography } from '@mui/material';

const productTypes = [
  { key: 'aire', label: 'Filtro de Aire' },
  { key: 'combustible', label: 'Filtro de Combustible' },
  { key: 'aceite', label: 'Filtro de Aceite' },
  { key: 'habitaculo', label: 'Filtro de Habitáculo' },
];

const CatalogFilterForm = ({ onSubmit, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);

  const handleTypeChange = (event) => {
    const { name, checked } = event.target;
    if (checked) {
      setSelectedTypes(prev => [...prev, name]);
    } else {
      setSelectedTypes(prev => prev.filter(type => type !== name));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const filters = {
      search_term: searchTerm || null,
      product_types: selectedTypes.length > 0 ? selectedTypes : null,
    };
    onSubmit(filters);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box display="flex" flexDirection="column" gap={3}>
        <TextField
          label="Buscar por código o nombre"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={isLoading}
        />
        
        <Box>
          <Typography variant="subtitle1" gutterBottom>Tipos de Filtro</Typography>
          <FormGroup row>
            {productTypes.map(type => (
              <FormControlLabel
                key={type.key}
                control={
                  <Checkbox 
                    checked={selectedTypes.includes(type.key)} 
                    onChange={handleTypeChange} 
                    name={type.key}
                  />
                }
                label={type.label}
                disabled={isLoading}
              />
            ))}
          </FormGroup>
        </Box>
        
        <Box sx={{ position: 'relative', alignSelf: 'flex-start' }}>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={isLoading}
            size="large"
          >
            Generar Catálogo PDF
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