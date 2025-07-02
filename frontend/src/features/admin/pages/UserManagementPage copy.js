// /frontend/src/features/admin/pages/UserManagementPage.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getUsers, getRoles } from '../../../api/adminAPI'; // Importamos las funciones de la API

// Más adelante importaremos el modal/formulario de creación de usuario
// import UserFormModal from '../components/UserFormModal'; 

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // const [isModalOpen, setIsModalOpen] = useState(false);
  // const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const usersResponse = await getUsers();
        const rolesResponse = await getRoles();
        setUsers(usersResponse.data);
        setRoles(rolesResponse.data);
        setError(null);
      } catch (err) {
        setError('Error al cargar los datos. Por favor, intente de nuevo.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Gestión de Usuarios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          // onClick={() => setIsModalOpen(true)}
        >
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
                <TableRow key={user.username}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.branch.name}</TableCell>
                  <TableCell>{user.status}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* 
        Aquí irá el componente Modal que contendrá el formulario.
        <UserFormModal 
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          roles={roles}
          currentUser={currentUser}
          // ... más props
        />
      */}
    </Box>
  );
};

export default UserManagementPage;