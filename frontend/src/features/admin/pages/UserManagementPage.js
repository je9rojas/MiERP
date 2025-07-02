// /frontend/src/features/admin/pages/UserManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import { getUsers, getRoles, createUser, updateUser, deleteUser } from '../../../api/adminAPI';
import UserFormModal from '../components/UserFormModal'; // Importamos el nuevo modal

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const usersResponse = await getUsers();
      setUsers(usersResponse.data);
    } catch (err) {
      setError('Error al cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = async () => {
      try {
        setLoading(true);
        const rolesResponse = await getRoles();
        setRoles(rolesResponse.data);
        await fetchUsers();
      } catch (err) {
        setError('Error al cargar datos iniciales.');
      } finally {
        setLoading(false);
      }
    };
    initialLoad();
  }, [fetchUsers]);

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

  const handleFormSubmit = async (values) => {
    try {
      if (editingUser) {
        // Lógica de actualización
        await updateUser(editingUser.username, values);
      } else {
        // Lógica de creación
        await createUser(values);
      }
      handleCloseModal();
      await fetchUsers(); // Recargar la lista de usuarios
    } catch (err) {
      setError(err.response?.data?.detail || 'Ocurrió un error al guardar el usuario.');
    }
  };
  
  const handleDeactivateUser = async (username) => {
    if (window.confirm(`¿Estás seguro de que quieres desactivar al usuario ${username}?`)) {
      try {
        await deleteUser(username);
        await fetchUsers();
      } catch (err) {
        setError(err.response?.data?.detail || 'Error al desactivar el usuario.');
      }
    }
  };
  
  const getStatusChip = (status) => {
    return status === 'active' 
      ? <Chip label="Activo" color="success" size="small" /> 
      : <Chip label="Inactivo" color="error" size="small" />;
  }

  if (loading && users.length === 0) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Gestión de Usuarios
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateModal}>
          Crear Usuario
        </Button>
      </Box>

      <Paper sx={{ boxShadow: 3, borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Sucursal</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.username} hover>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.branch.name}</TableCell>
                  <TableCell>{getStatusChip(user.status)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary" onClick={() => handleOpenEditModal(user)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeactivateUser(user.username)}>
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
          // Si estamos editando, pasamos los datos del usuario. Si no, un objeto vacío con la estructura base.
          initialValues={editingUser || { name: '', username: '', tax_id: '', role: '', branch: { name: '', is_main: true }, password: '' }}
          roles={roles}
        />
      )}
    </Box>
  );
};

export default UserManagementPage;