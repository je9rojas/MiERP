// /frontend/src/features/purchasing/components/SupplierAutocomplete.js
// CÓDIGO COMPLETO Y CORREGIDO - LISTO PARA COPIAR Y PEGAR

import React, { useState, useEffect } from 'react';
import { TextField, Autocomplete, CircularProgress } from '@mui/material';
// --- CAMBIO CLAVE: Importamos la función real de la API ---
import { searchSuppliersAPI } from '../../../api/supplierAPI';

export default function SupplierAutocomplete({ onSelect, error, helperText, value }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // No necesitamos 'inputValue' porque el componente lo maneja internamente.
  // La lógica de búsqueda se dispara con 'open' y 'loading'.

  useEffect(() => {
    let active = true;

    if (!open) {
      // No hacer nada si el menú no está abierto
      return undefined;
    }
    
    setLoading(true);
    (async () => {
      try {
        // --- CAMBIO CLAVE: Llamamos a la API real ---
        // Le pasamos un string vacío para que traiga algunos resultados iniciales si queremos,
        // o podemos basarlo en lo que el usuario escribe (lo maneja el `filterOptions`)
        const results = await searchSuppliersAPI(''); // Trae todos los proveedores al abrir
        if (active && results) {
          setOptions(results);
        }
      } catch (err) {
        console.error("Fallo al cargar proveedores:", err);
        setOptions([]); // En caso de error, limpiar opciones
      } finally {
        if(active) {
            setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [open]); // El efecto se dispara cuando el usuario abre el desplegable

  return (
    <Autocomplete
      id="supplier-autocomplete"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={value} // Controla el valor seleccionado desde el componente padre
      isOptionEqualToValue={(option, value) => option.code === value.code}
      getOptionLabel={(option) => `[${option.code}] ${option.name}`}
      options={options}
      loading={loading}
      onChange={(event, newValue) => {
        onSelect(newValue); // Llama a la función del padre con el objeto completo
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Buscar Proveedor"
          required
          variant="outlined"
          error={!!error} // El error se convierte a booleano
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