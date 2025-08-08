// frontend/src/features/reports/pages/ProductCatalogPage.js

/**
 * @file Página interactiva para la generación de catálogos de productos.
 * @description Permite a los usuarios generar catálogos en PDF, ya sea el catálogo
 * completo o uno filtrado por una o más marcas y/o tipos de producto.
 */

// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
import React, { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
    Container, Paper, Typography, Box, Button, Grid, TextField,
    MenuItem, CircularProgress, FormControl, FormLabel, RadioGroup,
    FormControlLabel, Radio,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

import { generateCatalogAPI } from '../api/reportsAPI';
import { FILTER_TYPES } from '../../../constants/productConstants';
import { formatApiError } from '../../../utils/errorUtils';
import { useAuth } from '../../../app/contexts/AuthContext';
import { hasPermission, CAN_VIEW_COMMERCIAL_DATA } from '../../../constants/rolesAndPermissions';
import PageHeader from '../../../components/common/PageHeader';

// SECCIÓN 2: DATOS CONSTANTES (MOCKS)
// A futuro, esta lista de marcas debería venir de una API.
const AVAILABLE_BRANDS = [
    { value: 'WIX', label: 'WIX Filters' },
    // { value: 'Bosch', label: 'Bosch Automotive' }, 
    // { value: 'Filtron', label: 'Filtron' },
];

// SECCIÓN 3: COMPONENTE PRINCIPAL DE LA PÁGINA
const ProductCatalogPage = () => {
    // Sub-sección 3.1: Hooks y Estado
    const { enqueueSnackbar } = useSnackbar();
    const { user } = useAuth();
    
    const [reportType, setReportType] = useState('all'); // 'all' o 'by_brand'
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [viewType, setViewType] = useState('client');

    const canViewSellerCatalog = hasPermission(CAN_VIEW_COMMERCIAL_DATA, user?.role);

    // Sub-sección 3.2: Lógica de Mutación (react-query)
    const { mutate: generateCatalog, isPending: isGenerating } = useMutation({
        mutationFn: generateCatalogAPI,
        onSuccess: (pdfBlob, variables) => {
            const dateStamp = new Date().toISOString().slice(0, 10);
            const viewLabel = variables.view_type === 'seller' ? 'vendedor' : 'cliente';
            let typeLabel = 'general';

            if (variables.brands && variables.brands.length > 0) {
                typeLabel = `marca(${variables.brands.join(',')})`;
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
            console.error("Error al generar el catálogo:", error.response || error);
            enqueueSnackbar(formatApiError(error), { variant: 'error', persist: true });
        },
    });

    // Sub-sección 3.3: Manejadores de Eventos
    const handleGenerateClick = useCallback(() => {
        if (isGenerating) return;

        const payload = {
            view_type: viewType,
            brands: reportType === 'by_brand' ? selectedBrands : [],
            product_types: reportType === 'by_brand' ? selectedTypes : [],
        };
        
        generateCatalog(payload);
    }, [isGenerating, reportType, viewType, selectedBrands, selectedTypes, generateCatalog]);

    const isGenerateButtonDisabled = isGenerating || (reportType === 'by_brand' && selectedBrands.length === 0);

    // Sub-sección 3.4: Renderizado de la UI
    return (
        <Container maxWidth="md" sx={{ my: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, boxShadow: 3 }}>
                <PageHeader
                    title="Constructor de Catálogos"
                    subtitle="Genere catálogos en PDF para todo el inventario o para marcas específicas."
                    showAddButton={false} // Ocultamos el botón "+" que no tiene función aquí.
                />

                <Grid container spacing={4} sx={{ mt: 2 }}>
                    <Grid item xs={12}>
                        <FormControl component="fieldset">
                            <FormLabel component="legend">1. Seleccione el Alcance del Catálogo</FormLabel>
                            <RadioGroup row value={reportType} onChange={(e) => setReportType(e.target.value)}>
                                <FormControlLabel value="all" control={<Radio />} label="Catálogo General (Todos los productos)" />
                                <FormControlLabel value="by_brand" control={<Radio />} label="Filtrar por Marca" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>

                    {reportType === 'by_brand' && (
                        <Grid item xs={12} container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>Filtros Específicos</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    fullWidth
                                    name="brands_selector"
                                    label="Seleccione una o más Marcas"
                                    variant="outlined"
                                    value={selectedBrands}
                                    onChange={(e) => setSelectedBrands(e.target.value)}
                                    SelectProps={{ multiple: true, renderValue: (selected) => selected.join(', ') }}
                                >
                                    {AVAILABLE_BRANDS.map((option) => (<MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    fullWidth
                                    name="product_types_selector"
                                    label="Tipo de Filtro (Opcional)"
                                    variant="outlined"
                                    value={selectedTypes}
                                    onChange={(e) => setSelectedTypes(e.target.value)}
                                    SelectProps={{ multiple: true, renderValue: (selected) => selected.join(', ') }}
                                >
                                    {FILTER_TYPES.map((option) => (<MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>))}
                                </TextField>
                            </Grid>
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