// File: /frontend/src/features/inventory/pages/EditProductPage.js

/**
 * @file Página contenedora para la edición de un producto existente.
 * @description Este componente orquesta el flujo de edición, conectando la obtención
 * de datos, el formulario, la lógica de mapeo y la API de actualización.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Paper, Container, CircularProgress, Alert } from '@mui/material';

import ProductForm from '../components/ProductForm';
import { getProductByIdAPI, updateProductAPI } from '../api/productsAPI';
import { mapFormToUpdateAPI } from '../mappers/inventoryMappers'; // Se importa desde la nueva ubicación.
import { formatApiError } from '../../../utils/errorUtils';
import PageHeader from '../../../components/common/PageHeader';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const EditProductPage = () => {
    // --------------------------------------------------------------------------
    // Sub-sección 2.1: Hooks y Gestión de Estado
    // --------------------------------------------------------------------------
    
    const { productId } = useParams(); // Se asume que la ruta ahora usa productId
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // --------------------------------------------------------------------------
    // Sub-sección 2.2: Obtención de Datos Iniciales
    // --------------------------------------------------------------------------
    
    const {
        data: productData,
        isLoading,
        isError,
        error: fetchError
    } = useQuery({
        queryKey: ['product', productId],
        queryFn: () => getProductByIdAPI(productId),
        enabled: !!productId,
    });

    // --------------------------------------------------------------------------
    // Sub-sección 2.3: Mutación para la Actualización
    // --------------------------------------------------------------------------
    
    const { mutate: updateProduct, isPending: isUpdating } = useMutation({
        mutationFn: (payload) => updateProductAPI(productId, payload),
        onSuccess: (updatedData) => {
            enqueueSnackbar(`Producto "${updatedData.name}" actualizado exitosamente.`, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product', productId] });
            navigate('/inventario/productos');
        },
        onError: (error) => {
            const errorMessage = formatApiError(error);
            enqueueSnackbar(errorMessage, { variant: 'error', persist: true });
        }
    });

    // --------------------------------------------------------------------------
    // Sub-sección 2.4: Manejador de Envío del Formulario
    // --------------------------------------------------------------------------
    
    const handleFormSubmit = useCallback((formValues) => {
        const apiPayload = mapFormToUpdateAPI(formValues);
        updateProduct(apiPayload);
    }, [updateProduct]);

    // --------------------------------------------------------------------------
    // Sub-sección 2.5: Lógica de Renderizado
    // --------------------------------------------------------------------------
    
    if (isLoading) {
        return (
            <Container maxWidth="md">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (isError) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">{formatApiError(fetchError)}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ my: 4 }}>
            <PageHeader
                title="Editar Producto"
                subtitle={`Modificando el producto con SKU: ${productData?.sku || ''}`}
                showAddButton={false}
            />
            <Paper 
                component="section"
                sx={{ 
                    p: { xs: 2, md: 3 }, 
                    mt: 3,
                    borderRadius: 2, 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)' 
                }}
            >
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