// frontend/src/features/crm/pages/CustomerListPage.js

/**
 * @file Página para listar y gestionar todos los Clientes del sistema.
 *
 * @description Este componente orquesta la visualización de la lista de clientes.
 * Se encarga de la obtención de datos paginados desde la API, gestiona los
 * estados de la UI (carga, error) y maneja la navegación hacia las páginas de
 * creación y edición de clientes.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Container, Paper, Alert } from '@mui/material';

import { getCustomersAPI } from '../api/customersAPI';
import useDebounce from '../../../hooks/useDebounce';
import CustomerDataGrid from '../components/CustomerDataGrid'; // Este componente lo crearemos a continuación
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const CustomerListPage = () => {
    // --------------------------------------------------------------------------
    // Sub-sección 2.1: Hooks y Gestión de Estado
    // --------------------------------------------------------------------------
    const navigate = useNavigate();
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // --------------------------------------------------------------------------
    // Sub-sección 2.2: Lógica de Obtención de Datos (React Query)
    // --------------------------------------------------------------------------
    const {
        data,
        isLoading,
        isError,
        error
    } = useQuery({
        // La queryKey incluye el modelo de paginación y el término de búsqueda
        // para que React Query vuelva a ejecutar la consulta cuando cambien.
        queryKey: ['customers', paginationModel, debouncedSearchTerm],
        queryFn: () => getCustomersAPI({
            page: paginationModel.page + 1, // La API espera paginación base 1
            pageSize: paginationModel.pageSize,
            search: debouncedSearchTerm,
        }),
        placeholderData: (previousData) => previousData, // Mantiene los datos antiguos visibles mientras se cargan los nuevos
        staleTime: 30000, // Los datos se consideran "frescos" por 30 segundos
    });

    // --------------------------------------------------------------------------
    // Sub-sección 2.3: Manejadores de Eventos (Callbacks)
    // --------------------------------------------------------------------------
    
    const handleAddCustomer = useCallback(() => {
        navigate('/crm/clientes/nuevo'); // Ruta que definiremos en AppRoutes
    }, [navigate]);

    const handleEditCustomer = useCallback((customerId) => {
        navigate(`/crm/clientes/editar/${customerId}`); // Ruta que definiremos en AppRoutes
    }, [navigate]);

    // --------------------------------------------------------------------------
    // Sub-sección 2.4: Renderizado de la Interfaz de Usuario
    // --------------------------------------------------------------------------
    return (
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <PageHeader
                title="Gestión de Clientes"
                subtitle="Consulte, cree y administre la información de sus clientes."
                addButtonText="Nuevo Cliente"
                onAddClick={handleAddCustomer}
            />
            
            <Paper sx={{ height: 700, width: '100%', borderRadius: 2, boxShadow: 3 }}>
                {isError && (
                    <Alert severity="error" sx={{ m: 2 }}>
                        {`Error al cargar los clientes: ${formatApiError(error)}`}
                    </Alert>
                )}
                
                {/* 
                  El componente CustomerDataGrid recibirá los datos y callbacks.
                  Lo crearemos en el siguiente paso. Por ahora, asumimos que existe.
                */}
                <CustomerDataGrid
                    customers={data?.items || []}
                    rowCount={data?.total_count || 0}
                    isLoading={isLoading}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    onEditCustomer={handleEditCustomer}
                    searchTerm={searchTerm}
                    onSearchChange={(event) => setSearchTerm(event.target.value)}
                />
            </Paper>
        </Container>
    );
};

export default CustomerListPage;