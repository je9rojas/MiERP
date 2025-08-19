// frontend/src/features/reports/pages/ProductCatalogPage.js

/**
 * @file Página interactiva para la generación de catálogos de productos en PDF.
 *
 * @description Permite a los usuarios generar catálogos en tres modos distintos:
 * 1. General: Incluye todos los productos.
 * 2. Filtrado: Por marca y/o tipo de producto.
 * 3. Personalizado: Mediante una selección específica de productos.
 * La visibilidad de los precios en el catálogo se controla mediante permisos.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Container, Paper, Typography, Box, Button, Grid, TextField,
  MenuItem, CircularProgress, FormControl, FormLabel, RadioGroup,
  FormControlLabel, Radio, Autocomplete,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

// API, Hooks, Constantes y Utilitarios
import { generateCatalogAPI } from '../api/reportsAPI';
import { getProductsAPI } from '../../inventory/api/productsAPI';
import { FILTER_TYPES } from '../../../constants/productConstants';
import { formatApiError } from '../../../utils/errorUtils';
import useDebounce from '../../../hooks/useDebounce';
import { useAuth } from '../../../app/contexts/AuthContext';
import { hasPermission, PERMISSIONS } from '../../../utils/auth/roles';
import PageHeader from '../../../components/common/PageHeader';

// ==============================================================================
// SECCIÓN 2: DATOS CONSTANTES
// ==============================================================================

const AVAILABLE_BRANDS = [
  { value: 'WIX', label: 'WIX Filters' },
  // ... más marcas pueden ser añadidas aquí
];

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const ProductCatalogPage = () => {
  // --------------------------------------------------------------------------
  // Sub-sección 3.1: Hooks y Estado
  // --------------------------------------------------------------------------
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  const [reportType, setReportType] = useState('all'); // 'all', 'by_brand', 'custom'
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [viewType, setViewType] = useState('client'); // 'client', 'seller'
  const [productSearch, setProductSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);

  const debouncedProductSearch = useDebounce(productSearch, 500);

  // Lógica de permisos centralizada en una constante para claridad en el renderizado
  const canViewSellerCatalog = hasPermission(user?.role, PERMISSIONS.INVENTORY_VIEW_PRODUCTS);

  // --------------------------------------------------------------------------
  // Sub-sección 3.2: Lógica de Datos (React Query)
  // --------------------------------------------------------------------------
  const { data: productOptions, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['productSearch', debouncedProductSearch],
    queryFn: () => getProductsAPI({ search: debouncedProductSearch, page_size: 20 }),
    enabled: debouncedProductSearch.length > 2 && reportType === 'custom',
    select: (data) => data.items || [],
  });

  const { mutate: generateCatalog, isPending: isGenerating } = useMutation({
    mutationFn: generateCatalogAPI,
    onSuccess: (pdfBlob, variables) => {
      const dateStamp = new Date().toISOString().slice(0, 10);
      const viewLabel = variables.view_type === 'seller' ? 'vendedor' : 'cliente';
      let typeLabel = 'general';

      if (variables.product_skus?.length > 0) {
        typeLabel = 'personalizado';
      } else if (variables.brands?.length > 0) {
        typeLabel = `marca-${variables.brands.join('_')}`;
      }

      const fileName = `catalogo_${typeLabel}_${viewLabel}_${dateStamp}.pdf`;

      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      enqueueSnackbar('Catálogo generado y descarga iniciada.', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(formatApiError(error), { variant: 'error' });
    },
  });

  // --------------------------------------------------------------------------
  // Sub-sección 3.3: Manejadores de Eventos y Lógica Derivada
  // --------------------------------------------------------------------------
  const handleGenerateClick = useCallback(() => {
    if (isGenerating) return;

    let payload = { view_type: viewType };

    switch (reportType) {
      case 'custom':
        payload.product_skus = selectedProducts.map(p => p.sku);
        break;
      case 'by_brand':
        payload.brands = selectedBrands;
        payload.product_types = selectedTypes;
        break;
      case 'all':
      default:
        break;
    }

    generateCatalog(payload);
  }, [isGenerating, reportType, viewType, selectedProducts, selectedBrands, selectedTypes, generateCatalog]);

  const isGenerateButtonDisabled = isGenerating ||
    (reportType === 'by_brand' && selectedBrands.length === 0) ||
    (reportType === 'custom' && selectedProducts.length === 0);

  // --------------------------------------------------------------------------
  // Sub-sección 3.4: Renderizado de la UI
  // --------------------------------------------------------------------------
  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, boxShadow: 3 }}>
        <PageHeader
          title="Constructor de Catálogos"
          subtitle="Genere catálogos en PDF para todo el inventario, por marcas o con una selección personalizada."
        />

        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">1. Seleccione el Alcance del Catálogo</FormLabel>
              <RadioGroup row value={reportType} onChange={(e) => setReportType(e.target.value)}>
                <FormControlLabel value="all" control={<Radio />} label="General" />
                <FormControlLabel value="by_brand" control={<Radio />} label="Por Marca" />
                <FormControlLabel value="custom" control={<Radio />} label="Personalizado" />
              </RadioGroup>
            </FormControl>
          </Grid>

          {reportType === 'by_brand' && (
            <Grid item xs={12} container spacing={2}>
              <Grid item xs={12}><Typography variant="h6" gutterBottom>Filtros Específicos</Typography></Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth label="Seleccione una o más Marcas" value={selectedBrands} onChange={(e) => setSelectedBrands(e.target.value)} SelectProps={{ multiple: true, renderValue: (selected) => selected.join(', ') }}>
                  {AVAILABLE_BRANDS.map((option) => (<MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth label="Tipo de Filtro (Opcional)" value={selectedTypes} onChange={(e) => setSelectedTypes(e.target.value)} SelectProps={{ multiple: true, renderValue: (selected) => selected.join(', ') }}>
                  {FILTER_TYPES.map((option) => (<MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>))}
                </TextField>
              </Grid>
            </Grid>
          )}

          {reportType === 'custom' && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Añada Productos Específicos</Typography>
              <Autocomplete multiple options={productOptions || []} getOptionLabel={(option) => `(${option.sku}) ${option.name}`} isOptionEqualToValue={(option, value) => option.sku === value.sku} filterOptions={(x) => x} value={selectedProducts} onChange={(event, newValue) => setSelectedProducts(newValue)} inputValue={productSearch} onInputChange={(event, newInputValue) => setProductSearch(newInputValue)} loading={isLoadingProducts}
                renderInput={(params) => (
                  <TextField {...params} label="Buscar y añadir Productos" placeholder="Escriba un SKU o nombre..."
                    InputProps={{ ...params.InputProps, endAdornment: (<>{isLoadingProducts ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</>), }} />
                )} />
            </Grid>
          )}

          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">2. Seleccione la Vista del Catálogo</FormLabel>
              <RadioGroup row value={viewType} onChange={(e) => setViewType(e.target.value)}>
                <FormControlLabel value="client" control={<Radio />} label="Para Clientes (Sin Precios)" />
                {canViewSellerCatalog && (<FormControlLabel value="seller" control={<Radio />} label="Para Vendedores (Con Precios)" />)}
              </RadioGroup>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mt: 5, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdfIcon />}
            onClick={handleGenerateClick}
            disabled={isGenerateButtonDisabled}
          >
            {isGenerating ? 'Generando PDF...' : 'Generar Catálogo'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProductCatalogPage;