// /frontend/src/features/crm/pages/SupplierListPage.js

/**
 * @file Página contenedora para listar, buscar y gestionar proveedores.
 *
 * Actúa como el "cerebro", gestionando la obtención de datos y el estado,
 * y pasando toda la información necesaria a los componentes de presentación.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Container, Paper, Box, Alert } from '@mui/material';

import { getSuppliersAPI } from '../api/suppliersAPI';
import useDebounce from '../../../hooks/useDebounce';
import SupplierDataGrid from '../components/SupplierDataGrid';

const SupplierListPage = () => {
    const navigate = useNavigate();
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['suppliers', paginationModel.page + 1, paginationModel.pageSize, debouncedSearchTerm],
        queryFn: () => getSuppliersAPI({
            page: paginationModel.page + 1,
            pageSize: paginationModel.pageSize,
            search: debouncedSearchTerm,
        }),
        placeholderData: (previousData) => previousData,
        staleTime: 5000,
    });

    const handleAddSupplier = () => {
        navigate('/crm/proveedores/nuevo');
    };

    const handleEditSupplier = (supplierId) => {
        navigate(`/crm/proveedores/editar/${supplierId}`);
    };

    // Objeto con todas las props que nuestro toolbar personalizado necesita.
    const toolbarProps = {
        title: "Gestión de Proveedores",
        addButtonText: "Añadir Nuevo Proveedor",
        onAddClick: handleAddSupplier,
        searchTerm: searchTerm,
        onSearchChange: (event) => setSearchTerm(event.target.value),
        searchPlaceholder: "Buscar por RUC o Razón Social..."
    };

    return (
        <Container maxWidth="xl" sx={{ my: 4 }}>
            <Paper sx={{ p: 0, borderRadius: 2, boxShadow: 3, overflow: 'hidden' }}>
                {isError && (
                    <Alert severity="error" sx={{ m: 2 }}>Error al cargar los proveedores: {error.message}</Alert>
                )}
                
                {/* El componente DataGrid ahora es autónomo y recibe todo lo que necesita */}
                <SupplierDataGrid
                    suppliers={data?.items || []}
                    rowCount={data?.total_count || 0}
                    isLoading={isLoading}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    onEditSupplier={handleEditSupplier}
                    toolbarProps={toolbarProps}
                />
            </Paper>
        </Container>
    );
};

export default SupplierListPage;