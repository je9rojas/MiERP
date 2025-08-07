// /frontend/src/features/crm/pages/NewSupplierPage.js

/**
 * @file Página contenedora para el formulario de creación de un nuevo proveedor.
 *
 * Este componente actúa como el "cerebro" de la página, orquestando la
 * lógica de alto nivel para la creación de un proveedor. Sus responsabilidades son:
 * - Renderizar el componente de formulario reutilizable `SupplierForm`.
 * - Gestionar el estado de envío (loading/submitting).
 * - Limpiar y formatear los datos del formulario para la API.
 * - Manejar la comunicación con la API para crear el nuevo proveedor.
 * - Proporcionar retroalimentación al usuario (notificaciones de éxito/error).
 * - Gestionar la navegación post-creación.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Container, Paper, Box, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import SupplierForm from '../components/SupplierForm';
import { createSupplierAPI } from '../api/suppliersAPI';
import { formatApiError } from '../../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const NewSupplierPage = () => {
    // --- 2.1: Hooks y Gestión de Estado ---
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // --- 2.2: Lógica de Mutación para Crear el Proveedor ---
    const { mutate: createSupplier, isPending: isSubmitting } = useMutation({
        mutationFn: createSupplierAPI,
        onSuccess: () => {
            enqueueSnackbar('Proveedor creado exitosamente!', { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['suppliersList'] });
            navigate('/crm/proveedores');
        },
        onError: (error) => {
            console.error("Error al crear el proveedor:", error);
            const userFriendlyErrorMessage = formatApiError(error);
            enqueueSnackbar(userFriendlyErrorMessage, {
                variant: 'error',
                persist: true,
            });
        }
    });

    // --- 2.3: Manejador de Envío del Formulario ---
    const handleFormSubmit = useCallback((formValues) => {
        const payload = { ...formValues };

        // Limpieza de datos ANTES de enviar a la API:
        // 1. Filtrar las filas de correos que el usuario dejó vacías.
        payload.emails = payload.emails.filter(email => email.address && email.address.trim() !== '');

        // 2. Si el usuario no ingresó ningún dato en la sección "Persona de Contacto",
        //    enviamos `null` en lugar de un objeto con campos vacíos.
        const contact = payload.contact_person;
        if (contact && !contact.name && !contact.email && !contact.phone && !contact.position) {
            payload.contact_person = null;
        }

        createSupplier(payload);
    }, [createSupplier]);


    // --- 2.4: Renderizado de la UI ---
    return (
        <Container maxWidth="md" sx={{ my: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, boxShadow: 3 }}>
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Registrar Nuevo Proveedor
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Complete la información a continuación para añadir un nuevo proveedor al sistema.
                    </Typography>
                </Box>
                
                <SupplierForm
                    onSubmit={handleFormSubmit}
                    isSubmitting={isSubmitting}
                />
            </Paper>
        </Container>
    );
};

export default NewSupplierPage;