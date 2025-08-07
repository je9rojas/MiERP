/**
 * @file Página contenedora para el formulario de creación de un nuevo producto.
 *
 * @description
 * Este componente actúa como un "contenedor inteligente" (Smart Container). Su única
 * responsabilidad es orquestar la lógica de alto nivel para la creación de un
 * producto, incluyendo:
 * - La preparación y limpieza de los datos del formulario para la API.
 * - La gestión del estado de envío (loading/submitting) para la UI.
 * - La comunicación con el backend a través del servicio de API correspondiente.
 * - La gestión de la retroalimentación al usuario (notificaciones de éxito/error).
 * - La redirección del usuario tras una operación exitosa.
 *
 * Delega toda la lógica de presentación, validación y gestión del estado del
 * formulario al componente reutilizable `ProductForm`.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES DE MÓDULOS
// ==============================================================================

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Typography, Paper, Container, Box } from '@mui/material';

import ProductForm from '../components/ProductForm';
import { createProductAPI } from '../api/productsAPI';

// ==============================================================================
// SECCIÓN 2: FUNCIONES DE UTILIDAD (HELPERS)
// ==============================================================================

/**
 * Prepara el payload del formulario para ser enviado a la API.
 * Transforma strings vacíos de campos numéricos a `null` para cumplir con la
 * validación de Pydantic en el backend.
 *
 * @param {object} formData Los datos crudos provenientes del estado de Formik.
 * @returns {object} Un nuevo objeto de datos, limpio y listo para ser serializado a JSON.
 */
const preparePayloadForApi = (formData) => {
    // Se crea una copia profunda para evitar mutaciones directas del estado de Formik.
    const payload = JSON.parse(JSON.stringify(formData));

    // --- Sub-sección 2.1: Función auxiliar para conversión de tipos ---
    const toNumberOrNull = (value) => {
        if (value === '' || value === null || value === undefined) {
            return null; // Pydantic interpreta `null` como `None` para campos opcionales.
        }
        return Number(value); // Convierte strings numéricos ("123") a números (123).
    };

    // --- Sub-sección 2.2: Limpieza de campos numéricos de nivel superior ---
    const numericFields = ['price', 'weight_g', 'average_cost', 'stock_quantity', 'points_on_sale'];
    numericFields.forEach(field => {
        if (payload.hasOwnProperty(field)) {
            payload[field] = toNumberOrNull(payload[field]);
        }
    });

    // --- Sub-sección 2.3: Limpieza del objeto anidado de dimensiones ---
    if (payload.dimensions) {
        Object.keys(payload.dimensions).forEach(key => {
            const value = payload.dimensions[key];
            // El campo 'g' (rosca) es especial, puede ser texto o número.
            if (key === 'g') {
                payload.dimensions[key] = value === '' ? null : value;
            } else {
                payload.dimensions[key] = toNumberOrNull(value);
            }
        });
    }

    // --- Sub-sección 2.4: Transformación de las aplicaciones de vehículos ---
    if (payload.applications && Array.isArray(payload.applications)) {
        payload.applications = payload.applications
            // Se filtran filas vacías que el usuario pudo haber añadido pero no llenado.
            .filter(app => app.brand || app.model) 
            .map(app => {
                const yearFrom = parseInt(app.year_from, 10);
                const yearTo = parseInt(app.year_to, 10) || yearFrom;
                const years = [];

                if (!isNaN(yearFrom)) {
                    for (let y = yearFrom; y <= yearTo; y++) {
                        years.push(y);
                    }
                }
                
                return {
                    brand: app.brand,
                    model: app.model,
                    engine: app.engine,
                    years: years, // El backend espera un array de números.
                };
            });
    }

    return payload;
};

/**
 * Formatea un objeto de error de la API en un mensaje legible para el usuario.
 *
 * @param {object} error El objeto de error de Axios capturado en el bloque catch.
 * @returns {string} Un mensaje de error formateado y listo para ser mostrado en un Snackbar.
 */
const formatApiError = (error) => {
    const errorDetail = error.response?.data?.detail;
    const defaultErrorMessage = 'Ocurrió un error inesperado. Por favor, intente de nuevo.';

    if (Array.isArray(errorDetail)) {
        // Error de validación de Pydantic: formatea los detalles.
        return errorDetail
            .map(err => `${err.loc[err.loc.length - 1] || 'Campo'}: ${err.msg}`)
            .join('; ');
    }
    
    if (typeof errorDetail === 'string') {
        // Error de negocio controlado desde el backend (ej: "SKU ya existe").
        return errorDetail;
    }
    
    // Otros errores de red o servidor no controlados.
    return error.message || defaultErrorMessage;
};

// ==============================================================================
// SECCIÓN 3: DEFINICIÓN DEL COMPONENTE PRINCIPAL
// ==============================================================================

const NewProductPage = () => {
    // --- Sub-sección 3.1: Hooks de React y Librerías ---
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Sub-sección 3.2: Manejador de Lógica de Negocio ---
    /**
     * Orquesta el proceso completo de creación de un producto al enviar el formulario.
     * Se pasa como prop `onSubmit` al componente `ProductForm`.
     */
    const handleCreateProduct = useCallback(async (formData) => {
        setIsSubmitting(true);

        try {
            // Paso 1: Limpiar y preparar los datos para la API.
            const cleanedPayload = preparePayloadForApi(formData);
            
            // Paso 2: Realizar la llamada a la API con los datos procesados.
            await createProductAPI(cleanedPayload);
            
            // Paso 3: Informar al usuario del éxito y redirigir.
            enqueueSnackbar('Producto creado exitosamente!', { 
                variant: 'success',
                anchorOrigin: { vertical: 'top', horizontal: 'center' },
            });
            navigate('/inventario/productos');

        } catch (error) {
            // Paso 4: Manejar errores de la API.
            console.error("Error detallado al crear producto:", error.response || error);
            const userFriendlyErrorMessage = formatApiError(error);
            enqueueSnackbar(userFriendlyErrorMessage, {
                variant: 'error',
                persist: true, // El error es importante, no lo ocultes automáticamente.
            });

        } finally {
            // Paso 5: Asegurar que el estado de envío se restablezca siempre.
            setIsSubmitting(false);
        }
    }, [navigate, enqueueSnackbar]);


    // --- Sub-sección 3.3: Renderizado de la Interfaz de Usuario (UI) ---
    return (
        <Container maxWidth="lg">
            <Paper 
                component="main"
                sx={{ 
                    p: { xs: 2, sm: 3, md: 4 }, 
                    my: { xs: 2, md: 4 },
                    borderRadius: 2, 
                    boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' 
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
                    isSubmitting={isSubmitting}
                />
            </Paper>
        </Container>
    );
};

export default NewProductPage;