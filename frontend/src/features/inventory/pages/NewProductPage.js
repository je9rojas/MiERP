// File: /frontend/src/features/inventory/pages/NewProductPage.js

/**
 * @file Página contenedora para el formulario de creación de un nuevo producto.
 * @description Este componente actúa como un "contenedor inteligente" que orquesta
 * el flujo de creación. Es responsable de:
 * 1. Renderizar el componente de formulario (`ProductForm`).
 * 2. Mapear los datos del formulario al formato de la API.
 * 3. Gestionar el estado de la comunicación con la API mediante React Query (`useMutation`).
 * 4. Manejar las respuestas de la API (éxito o error) para proporcionar feedback al usuario.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Typography, Paper, Container, Box } from '@mui/material';

import ProductForm from '../components/ProductForm';
import { createProductAPI } from '../api/productsAPI';
import { mapFormToCreateAPI } from '../mappers/inventoryMappers'; // Se importa el mapper desde la nueva ubicación.
import { formatApiError } from '../../../utils/errorUtils';
import PageHeader from '../../../components/common/PageHeader';

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DEL COMPONENTE DE LA PÁGINA
// ==============================================================================

const NewProductPage = () => {
    // --------------------------------------------------------------------------
    // Sub-sección 2.1: Hooks
    // --------------------------------------------------------------------------

    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // --------------------------------------------------------------------------
    // Sub-sección 2.2: Lógica de Mutación de Datos
    // --------------------------------------------------------------------------

    const { mutate: createProduct, isPending: isSubmitting } = useMutation({
        mutationFn: createProductAPI,
        onSuccess: (createdProduct) => {
            enqueueSnackbar(`Producto "${createdProduct.name}" creado exitosamente.`, { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            navigate('/inventario/productos');
        },
        onError: (error) => {
            const userFriendlyMessage = formatApiError(error);
            enqueueSnackbar(userFriendlyMessage, { variant: 'error', persist: true });
        },
    });

    // --------------------------------------------------------------------------
    // Sub-sección 2.3: Manejador de Eventos del Formulario
    // --------------------------------------------------------------------------
    
    /**
     * Función callback que se pasa al `ProductForm` y se ejecuta al enviarlo.
     * @param {object} formValues - Los datos crudos del formulario de Formik.
     */
    const handleFormSubmit = useCallback((formValues) => {
        // La página contenedora es responsable de transformar los datos.
        const apiPayload = mapFormToCreateAPI(formValues);
        createProduct(apiPayload);
    }, [createProduct]);

    // --------------------------------------------------------------------------
    // Sub-sección 2.4: Renderizado de la Interfaz de Usuario
    // --------------------------------------------------------------------------

    return (
        <Container maxWidth="lg" sx={{ my: 4 }}>
            <PageHeader
                title="Crear Nuevo Producto"
                subtitle="Rellene la información del catálogo para registrar un nuevo artículo en el sistema."
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
                <ProductForm
                    onSubmit={handleFormSubmit}
                    isSubmitting={isSubmitting}
                />
            </Paper>
        </Container>
    );
};

export default NewProductPage;