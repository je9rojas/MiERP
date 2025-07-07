// /frontend/src/features/purchasing/components/ProductAutocomplete.js

import React, { useState, useEffect } from 'react';
import { TextField, Autocomplete, CircularProgress, Box, Typography } from '@mui/material';
// import { searchProductsAPI } from '../../../api/productsAPI'; // A crear

// Simulación de la llamada a la API por ahora
const searchProductsAPI = async (query) => {
  console.log(`Buscando productos con: "${query}"`);
  const mockProducts = [
    { id: '1', main_code: 'FA-101', name: 'Filtro de Aire Panel Toyota Hilux 2.5', stock_quantity: 50 },
    { id: '2', main_code: 'FO-505', name: 'Filtro de Aceite Roscado Kia Rio 1.4', stock_quantity: 30 },
  ];
  return new Promise(resolve => setTimeout(() => resolve(mockProducts.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.main_code.toLowerCase().includes(query.toLowerCase()))), 500));
};

export default function ProductAutocomplete({ onSelect, error, helperText }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    let active = true;

    if (inputValue.length < 2) { // No buscar hasta que haya al menos 2 caracteres
      setOptions([]);
      return undefined;
    }

    setLoading(true);
    (async () => {
      const results = await searchProductsAPI(inputValue);
      if (active && results) {
        setOptions(results);
      }
      setLoading(false);
    })();

    return () => { active = false; };
  }, [inputValue]);

  return (
    <Autocomplete
      id="product-autocomplete"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      isOptionEqualToValue={(option, value) => option.main_code === value.main_code}
      getOptionLabel={(option) => option.main_code || ''}
      options={options}
      loading={loading}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onChange={(event, newValue) => {
        onSelect(newValue);
      }}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.id}>
          <Box>
            <Typography variant="body1" component="span" fontWeight="bold">
              {option.main_code}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {option.name}
            </Typography>
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          label="Código"
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}