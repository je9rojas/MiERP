// frontend/src/features/inventory/pages/NewProductPage.js

/**
 * @file Página contenedora para el formulario de creación de un nuevo producto.
 * @description Este componente orquesta el flujo de creación de un producto.
 * Actúa como un "contenedor inteligente", conectando el formulario, la lógica de
 * transformación de datos (mappers) y la comunicación con la API.
 */

// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Typography, Paper, Container, Box } from '@mui/material';

import ProductForm from '../components/ProductForm';
import { createProductAPI } from '../api/productsAPI';
import { mapFormToCreateAPI } from '../productMappers'; // <--- USANDO EL MAPPER CENTRALIZADO
import { formatApiError } from '../../../utils/errorUtils';

// SECCIÓN 2: DEFINICIÓN DEL COMPONENTE PRINCIPAL
const NewProductPage = () => {
    // Sub-sección 2.1: Hooks de React y Librerías
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // Sub-sección 2.2: Mutación de Creación con React Query
    const { mutate: createProduct, isPending: isSubmitting } = useMutation({
        mutationFn: createProductAPI, // La función que realiza la llamada a la API.
        onSuccess: (data) => {
            enqueueSnackbar(`Producto "${data.name}" creado exitosamente!`, {
                variant: 'success',
            });
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Invalida la cache de la lista de productos.
            navigate('/inventario/productos');
        },
        onError: (error) => {
            console.error("Error detallado al crear producto:", error.response || error);
            const userFriendlyErrorMessage = formatApiError(error);
            enqueueSnackbar(userFriendlyErrorMessage, {
                variant: 'error',
                persist: true,
            });
        },
    });

    // Sub-sección 2.3: Manejador de Envío del Formulario
    /**
     * Orquesta el proceso de creación al recibir los datos del formulario.
     * @param {object} formData Los datos crudos provenientes del estado de Formik.
     */
    const handleCreateProduct = useCallback((formData) => {
        // Paso 1: Mapear los datos del formulario al formato esperado por la API.
        const apiPayload = mapFormToCreateAPI(formData);
        
        // Paso 2: Ejecutar la mutación con el payload preparado.
        createProduct(apiPayload);

    }, [createProduct]);

    // Sub-sección 2.4: Renderizado de la Interfaz de Usuario (UI)
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
                    isSubmitting={isSubmitting} // El estado de carga viene directamente de useMutation.
                />
            </Paper>
        </Container>
    );
};

export default NewProductPage;