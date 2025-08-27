// File: /frontend/src/features/crm/pages/CustomerListPage.js

/**
 * @file Página para listar y gestionar todos los Clientes del sistema.
 *
 * @description Este componente orquesta la visualización de la lista de clientes.
 * Se encarga de la obtención de datos paginados desde la API, gestiona los
 * estados de la UI (carga, error), prepara los datos para la tabla y maneja la
 * navegación hacia las páginas de creación y edición.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Container, Paper, Alert } from '@mui/material';

import { getCustomersAPI } from '../api/customersAPI';
import useDebounce from '../../../hooks/useDebounce';
import CustomerDataGrid from '../components/CustomerDataGrid';
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
    // Sub-sección 2.2: Lógica de Obtención de Datos
    // --------------------------------------------------------------------------
    
    const {
        data: apiResponse,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: ['customers', paginationModel, debouncedSearchTerm],
        queryFn: () => getCustomersAPI({
            page: paginationModel.page + 1,
            pageSize: paginationModel.pageSize,
            search: debouncedSearchTerm,
        }),
        placeholderData: (previousData) => previousData,
        staleTime: 30000,
    });

    // --------------------------------------------------------------------------
    // Sub-sección 2.3: Preparación y Aplanamiento de Datos para la UI
    // --------------------------------------------------------------------------

    const flattenedCustomers = useMemo(() => {
        if (!apiResponse?.items) {
            return [];
        }
        return apiResponse.items.map(customer => ({
            ...customer,
            contact_person_name: customer.contact_person?.name || 'No asignado',
        }));
    }, [apiResponse]);

    // --------------------------------------------------------------------------
    // Sub-sección 2.4: Manejadores de Eventos
    // --------------------------------------------------------------------------
    
    const handleAddCustomer = useCallback(() => {
        navigate('/crm/clientes/nuevo');
    }, [navigate]);

    const handleEditCustomer = useCallback((customerId) => {
        navigate(`/crm/clientes/${customerId}`);
    }, [navigate]);

    const handleSearchChange = useCallback((event) => {
        setSearchTerm(event.target.value);
    }, []);

    // --------------------------------------------------------------------------
    // Sub-sección 2.5: Renderizado de la Interfaz de Usuario
    // --------------------------------------------------------------------------
    
    return (
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <PageHeader
                title="Gestión de Clientes"
                subtitle="Consulte, cree y administre la información de sus clientes."
                addButtonText="Nuevo Cliente"
                onAddClick={handleAddCustomer}
            />
            
            <Paper 
                sx={{ 
                    height: 700, 
                    width: '100%', 
                    mt: 3, 
                    borderRadius: 2, 
                    boxShadow: 3,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {isError && (
                    <Alert severity="error" sx={{ m: 2, flexShrink: 0 }}>
                        {`Error al cargar los clientes: ${formatApiError(error)}`}
                    </Alert>
                )}
                
                <CustomerDataGrid
                    customers={flattenedCustomers}
                    rowCount={apiResponse?.total_count || 0}
                    isLoading={isLoading}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    onEditCustomer={handleEditCustomer}
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                />
            </Paper>
        </Container>
    );
};

export default CustomerListPage;