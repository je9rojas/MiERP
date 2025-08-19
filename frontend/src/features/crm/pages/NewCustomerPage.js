// frontend/src/features/crm/pages/NewCustomerPage.js

/**
 * @file Página para la creación de un nuevo Cliente.
 *
 * @description Este componente orquesta el proceso de creación de un cliente.
 * Utiliza el formulario reutilizable `CustomerForm` y gestiona la lógica de
 * envío de datos a la API a través de `useMutation` de React Query, incluyendo
 * una transformación del payload para asegurar la compatibilidad con el backend.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Container, Paper } from '@mui/material';

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
            queryClient.invalidateQueries({ queryKey: ['customers'] });
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
        // --- CORRECCIÓN CRÍTICA: Limpieza del Payload ---
        // Pydantic (especialmente con EmailStr) es estricto y no acepta strings vacíos ('')
        // para campos opcionales. Debemos convertir los strings vacíos a `null`
        // para que el backend los interprete correctamente como `None`.
        
        const cleanedPayload = {
            ...formValues,
            // Convierte campos de texto opcionales a null si están vacíos
            address: formValues.address || null,
            phone: formValues.phone || null,
        };

        // Lógica específica para el objeto anidado `contact_person`
        const contactPerson = formValues.contact_person;
        const hasContactData = Object.values(contactPerson).some(value => !!value);

        if (hasContactData) {
            cleanedPayload.contact_person = {
                name: contactPerson.name || null,
                email: contactPerson.email || null, // Clave para el error de EmailStr
                phone: contactPerson.phone || null,
                position: contactPerson.position || null,
            };
        } else {
            // Si todos los campos de contacto están vacíos, enviamos el objeto como null.
            cleanedPayload.contact_person = null;
        }

        createCustomer(cleanedPayload);
        setSubmitting(false);
    }, [createCustomer, enqueueSnackbar]);

    // --------------------------------------------------------------------------
    // Sub-sección 2.4: Renderizado de la Interfaz de Usuario
    // --------------------------------------------------------------------------
    return (
        <Container maxWidth="lg" sx={{ my: 4 }}>
            <PageHeader
                title="Registrar Nuevo Cliente"
                subtitle="Complete la información a continuación para añadir un nuevo cliente al sistema."
                showAddButton={false}
            />
            
            <Paper sx={{ p: { xs: 2, md: 4 }, mt: 3, borderRadius: 2, boxShadow: 3 }}>
                <CustomerForm
                    onSubmit={handleFormSubmit}
                    isSubmitting={isSubmitting}
                />
            </Paper>
        </Container>
    );
};

export default NewCustomerPage;