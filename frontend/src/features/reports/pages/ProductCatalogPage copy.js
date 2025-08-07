// /frontend/src/features/reports/pages/ProductCatalogPage.js

/**
 * @file Página para la generación del catálogo de productos.
 *
 * Este componente proporciona una interfaz para que los usuarios apliquen filtros
 * y seleccionen el tipo de catálogo (cliente o vendedor) a generar. Gestiona
 * el estado de los filtros, la comunicación con la API y la descarga del
 * archivo PDF resultante. La opción de generar un catálogo para vendedores
 * está protegida por roles.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState } from 'react';
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

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const ProductCatalogPage = () => {
    // --- 2.1: Hooks y Gestión de Estado ---
    const { enqueueSnackbar } = useSnackbar();
    const { user } = useAuth(); // Obtenemos el usuario actual para verificar permisos

    const [filters, setFilters] = useState({
        search_term: '',
        product_types: [],
        view_type: 'client', // Valor por defecto: catálogo para clientes
    });

    // Verificamos si el usuario tiene permiso para ver datos comerciales (precios/costos)
    const canViewSellerCatalog = hasPermission(CAN_VIEW_COMMERCIAL_DATA, user?.role);

    // --- 2.2: Lógica de Mutación para Generar el Catálogo ---
    const { mutate: generateCatalog, isPending: isGenerating } = useMutation({
        mutationFn: generateCatalogAPI,
        onSuccess: (pdfBlob) => {
            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            const viewTypeLabel = filters.view_type === 'seller' ? 'vendedor' : 'cliente';
            link.setAttribute('download', `catalogo_${viewTypeLabel}_${new Date().toISOString().slice(0,10)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            enqueueSnackbar('Catálogo generado y descarga iniciada.', { variant: 'success' });
        },
        onError: (error) => {
            console.error("Error al generar el catálogo:", error);
            const userFriendlyError = formatApiError(error);
            enqueueSnackbar(userFriendlyError, { variant: 'error' });
        },
    });

    // --- 2.3: Manejadores de Eventos ---
    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerateClick = () => {
        if (isGenerating) return;
        
        const payload = {
            ...filters,
            search_term: filters.search_term || null,
            product_types: filters.product_types.length > 0 ? filters.product_types : null,
        };
        
        generateCatalog(payload);
    };
    
    // --- 2.4: Renderizado de la UI ---
    return (
        <Container maxWidth="md" sx={{ my: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, boxShadow: 3 }}>
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Generador de Catálogo de Productos
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Seleccione los filtros y el tipo de catálogo a generar en formato PDF.
                    </Typography>
                </Box>

                <Grid container spacing={3} sx={{ my: 2 }}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            name="search_term"
                            label="Buscar por SKU o Nombre"
                            variant="outlined"
                            value={filters.search_term}
                            onChange={handleFilterChange}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            select
                            fullWidth
                            name="product_types"
                            label="Filtrar por Tipo de Filtro"
                            variant="outlined"
                            value={filters.product_types}
                            onChange={handleFilterChange}
                            SelectProps={{ multiple: true, renderValue: (selected) => selected.join(', ') }}
                        >
                            {FILTER_TYPES.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                </Grid>

                <Box sx={{ my: 4, display: 'flex', justifyContent: 'center' }}>
                    <FormControl component="fieldset">
                        <FormLabel component="legend">Tipo de Catálogo</FormLabel>
                        <RadioGroup
                            row
                            aria-label="tipo de catalogo"
                            name="view_type"
                            value={filters.view_type}
                            onChange={handleFilterChange}
                        >
                            <FormControlLabel value="client" control={<Radio />} label="Para Clientes (Sin Precios)" />
                            {canViewSellerCatalog && (
                                <FormControlLabel value="seller" control={<Radio />} label="Para Vendedores (Con Precios)" />
                            )}
                        </RadioGroup>
                    </FormControl>
                </Box>

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdfIcon />}
                        onClick={handleGenerateClick}
                        disabled={isGenerating}
                    >
                        {isGenerating ? 'Generando Catálogo...' : 'Generar Catálogo PDF'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default ProductCatalogPage;