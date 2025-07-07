// /frontend/src/features/auth/pages/LoginPage.js
// CÓDIGO COMPLETO Y OPTIMIZADO - LISTO PARA COPIAR Y PEGAR

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../app/contexts/AuthContext';
import {
  TextField, Button, Box, Typography, CircularProgress, 
  Alert, InputAdornment
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';

const LoginPage = () => {
  // --- ESTADOS DEL COMPONENTE ---
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [formErrors, setFormErrors] = useState({});
  
  // --- HOOKS ---
  const { login, isLoading, error, isAuthenticated } = useAuth(); 
  const navigate = useNavigate();
  const location = useLocation();

  // --- EFECTO DE REDIRECCIÓN ---
  // Este es el mecanismo principal que nos saca de esta página una vez que el login es exitoso.
  // Se ejecuta cada vez que el estado `isAuthenticated` del contexto cambia.
  useEffect(() => {
    if (isAuthenticated) {
      // Intenta redirigir al usuario a la página que quería visitar antes de ser enviado al login.
      // Si no hay una ruta previa (ej. el usuario fue directamente a /login), lo envía al dashboard.
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  // --- MANEJADORES DE EVENTOS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    // Limpia el error del campo específico mientras el usuario escribe
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!credentials.username.trim()) {
      newErrors.username = 'El campo de usuario es requerido';
    }
    if (!credentials.password.trim()) {
      newErrors.password = 'El campo de contraseña es requerido';
    }
    setFormErrors(newErrors);
    // Devuelve `true` si no hay errores
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    // La función `login` del contexto se encarga de todo.
    // El `useEffect` de arriba reaccionará al cambio de `isAuthenticated` si el login es exitoso.
    await login(credentials);
  };

  return (
    <Box 
      sx={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        width: '100%', minHeight: '100vh', p: 2, bgcolor: 'background.default'
      }}
    >
      <Box 
        sx={{ 
          maxWidth: 450, width: '100%', p: 4, boxShadow: 3, borderRadius: 2,
          backgroundColor: 'background.paper', position: 'relative', overflow: 'hidden',
          borderTop: '4px solid',
          borderColor: 'primary.main'
        }}
      >
        <Box textAlign="center" mb={3}>
          <Box
            component="div"
            sx={{
              mx: 'auto', width: 64, height: 64, mb: 2,
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'primary.light', color: 'primary.contrastText'
            }}
          >
            <LockIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Acceso al Sistema
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Ingrese sus credenciales para continuar
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            name="username"
            label="Usuario"
            variant="outlined"
            fullWidth
            required
            margin="normal"
            value={credentials.username}
            onChange={handleInputChange}
            error={!!formErrors.username}
            helperText={formErrors.username}
            disabled={isLoading}
            InputProps={{
              startAdornment: ( <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment> ),
            }}
          />
          <TextField
            name="password"
            label="Contraseña"
            type="password"
            variant="outlined"
            fullWidth
            required
            margin="normal"
            value={credentials.password}
            onChange={handleInputChange}
            error={!!formErrors.password}
            helperText={formErrors.password}
            disabled={isLoading}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            sx={{ mt: 2, py: 1.5, fontWeight: 'bold' }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={26} color="inherit" /> : 'Ingresar'}
          </Button>
        </Box>
        
        <Box mt={3} textAlign="center">
          <Button 
            variant="text" 
            color="primary"
            onClick={() => navigate('/')}
          >
            ← Volver a la página de inicio
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;