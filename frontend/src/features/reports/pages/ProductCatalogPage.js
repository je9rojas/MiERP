// frontend/src/features/reports/pages/ProductCatalogPage.js

/**
 * @file Página interactiva para la generación de catálogos de productos.
 * @description Permite a los usuarios construir y generar catálogos en PDF en tres modos:
 * completo (con filtros), por tipo de producto, o personalizado seleccionando productos específicos.
 */

// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
import React, { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
    Container, Paper, Typography, Box, Button, Grid, TextField,
    MenuItem, CircularProgress, FormControl, FormLabel, RadioGroup,
    FormControlLabel, Radio, Autocomplete, Chip,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

import { generateCatalogAPI } from '../api/reportsAPI';
import { getProductsAPI } from '../../inventory/api/productsAPI';
import { FILTER_TYPES } from '../../../constants/productConstants';
import { formatApiError } from '../../../utils/errorUtils';
import useDebounce from '../../../hooks/useDebounce';
import { useAuth } from '../../../app/contexts/AuthContext';
import { hasPermission, CAN_VIEW_COMMERCIAL_DATA } from '../../../constants/rolesAndPermissions';
import PageHeader from '../../../components/common/PageHeader';

// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
const ProductCatalogPage = () => {
    // Sub-sección 2.1: Hooks y Estado
    const { enqueueSnackbar } = useSnackbar();
    const { user } = useAuth();
    
    const [reportType, setReportType] = useState('full'); // 'full', 'custom', 'by_type'
    const [filters, setFilters] = useState({ search_term: '' });
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [viewType, setViewType] = useState('client');
    const [productSearch, setProductSearch] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);

    const debouncedProductSearch = useDebounce(productSearch, 500);
    const canViewSellerCatalog = hasPermission(CAN_VIEW_COMMERCIAL_DATA, user?.role);

    // Sub-sección 2.2: Lógica de Datos (react-query)
    const { data: productOptions, isLoading: isLoadingProducts } = useQuery({
        queryKey: ['productSearch', debouncedProductSearch],
        queryFn: () => getProductsAPI({ search: debouncedProductSearch, page_size: 20 }),
        enabled: debouncedProductSearch.length > 2 && reportType === 'custom',
        select: (data) => data.items || [],
    });

    const { mutate: generateCatalog, isPending: isGenerating } = useMutation({
        mutationFn: generateCatalogAPI,
        onSuccess: (pdfBlob, variables) => {
            // Lógica de nombrado de archivos inteligente
            const dateStamp = new Date().toISOString().slice(0, 10);
            const viewLabel = variables.view_type === 'seller' ? 'vendedor' : 'cliente';
            let typeLabel = 'completo';
            if (variables.product_skus) {
                typeLabel = 'personalizado';
            } else if (variables.product_types) {
                typeLabel = `por-tipo(${variables.product_types.join(',')})`;
            }

            const fileName = `catalogo_${typeLabel}_${viewLabel}_${dateStamp}.pdf`;

            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            enqueueSnackbar('Catálogo generado y descarga iniciada.', { variant: 'success' });
        },
        onError: (error) => {
            console.error("Error al generar el catálogo:", error);
            enqueueSnackbar(formatApiError(error), { variant: 'error' });
        },
    });

    // Sub-sección 2.3: Manejadores de Eventos
    const handleGenerateClick = useCallback(() => {
        if (isGenerating) return;

        let payload = { view_type: viewType };

        switch (reportType) {
            case 'custom':
                payload.product_skus = selectedProducts.map(p => p.sku);
                break;
            case 'by_type':
                payload.product_types = selectedTypes;
                payload.search_term = filters.search_term || null;
                break;
            case 'full':
            default:
                payload.search_term = filters.search_term || null;
                break;
        }
        
        generateCatalog(payload);
    }, [isGenerating, reportType, viewType, selectedProducts, selectedTypes, filters, generateCatalog]);

    const isGenerateButtonDisabled = isGenerating ||
        (reportType === 'custom' && selectedProducts.length === 0) ||
        (reportType === 'by_type' && selectedTypes.length === 0);

    // Sub-sección 2.4: Renderizado de la UI
    return (
        <Container maxWidth="md" sx={{ my: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, boxShadow: 3 }}>
                <PageHeader
                    title="Constructor de Catálogos"
                    subtitle="Genere catálogos en PDF, ya sea el catálogo completo, por tipo o uno personalizado."
                />

                <Grid container spacing={4} sx={{ mt: 2 }}>
                    <Grid item xs={12}>
                        <FormControl component="fieldset">
                            <FormLabel component="legend">1. Seleccione el Tipo de Catálogo</FormLabel>
                            <RadioGroup row value={reportType} onChange={(e) => setReportType(e.target.value)}>
                                <FormControlLabel value="full" control={<Radio />} label="Completo" />
                                <FormControlLabel value="by_type" control={<Radio />} label="Por Tipo" />
                                <FormControlLabel value="custom" control={<Radio />} label="Personalizado (por SKU)" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>

                    {reportType === 'full' && (
                         <Grid item xs={12}>
                             <Typography variant="h6" gutterBottom>Filtro General (Opcional)</Typography>
                             <TextField fullWidth name="search_term" label="Buscar por SKU o Nombre" variant="outlined" value={filters.search_term} onChange={(e) => setFilters({ search_term: e.target.value })} />
                         </Grid>
                    )}

                    {reportType === 'by_type' && (
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>Seleccione Tipos de Producto</Typography>
                             <TextField select fullWidth name="product_types_selector" label="Tipos de Filtro" variant="outlined" value={selectedTypes} onChange={(e) => setSelectedTypes(e.target.value)} SelectProps={{ multiple: true, renderValue: (selected) => selected.join(', ') }}>
                                {FILTER_TYPES.map((option) => (<MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>))}
                            </TextField>
                        </Grid>
                    )}

                    {reportType === 'custom' && (
                        <Grid item xs={12}>
                             <Typography variant="h6" gutterBottom>Añada Productos al Catálogo</Typography>
                             <Autocomplete multiple id="product-selector" options={productOptions || []} getOptionLabel={(option) => `(${option.sku}) ${option.name}`} isOptionEqualToValue={(option, value) => option.sku === value.sku} filterOptions={(x) => x} value={selectedProducts} onChange={(event, newValue) => setSelectedProducts(newValue)} inputValue={productSearch} onInputChange={(event, newInputValue) => setProductSearch(newInputValue)} loading={isLoadingProducts}
                                renderInput={(params) => (
                                    <TextField {...params} label="Buscar y añadir Productos" placeholder="Escriba un SKU o nombre..."
                                        InputProps={{...params.InputProps, endAdornment: (<>{isLoadingProducts ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</>),}}/>
                                )}/>
                        </Grid>
                    )}
                    
                    <Grid item xs={12}>
                         <FormControl component="fieldset">
                            <FormLabel component="legend">2. Seleccione la Vista</FormLabel>
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
                        {isGenerating ? 'Generando PDF...' : 'Generar Catálogo PDF'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default ProductCatalogPage;