// File: /frontend/src/features/crm/pages/SupplierListPage.js

/**
 * @file Página para listar y gestionar todos los Proveedores del sistema.
 *
 * @description Este componente orquesta la visualización de la lista de proveedores.
 * Se encarga de la obtención de datos paginados desde la API, gestiona los
 * estados de la UI, prepara los datos para la tabla y maneja la navegación.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Container, Paper, Alert } from '@mui/material';

import { getSuppliersAPI } from '../api/suppliersAPI';
import useDebounce from '../../../hooks/useDebounce';
import SupplierDataGrid from '../components/SupplierDataGrid';
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const SupplierListPage = () => {
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
        queryKey: ['suppliers', paginationModel, debouncedSearchTerm],
        queryFn: () => getSuppliersAPI({
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
    
    const flattenedSuppliers = useMemo(() => {
        if (!apiResponse?.items) {
            return [];
        }
        return apiResponse.items.map(supplier => ({
            ...supplier,
            main_email: (supplier.emails && supplier.emails.length > 0) ? supplier.emails[0].address : '—',
        }));
    }, [apiResponse]);

    // --------------------------------------------------------------------------
    // Sub-sección 2.4: Manejadores de Eventos
    // --------------------------------------------------------------------------
    
    const handleAddSupplier = useCallback(() => {
        navigate('/crm/proveedores/nuevo');
    }, [navigate]);

    const handleEditSupplier = useCallback((supplierId) => {
        navigate(`/crm/proveedores/${supplierId}`);
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
                title="Gestión de Proveedores"
                subtitle="Consulte, cree y administre la información de sus proveedores."
                addButtonText="Nuevo Proveedor"
                onAddClick={handleAddSupplier}
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
                        {`Error al cargar los proveedores: ${formatApiError(error)}`}
                    </Alert>
                )}
                
                <SupplierDataGrid
                    suppliers={flattenedSuppliers}
                    rowCount={apiResponse?.total_count || 0}
                    isLoading={isLoading}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    onEditSupplier={handleEditSupplier}
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                />
            </Paper>
        </Container>
    );
};

export default SupplierListPage;