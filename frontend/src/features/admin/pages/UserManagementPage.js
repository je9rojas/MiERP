// File: /frontend/src/features/admin/pages/UserManagementPage.js

/**
 * @file Página para la administración de usuarios del sistema.
 * @description Este componente actúa como el "cerebro" (Container) de la vista de
 * gestión de usuarios. Utiliza React Query para orquestar la obtención y mutación
 * de datos, y delega la renderización del formulario a un componente modal de presentación.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Typography, Button, CircularProgress, Alert, Paper, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import { useSnackbar } from 'notistack';

// Importaciones de los nuevos archivos de API
import { getUsersAPI, createUserAPI, updateUserAPI, deactivateUserAPI } from '../../users/api/usersAPI';
import { getRolesAPI } from '../../roles/api/rolesAPI';

import UserFormModal from '../components/UserFormModal';
import PageHeader from '../../../components/common/PageHeader';
import { formatApiError } from '../../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: COMPONENTE PRINCIPAL DE LA PÁGINA
// ==============================================================================

const UserManagementPage = () => {
    // --------------------------------------------------------------------------
    // Sub-sección 2.1: Hooks y Estado de la UI
    // --------------------------------------------------------------------------
    
    const queryClient = useQueryClient();
    const { enqueueSnackbar } = useSnackbar();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // --------------------------------------------------------------------------
    // Sub-sección 2.2: Lógica de Obtención de Datos con React Query
    // --------------------------------------------------------------------------
    
    const { data: usersData, isLoading: isLoadingUsers, isError: isErrorUsers, error: usersError } = useQuery({
        queryKey: ['users'],
        queryFn: () => getUsersAPI(),
        select: (data) => data.items || [], // Asumimos que la API devuelve un objeto paginado
    });

    const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
        queryKey: ['roles'],
        queryFn: getRolesAPI,
        staleTime: 300000, // Cache de 5 minutos para los roles
    });

    // --------------------------------------------------------------------------
    // Sub-sección 2.3: Lógica de Mutaciones de Datos con React Query
    // --------------------------------------------------------------------------

    const { mutate: performUserAction, isPending: isMutating } = useMutation({
        mutationFn: ({ action, userData, userId }) => {
            switch (action) {
                case 'create':
                    return createUserAPI(userData);
                case 'update':
                    return updateUserAPI(userId, userData);
                case 'deactivate':
                    return deactivateUserAPI(userId);
                default:
                    throw new Error('Acción de usuario no válida.');
            }
        },
        onSuccess: (_, variables) => {
            const successMessages = {
                create: 'Usuario creado exitosamente.',
                update: 'Usuario actualizado exitosamente.',
                deactivate: 'Usuario desactivado exitosamente.'
            };
            enqueueSnackbar(successMessages[variables.action], { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error) => {
            enqueueSnackbar(formatApiError(error), { variant: 'error', persist: true });
        },
        onSettled: () => {
            handleCloseModal();
        }
    });

    // --------------------------------------------------------------------------
    // Sub-sección 2.4: Manejadores de Eventos
    // --------------------------------------------------------------------------

    const handleOpenCreateModal = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleFormSubmit = useCallback((formValues) => {
        if (editingUser) {
            performUserAction({ action: 'update', userData: formValues, userId: editingUser.id });
        } else {
            performUserAction({ action: 'create', userData: formValues });
        }
    }, [editingUser, performUserAction]);
    
    const handleDeactivateUser = useCallback((user) => {
        if (window.confirm(`¿Está seguro de que desea desactivar al usuario ${user.username}?`)) {
            performUserAction({ action: 'deactivate', userId: user.id });
        }
    }, [performUserAction]);
    
    // --------------------------------------------------------------------------
    // Sub-sección 2.5: Renderizado de la UI
    // --------------------------------------------------------------------------

    const getStatusChip = (status) => (
        status === 'active' 
          ? <Chip label="Activo" color="success" size="small" variant="outlined" /> 
          : <Chip label="Inactivo" color="error" size="small" variant="outlined" />
    );
      
    if (isLoadingUsers || isLoadingRoles) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    if (isErrorUsers) {
        return <Alert severity="error" sx={{ m: 3 }}>{formatApiError(usersError)}</Alert>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader
                title="Gestión de Usuarios"
                subtitle="Cree, edite y gestione los permisos de los usuarios del sistema."
                addButtonText="Crear Usuario"
                onAddClick={handleOpenCreateModal}
            />

            <Paper sx={{ boxShadow: 3, borderRadius: 2, mt: 3 }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Username</TableCell>
                                <TableCell>Rol</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {usersData?.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>{user.username}</TableCell>
                                    <TableCell sx={{ textTransform: 'capitalize' }}>{user.role}</TableCell>
                                    <TableCell>{getStatusChip(user.status)}</TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" color="primary" onClick={() => handleOpenEditModal(user)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDeactivateUser(user)}>
                                            <BlockIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
            
            {isModalOpen && (
                <UserFormModal 
                    open={isModalOpen}
                    onClose={handleCloseModal}
                    onSubmit={handleFormSubmit}
                    isSubmitting={isMutating}
                    initialValues={editingUser || { name: '', username: '', role: '', status: 'active', password: '' }}
                    roles={roles}
                />
            )}
        </Box>
    );
};

export default UserManagementPage;