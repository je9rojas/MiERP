// frontend/src/features/inventory/pages/EditProductPage.js

/**
 * @file Página contenedora para la edición de un producto existente.
 * @description Este componente orquesta el flujo de edición, conectando la obtención
 * de datos, el formulario, la lógica de mapeo y la API de actualización.
 */

// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, Paper, Container, CircularProgress, Alert } from '@mui/material';

import ProductForm from '../components/ProductForm';
import { getProductBySkuAPI, updateProductAPI } from '../api/productsAPI';
import { mapFormToUpdateAPI } from '../productMappers'; // <--- USANDO EL MAPPER CENTRALIZADO
import { formatApiError } from '../../../utils/errorUtils';

// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
const EditProductPage = () => {
    // Sub-sección 2.1: Hooks y Gestión de Estado
    const { sku } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // Sub-sección 2.2: Obtención de Datos Iniciales
    const {
        data: productData,
        isLoading,
        isError,
        error: fetchError
    } = useQuery({
        queryKey: ['product', sku],
        queryFn: () => getProductBySkuAPI(sku),
        enabled: !!sku,
    });

    // Sub-sección 2.3: Mutación para la Actualización
    const { mutate: updateProduct, isPending: isUpdating } = useMutation({
        mutationFn: (payload) => updateProductAPI(sku, payload),
        onSuccess: (updatedData) => {
            enqueueSnackbar(`Producto "${updatedData.name}" actualizado exitosamente!`, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product', sku] });
            navigate('/inventario/productos');
        },
        onError: (err) => {
            console.error("Error al actualizar producto:", err.response || err);
            const errorMsg = formatApiError(err);
            enqueueSnackbar(errorMsg, { variant: 'error', persist: true });
        }
    });

    // Sub-sección 2.4: Manejador de Envío del Formulario
    /**
     * Orquesta el proceso de actualización al recibir los datos del formulario.
     * @param {object} formValues Los valores crudos del formulario de Formik.
     */
    const handleFormSubmit = useCallback((formValues) => {
        // Paso 1: Mapear los datos del formulario al formato esperado por la API de actualización.
        const apiPayload = mapFormToUpdateAPI(formValues);
        
        // Paso 2: Ejecutar la mutación con el payload preparado.
        updateProduct(apiPayload);

    }, [updateProduct]);

    // Sub-sección 2.5: Renderizado de Estados de Carga y Error
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

    // Sub-sección 2.6: Renderizado Principal del Formulario
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
                        isSubmitting={isUpdating} // El estado de carga viene directamente de useMutation.
                    />
                )}
            </Paper>
        </Container>
    );
};

export default EditProductPage;