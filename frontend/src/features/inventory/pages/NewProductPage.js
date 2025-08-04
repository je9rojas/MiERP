/**
 * @file Página contenedora para el formulario de creación de un nuevo producto.
 *
 * Este componente actúa como un "contenedor inteligente" (Smart Container). Su única
 * responsabilidad es orquestar la lógica de alto nivel para la creación de un
 * producto, incluyendo:
 * - La gestión del estado de envío (loading/submitting).
 * - La comunicación con la API a través del servicio correspondiente.
 * - La gestión de la retroalimentación al usuario (notificaciones de éxito/error).
 * - La navegación tras una operación exitosa.
 *
 * Delega toda la lógica de presentación, validación de campos y gestión del estado
 * del formulario al componente reutilizable `ProductForm`.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Typography, Paper, Container, Box } from '@mui/material';

import ProductForm from '../components/ProductForm';
import { createProductAPI } from '../api/productsAPI';

// ==============================================================================
// SECCIÓN 2: FUNCIONES DE AYUDA (UTILITIES)
// ==============================================================================

/**
 * Formatea un objeto de error de la API en un mensaje legible para el usuario.
 * @param {object} error El objeto de error capturado en el bloque catch.
 * @returns {string} Un mensaje de error formateado y listo para ser mostrado.
 */
const formatApiError = (error) => {
    const errorDetail = error.response?.data?.detail;
    const defaultErrorMessage = 'Ocurrió un error inesperado al procesar la solicitud.';

    // Caso 1: Error de validación de Pydantic (devuelve un array de errores)
    if (Array.isArray(errorDetail)) {
        return errorDetail
            .map(err => `${err.loc[1] || 'Campo'}: ${err.msg}`) // ej. "sku: Este campo es requerido"
            .join('; ');
    }
    
    // Caso 2: Error de negocio manejado (devuelve un string)
    if (typeof errorDetail === 'string') {
        return errorDetail; // ej. "El SKU ya existe en la base de datos."
    }
    
    // Caso 3: Otros errores de red o servidor no controlados
    return error.message || defaultErrorMessage;
};


// ==============================================================================
// SECCIÓN 3: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const NewProductPage = () => {
    // --- Hooks para navegación, notificaciones y estado ---
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Manejador para el evento de envío del formulario.
     * Esta función se pasa como prop a `ProductForm`.
     * @param {object} productData Los datos del producto, ya validados y formateados por Formik.
     */
    const handleCreateProduct = useCallback(async (productData) => {
        setIsSubmitting(true);

        try {
            await createProductAPI(productData);
            enqueueSnackbar('Producto creado exitosamente!', { variant: 'success' });
            navigate('/inventario/productos');
        } catch (error) {
            console.error("Error detallado al crear producto:", error);
            const userFriendlyErrorMessage = formatApiError(error);
            enqueueSnackbar(userFriendlyErrorMessage, {
                variant: 'error',
                persist: true, // Mantiene el mensaje de error visible hasta que el usuario lo cierre
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [navigate, enqueueSnackbar]);


    // --- Renderizado de la UI ---
    return (
        <Container maxWidth="lg">
            <Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, my: 4, borderRadius: 2, boxShadow: 3 }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Crear Nuevo Producto
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Complete todos los campos a continuación para registrar un nuevo artículo en el inventario.
                    </Typography>
                </Box>
                
                <ProductForm
                    onSubmit={handleCreateProduct}
                    isSubmitting={isSubmitting}
                />
            </Paper>
        </Container>
    );
};

export default NewProductPage;