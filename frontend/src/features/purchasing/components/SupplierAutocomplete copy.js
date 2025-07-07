// /frontend/src/features/purchasing/components/SupplierAutocomplete.js

import React, { useState, useEffect } from 'react';
import { TextField, Autocomplete, CircularProgress } from '@mui/material';
// Necesitaremos una nueva función en la API para buscar proveedores
// import { searchSuppliersAPI } from '../../../api/supplierAPI'; // A crear

// Simulación de la llamada a la API por ahora
const searchSuppliersAPI = async (query) => {
  console.log(`Buscando proveedores con: "${query}"`);
  const mockSuppliers = [
    { id: '1', code: 'PROV-001', name: 'Proveedor Principal S.A.C', tax_id: '20123456789' },
    { id: '2', code: 'PROV-002', name: 'Importaciones Globales EIRL', tax_id: '20987654321' },
  ];
  return new Promise(resolve => setTimeout(() => resolve(mockSuppliers.filter(s => s.name.toLowerCase().includes(query.toLowerCase()))), 500));
};


export default function SupplierAutocomplete({ onSelect, error, helperText }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    let active = true;

    if (inputValue === '') {
      setOptions([]);
      return undefined;
    }
    
    setLoading(true);
    (async () => {
      const results = await searchSuppliersAPI(inputValue);
      if (active && results) {
        setOptions(results);
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [inputValue]);

  return (
    <Autocomplete
      id="supplier-autocomplete"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      isOptionEqualToValue={(option, value) => option.code === value.code}
      getOptionLabel={(option) => `[${option.code}] ${option.name}`}
      options={options}
      loading={loading}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onChange={(event, newValue) => {
        onSelect(newValue); // Llama a la función del padre con el objeto completo
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Buscar Proveedor"
          required
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