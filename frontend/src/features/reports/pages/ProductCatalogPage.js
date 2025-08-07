// frontend/src/features/reports/pages/ProductCatalogPage.js

/**
 * @file Página interactiva para la generación de catálogos de productos.
 * @description Permite a los usuarios construir y generar catálogos en PDF, ya sea
 * un catálogo completo (con filtros) o uno personalizado seleccionando productos específicos.
 */

// SECCIÓN 1: IMPORTACIONES DE MÓDulos
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
import { getProductsAPI } from '../../inventory/api/productsAPI'; // Reutilizamos la API de productos
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
    
    // Estado para el tipo de reporte
    const [reportType, setReportType] = useState('full'); // 'full' o 'custom'
    // Estado para los filtros del catálogo completo
    const [filters, setFilters] = useState({ search_term: '', product_types: [] });
    // Estado para el tipo de vista (cliente/vendedor)
    const [viewType, setViewType] = useState('client');
    // Estado para la búsqueda en el Autocomplete
    const [productSearch, setProductSearch] = useState('');
    // Estado para los productos seleccionados en el catálogo personalizado
    const [selectedProducts, setSelectedProducts] = useState([]);

    const debouncedProductSearch = useDebounce(productSearch, 500);
    const canViewSellerCatalog = hasPermission(CAN_VIEW_COMMERCIAL_DATA, user?.role);

    // Sub-sección 2.2: Lógica de Datos (react-query)
    const { data: productOptions, isLoading: isLoadingProducts } = useQuery({
        queryKey: ['productSearch', debouncedProductSearch],
        queryFn: () => getProductsAPI({ search: debouncedProductSearch, page_size: 20 }),
        enabled: debouncedProductSearch.length > 2 && reportType === 'custom',
        select: (data) => data.items || [], // Solo nos interesan los productos
    });

    const { mutate: generateCatalog, isPending: isGenerating } = useMutation({
        mutationFn: generateCatalogAPI,
        onSuccess: (pdfBlob) => {
            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `catalogo_${reportType}_${new Date().toISOString().slice(0,10)}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            enqueueSnackbar('Catálogo generado y descarga iniciada.', { variant: 'success' });
        },
        onError: (error) => {
            console.error("Error al generar el catálogo:", error);
            enqueueSnackbar(formatApiError(error), { variant: 'error' });
        },
    });

    // Sub-sección 2.3: Manejadores de Eventos
    const handleFilterChange = useCallback((event) => {
        const { name, value } = event.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleGenerateClick = useCallback(() => {
        if (isGenerating) return;

        let payload = { view_type: viewType };

        if (reportType === 'custom') {
            payload.product_skus = selectedProducts.map(p => p.sku);
        } else {
            payload.search_term = filters.search_term || null;
            payload.product_types = filters.product_types.length > 0 ? filters.product_types : null;
        }
        
        generateCatalog(payload);
    }, [isGenerating, reportType, viewType, selectedProducts, filters, generateCatalog]);

    const isGenerateButtonDisabled = isGenerating || (reportType === 'custom' && selectedProducts.length === 0);

    // Sub-sección 2.4: Renderizado de la UI
    return (
        <Container maxWidth="md" sx={{ my: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, boxShadow: 3 }}>
                <PageHeader
                    title="Constructor de Catálogos"
                    subtitle="Genere catálogos en PDF, ya sea el catálogo completo o uno personalizado a pedido."
                />

                <Grid container spacing={4} sx={{ mt: 2 }}>
                    <Grid item xs={12}>
                        <FormControl component="fieldset">
                            <FormLabel component="legend">1. Seleccione el Tipo de Reporte</FormLabel>
                            <RadioGroup row value={reportType} onChange={(e) => setReportType(e.target.value)}>
                                <FormControlLabel value="full" control={<Radio />} label="Catálogo Completo" />
                                <FormControlLabel value="custom" control={<Radio />} label="Catálogo Personalizado" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>

                    {reportType === 'full' ? (
                        <Grid item xs={12} container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>Filtros para el Catálogo Completo</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth name="search_term" label="Buscar por SKU o Nombre" variant="outlined" value={filters.search_term} onChange={handleFilterChange} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField select fullWidth name="product_types" label="Filtrar por Tipo de Filtro" variant="outlined" value={filters.product_types} onChange={handleFilterChange} SelectProps={{ multiple: true, renderValue: (selected) => selected.join(', ') }}>
                                    {FILTER_TYPES.map((option) => (<MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>))}
                                </TextField>
                            </Grid>
                        </Grid>
                    ) : (
                        <Grid item xs={12}>
                             <Typography variant="h6" gutterBottom>Constructor del Catálogo Personalizado</Typography>
                             <Autocomplete
                                multiple
                                id="product-selector"
                                options={productOptions || []}
                                getOptionLabel={(option) => `(${option.sku}) ${option.name}`}
                                isOptionEqualToValue={(option, value) => option.sku === value.sku}
                                filterOptions={(x) => x}
                                value={selectedProducts}
                                onChange={(event, newValue) => setSelectedProducts(newValue)}
                                inputValue={productSearch}
                                onInputChange={(event, newInputValue) => setProductSearch(newInputValue)}
                                loading={isLoadingProducts}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Añadir Productos al Catálogo"
                                        placeholder="Escriba un SKU o nombre para buscar..."
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {isLoadingProducts ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip variant="outlined" label={`(${option.sku}) ${option.name}`} {...getTagProps({ index })} />
                                    ))
                                }
                            />
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
                        {isGenerating ? 'Generando PDF...' : 'Generar Catálogo PDF'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default ProductCatalogPage;