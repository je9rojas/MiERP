/**
 * @file Página contenedora para la edición de un producto existente.
 *
 * Este componente orquesta el flujo de edición:
 * 1. Obtiene el SKU del producto desde los parámetros de la URL.
 * 2. Utiliza React Query (`useQuery`) para obtener los datos actuales del producto desde la API.
 * 3. Muestra estados de carga y error mientras se obtienen los datos.
 * 4. Pasa los datos iniciales al componente de formulario reutilizable `ProductForm`.
 * 5. Utiliza React Query (`useMutation`) para manejar el envío de la actualización.
 * 6. Transforma los datos del formulario al formato requerido por la API antes de enviarlos.
 * 7. Gestiona las notificaciones de éxito/error y la navegación post-actualización.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Container, CircularProgress, Alert } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import ProductForm from '../components/ProductForm';
import { getProductBySkuAPI, updateProductAPI } from '../api/productsAPI';
import { formatApiError } from '../../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: LÓGICA DE TRANSFORMACIÓN DE DATOS
// ==============================================================================

/**
 * Prepara los datos del formulario para ser enviados a la API de actualización.
 * @param {object} formValues - Los valores brutos del formulario de Formik.
 * @returns {object} El payload limpio y formateado para la API.
 */
const transformDataForApi = (formValues) => {
    const cleanedDimensions = Object.fromEntries(
        Object.entries(formValues.dimensions).filter(([, value]) => value !== null && String(value).trim() !== '')
    );

    const payload = {
        ...formValues,
        cost: parseFloat(String(formValues.cost)),
        price: parseFloat(String(formValues.price)),
        stock_quantity: parseInt(String(formValues.stock_quantity || 0), 10),
        weight_g: String(formValues.weight_g).trim() === '' ? null : parseFloat(String(formValues.weight_g)),
        product_type: formValues.category === 'filter' ? formValues.product_type : 'n_a',
        shape: formValues.category === 'filter' ? (formValues.shape || 'n_a') : 'n_a',
        dimensions: Object.keys(cleanedDimensions).length > 0 ? cleanedDimensions : null,
        oem_codes: formValues.oem_codes.filter(oem => oem.brand.trim() || oem.code.trim()),
        cross_references: formValues.cross_references.filter(ref => ref.brand.trim() || ref.code.trim()),
        applications: formValues.applications
            .filter(app => app.brand.trim() || app.model.trim() || app.engine.trim())
            .map(app => {
                const startYear = parseInt(app.year_from, 10);
                const endYear = parseInt(app.year_to || app.year_from, 10);
                const years = [];
                if (!isNaN(startYear) && !isNaN(endYear) && startYear <= endYear) {
                    for (let year = startYear; year <= endYear; year++) { years.push(year); }
                }
                return { brand: app.brand.trim(), model: app.model?.trim() || null, engine: app.engine?.trim() || null, years, };
            }),
    };

    // Eliminamos campos que no deben enviarse en el payload de actualización,
    // ya que no forman parte del modelo `ProductUpdate` del backend o son inmutables.
    delete payload.sku;
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    return payload;
};

// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const EditProductPage = () => {
    // --- 3.1: Hooks y Gestión de Estado ---
    const { sku } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // --- 3.2: Obtención de Datos con React Query ---
    const { 
        data: productData, 
        isLoading, 
        isError,
        error: queryError 
    } = useQuery({
        queryKey: ['product', sku],
        queryFn: () => getProductBySkuAPI(sku),
        enabled: !!sku,
    });

    // --- 3.3: Mutación (Actualización) con React Query ---
    const { mutate: updateProduct, isPending: isUpdating } = useMutation({
        mutationFn: (payload) => updateProductAPI(sku, payload),
        onSuccess: () => {
            enqueueSnackbar('Producto actualizado exitosamente!', { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product', sku] });
            navigate('/inventario/productos');
        },
        onError: (err) => {
            console.error("Error al actualizar producto:", err);
            const errorMsg = formatApiError(err);
            enqueueSnackbar(errorMsg, { variant: 'error', persist: true });
        }
    });

    // --- 3.4: Manejador de Envío del Formulario ---
    const handleFormSubmit = useCallback((formValues) => {
        const apiPayload = transformDataForApi(formValues);
        updateProduct(apiPayload);
    }, [updateProduct]);

    // --- 3.5: Renderizado Condicional de Estados de Carga y Error ---
    if (isLoading) {
        return (
            <Container maxWidth="md">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Cargando datos del producto...</Typography>
                </Box>
            </Container>
        );
    }

    if (isError) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">
                    Error al cargar el producto: {queryError.message || 'No se pudo obtener la información del producto.'}
                </Alert>
            </Container>
        );
    }

    // --- 3.6: Renderizado Principal del Formulario ---
    return (
        <Container maxWidth="lg">
            <Paper sx={{ p: { xs: 2, md: 4 }, my: 4, borderRadius: 2, boxShadow: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Editar Producto
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
                    Modificando el producto con SKU: <strong>{sku}</strong>
                </Typography>
                
                {productData && (
                    <ProductForm 
                        onSubmit={handleFormSubmit} 
                        initialData={productData} 
                        isSubmitting={isUpdating} 
                    />
                )}
            </Paper>
        </Container>
    );
};

export default EditProductPage;