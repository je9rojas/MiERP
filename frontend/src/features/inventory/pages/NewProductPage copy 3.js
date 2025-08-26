// /frontend/src/features/inventory/pages/NewProductPage.js

/**
 * @file Página contenedora para el formulario de creación de un nuevo producto.
 * @description Este componente actúa como un "contenedor inteligente" que orquesta
 * el flujo de creación. Es responsable de:
 * 1. Renderizar el componente de formulario (`ProductForm`).
 * 2. Gestionar el estado de la comunicación con la API mediante React Query (`useMutation`).
 * 3. Manejar las respuestas de la API (éxito o error) para proporcionar feedback al usuario.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
// ==============================================================================

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Typography, Paper, Container, Box } from '@mui/material';

import ProductForm from '../components/ProductForm';
import { createProductAPI } from '../api/productsAPI';
import { formatApiError } from '../../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DEL COMPONENTE DE LA PÁGINA
// ==============================================================================

const NewProductPage = () => {
    // --------------------------------------------------------------------------
    // Sub-sección 2.1: Hooks de React y Librerías Externas
    // --------------------------------------------------------------------------

    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // --------------------------------------------------------------------------
    // Sub-sección 2.2: Lógica de Comunicación con la API (Mutación)
    // --------------------------------------------------------------------------

    const { mutate: createProduct, isPending: isSubmitting } = useMutation({
        // La función que ejecuta la llamada a la API.
        mutationFn: createProductAPI,
        
        // Se ejecuta si la mutación tiene éxito.
        onSuccess: (createdProductData) => {
            enqueueSnackbar(`Producto "${createdProductData.name}" creado exitosamente!`, {
                variant: 'success',
            });
            // Invalida la cache de la lista de productos para que se vuelva a cargar con el nuevo dato.
            queryClient.invalidateQueries({ queryKey: ['products'] });
            navigate('/inventario/productos');
        },
        
        // Se ejecuta si la mutación falla.
        onError: (error) => {
            const userFriendlyErrorMessage = formatApiError(error);
            enqueueSnackbar(userFriendlyErrorMessage, {
                variant: 'error',
                persist: true, // El error persiste hasta que el usuario lo descarte.
            });
        },
    });

    // --------------------------------------------------------------------------
    // Sub-sección 2.3: Manejador de Eventos del Formulario
    // --------------------------------------------------------------------------
    
    /**
     * Función callback que se pasa al `ProductForm` y se ejecuta al enviarlo.
     * @param {object} apiPayload - Los datos ya formateados y listos para ser enviados,
     *                              proporcionados por el componente `ProductForm`.
     */
    const handleCreateProduct = useCallback((apiPayload) => {
        // --- LÓGICA SIMPLIFICADA ---
        // El `ProductForm` ya ha preparado el payload. Esta página solo necesita
        // pasarlo a la función de mutación.
        createProduct(apiPayload);
    }, [createProduct]);

    // --------------------------------------------------------------------------
    // Sub-sección 2.4: Renderizado de la Interfaz de Usuario (UI)
    // --------------------------------------------------------------------------

    return (
        <Container maxWidth="lg">
            <Paper 
                component="main"
                sx={{ 
                    p: { xs: 2, sm: 3, md: 4 }, 
                    my: { xs: 2, md: 4 },
                    borderRadius: 2, 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)' 
                }}
            >
                <Box sx={{ mb: 4, borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: '600' }}>
                        Crear Nuevo Producto
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Rellene la información del catálogo para registrar un nuevo artículo en el sistema.
                    </Typography>
                </Box>
                
                <ProductForm
                    onSubmit={handleCreateProduct}
                    isSubmitting={isSubmitting} // El estado de carga viene directamente de `useMutation`.
                />
            </Paper>
        </Container>
    );
};

export default NewProductPage;