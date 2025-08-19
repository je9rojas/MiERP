// frontend/src/features/crm/pages/NewCustomerPage.js

/**
 * @file Página para la creación de un nuevo Cliente.
 *
 * @description Este componente orquesta el proceso de creación de un cliente.
 * Utiliza el formulario reutilizable `CustomerForm` y gestiona la lógica de
 * envío de datos a la API a través de `useMutation` de React Query.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Container, Paper, Typography } from '@mui/material';

import { createCustomerAPI } from '../api/customersAPI';
import CustomerForm from '../components/CustomerForm';
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const NewCustomerPage = () => {
    // --------------------------------------------------------------------------
    // Sub-sección 2.1: Hooks y Gestión de Estado
    // --------------------------------------------------------------------------
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { enqueueSnackbar } = useSnackbar();

    // --------------------------------------------------------------------------
    // Sub-sección 2.2: Lógica de Mutación para Crear el Cliente
    // --------------------------------------------------------------------------
    const { mutate: createCustomer, isPending: isSubmitting } = useMutation({
        mutationFn: createCustomerAPI,
        onSuccess: (newCustomer) => {
            enqueueSnackbar(`Cliente "${newCustomer.business_name}" creado exitosamente.`, { variant: 'success' });
            // Invalida la consulta de la lista de clientes para que se actualice
            // la próxima vez que el usuario visite esa página.
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            // Redirige al usuario a la lista de clientes.
            navigate('/crm/clientes');
        },
        onError: (error) => {
            const userFriendlyError = formatApiError(error);
            enqueueSnackbar(userFriendlyError, { variant: 'error', persist: true });
        },
    });

    // --------------------------------------------------------------------------
    // Sub-sección 2.3: Manejador de Envío del Formulario
    // --------------------------------------------------------------------------
    const handleFormSubmit = useCallback((formValues, { setSubmitting }) => {
        // La lógica de mapeo podría estar en un archivo `mappers.js` si se vuelve compleja.
        // Por ahora, el payload es directo desde los valores del formulario.
        createCustomer(formValues);
        // Formik necesita saber cuándo termina la sumisión.
        setSubmitting(false);
    }, [createCustomer]);

    // --------------------------------------------------------------------------
    // Sub-sección 2.4: Renderizado de la Interfaz de Usuario
    // --------------------------------------------------------------------------
    return (
        <Container maxWidth="lg" sx={{ my: 4 }}>
            <PageHeader
                title="Registrar Nuevo Cliente"
                subtitle="Complete la información a continuación para añadir un nuevo cliente al sistema."
                showAddButton={false} // No se necesita un botón de "Añadir" en la página de "Añadir"
            />
            
            <Paper sx={{ p: { xs: 2, md: 4 }, mt: 3, borderRadius: 2, boxShadow: 3 }}>
                <CustomerForm
                    onSubmit={handleFormSubmit}
                    isSubmitting={isSubmitting}
                    // No se pasa `initialData` porque es un formulario de creación
                />
            </Paper>
        </Container>
    );
};

export default NewCustomerPage;