// frontend/src/features/inventory/pages/EditProductPage.js

/**
 * @file Página contenedora para la edición de un producto existente.
 *
 * @description Este componente orquesta el flujo de edición:
 * 1. Obtiene el SKU del producto desde los parámetros de la URL.
 * 2. Utiliza React Query (`useQuery`) para obtener los datos actuales del producto desde la API.
 * 3. Muestra estados de carga y error mientras se obtienen los datos.
 * 4. Pasa los datos iniciales al componente de formulario reutilizable `ProductForm`.
 * 5. Utiliza React Query (`useMutation`) para manejar el envío de la actualización.
 * 6. Transforma los datos del formulario al formato requerido por la API antes de enviarlos.
 * 7. Gestiona las notificaciones de éxito/error y la navegación post-actualización.
 */

// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Container, CircularProgress, Alert } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import ProductForm from '../components/ProductForm';
import { getProductBySkuAPI, updateProductAPI } from '../api/productsAPI';
import { formatApiError } from '../../../utils/errorUtils';

// SECCIÓN 2: LÓGICA DE TRANSFORMACIÓN DE DATOS
/**
 * Prepara los datos del formulario para ser enviados a la API de actualización.
 * Limpia, formatea y convierte tipos de datos para que coincidan con el modelo `ProductUpdate` del backend.
 * @param {object} formValues - Los valores brutos del formulario de Formik.
 * @returns {object} El payload limpio y formateado, listo para la petición PATCH.
 */
const prepareUpdatePayload = (formValues) => {
    // Función auxiliar para convertir a número o null
    const toNumberOrNull = (value) => {
        if (value === '' || value === null || value === undefined) {
            return null;
        }
        return Number(value);
    };

    // Objeto base con los campos que se pueden actualizar
    const payload = {
        name: formValues.name,
        brand: formValues.brand,
        description: formValues.description,
        category: formValues.category,
        product_type: formValues.product_type,
        shape: formValues.shape,
        price: toNumberOrNull(formValues.price),
        weight_g: toNumberOrNull(formValues.weight_g),
        points_on_sale: toNumberOrNull(formValues.points_on_sale),
        main_image_url: formValues.main_image_url,
        oem_codes: formValues.oem_codes.filter(oem => oem.brand || oem.code),
        cross_references: formValues.cross_references.filter(ref => ref.brand || ref.code),
        applications: formValues.applications
            .filter(app => app.brand || app.model)
            .map(app => {
                const yearFrom = parseInt(app.year_from, 10);
                const yearTo = parseInt(app.year_to, 10) || yearFrom;
                const years = [];
                if (!isNaN(yearFrom)) {
                    for (let y = yearFrom; y <= yearTo; y++) { years.push(y); }
                }
                return {
                    brand: app.brand,
                    model: app.model,
                    engine: app.engine,
                    years: years,
                };
            }),
    };
    
    // Manejo especial para dimensiones: solo se envían si hay algún valor
    const dimensionsWithValues = Object.entries(formValues.dimensions)
        .map(([key, value]) => [key, key === 'g' ? (value || null) : toNumberOrNull(value)])
        .filter(([, value]) => value !== null);

    if (dimensionsWithValues.length > 0) {
        payload.dimensions = Object.fromEntries(dimensionsWithValues);
    } else {
        payload.dimensions = null; // Enviar null si todas las dimensiones están vacías
    }

    return payload;
};

// SECCIÓN 3: COMPONENTE PRINCIPAL DE LA PÁGINA
const EditProductPage = () => {
    // Sub-sección 3.1: Hooks y Gestión de Estado
    const { sku } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // Sub-sección 3.2: Obtención de Datos Iniciales
    const {
        data: productData,
        isLoading,
        isError,
        error: fetchError
    } = useQuery({
        queryKey: ['product', sku],
        queryFn: () => getProductBySkuAPI(sku),
        enabled: !!sku, // Solo se ejecuta si el SKU existe en la URL
    });

    // Sub-sección 3.3: Mutación para la Actualización
    const { mutate: updateProduct, isPending: isUpdating } = useMutation({
        mutationFn: (payload) => updateProductAPI(sku, payload),
        onSuccess: () => {
            enqueueSnackbar('¡Producto actualizado exitosamente!', { variant: 'success' });
            // Invalidar queries para asegurar que los datos se recarguen en otras vistas
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Para la lista de productos
            queryClient.invalidateQueries({ queryKey: ['product', sku] }); // Para esta misma página si se recarga
            navigate('/inventario/productos');
        },
        onError: (err) => {
            console.error("Error al actualizar producto:", err.response || err);
            const errorMsg = formatApiError(err);
            enqueueSnackbar(errorMsg, { variant: 'error', persist: true });
        }
    });

    // Sub-sección 3.4: Manejador de Envío del Formulario
    const handleFormSubmit = useCallback((formValues) => {
        const apiPayload = prepareUpdatePayload(formValues);
        updateProduct(apiPayload);
    }, [updateProduct]);

    // Sub-sección 3.5: Renderizado de Estados de Carga y Error
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
                    {`Error al cargar el producto: ${fetchError.message}`}
                </Alert>
            </Container>
        );
    }

    // Sub-sección 3.6: Renderizado Principal del Formulario
    return (
        <Container maxWidth="lg">
            <Paper sx={{ p: { xs: 2, md: 4 }, my: 4, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Box sx={{ mb: 4, borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: '600' }}>
                        Editar Producto
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Modificando el producto con SKU: <strong>{sku}</strong>
                    </Typography>
                </Box>
                
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