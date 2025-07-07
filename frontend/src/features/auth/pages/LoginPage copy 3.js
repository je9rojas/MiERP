// /frontend/src/features/auth/pages/LoginPage.js
// CÓDIGO COMPLETO Y CORREGIDO FINAL - LISTO PARA COPIAR Y PEGAR

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../app/contexts/AuthContext';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import LockIcon from '@mui/icons-material/Lock';
import InputAdornment from '@mui/material/InputAdornment';
import PersonIcon from '@mui/icons-material/Person';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const { login, isLoading, error, isAuthenticated } = useAuth(); 
  const navigate = useNavigate();
  const location = useLocation();

  // --- useEffect DE REDIRECCIÓN REINTRODUCIDO DE FORMA SEGURA ---
  // Este efecto se dispara cada vez que `isAuthenticated` cambia.
  useEffect(() => {
    // Si el usuario se autentica (isAuthenticated se vuelve true)...
    if (isAuthenticated) {
      // ...lo redirigimos.
      // `location.state?.from?.pathname` intenta devolver al usuario a la página
      // que intentó visitar antes de ser redirigido al login.
      // Si no hay una ruta previa, lo manda al dashboard por defecto.
      const from = location.state?.from?.pathname || '/dashboard';
      console.log(`[LoginPage] Usuario ya autenticado. Redirigiendo a: ${from}`);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    setErrors(prev => {
      const newErrors = { ...prev };
      if (value.trim() === '') {
        newErrors[name] = 'Este campo es requerido';
      } else {
        delete newErrors[name];
      }
      return newErrors;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!credentials.username.trim()) newErrors.username = 'Usuario es requerido';
    if (!credentials.password.trim()) newErrors.password = 'Contraseña es requerida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    
    // Llamamos a login. El useEffect de arriba se encargará de la redirección
    // cuando el estado `isAuthenticated` cambie a true en el contexto.
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
          maxWidth: 450, width: '100%', p: 4, boxShadow: 3, borderRadius: 4,
          backgroundColor: 'background.paper', position: 'relative', overflow: 'hidden',
          '&:before': {
            content: '""', position: 'absolute', top: 0, left: 0, right: 0,
            height: 4, background: 'linear-gradient(90deg, #4b6cb7 0%, #182848 100%)', zIndex: 1
          }
        }}
      >
        <Box textAlign="center" mb={4}>
          <LockIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2, bgcolor: 'rgba(75, 108, 183, 0.1)', p: 2, borderRadius: '50%' }} />
          <Typography 
            variant="h4" component="h1" gutterBottom
            sx={{ 
              fontWeight: 'bold', letterSpacing: 1,
              background: 'linear-gradient(90deg, #4b6cb7 0%, #182848 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}
          >
            Acceso al Sistema
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Ingrese sus credenciales para acceder a su cuenta
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3, fontWeight: 'medium', fontSize: '0.9rem' }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ '& .MuiTextField-root': { mb: 2, backgroundColor: 'background.default', borderRadius: 1 } }}>
          <TextField
            name="username" label="Usuario" variant="outlined" fullWidth
            value={credentials.username} onChange={handleInputChange}
            error={!!errors.username} helperText={errors.username} required disabled={isLoading}
            InputProps={{
              startAdornment: ( <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment> ),
              inputProps: { maxLength: 50, 'data-testid': 'username-input' }
            }}
          />
          <TextField
            name="password" label="Contraseña" type="password" variant="outlined" fullWidth
            value={credentials.password} onChange={handleInputChange}
            error={!!errors.password} helperText={errors.password} required disabled={isLoading}
            InputProps={{ inputProps: { maxLength: 100, 'data-testid': 'password-input' } }}
          />
          <Button
            type="submit" variant="contained" fullWidth size="large"
            sx={{ 
              mt: 1, py: 1.5, fontWeight: 'bold', fontSize: '1.1rem', boxShadow: 2, borderRadius: 2,
              background: 'linear-gradient(90deg, #4b6cb7 0%, #182848 100%)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }
            }}
            disabled={isLoading} data-testid="login-button"
          >
            {isLoading ? ( <CircularProgress size={24} color="inherit" /> ) : ( 'Ingresar al Sistema' )}
          </Button>
        </Box>
        
        <Box mt={3} textAlign="center">
          <Button variant="text" color="primary" onClick={() => navigate('/')} sx={{ fontWeight: 'bold' }}>
            ← Volver al inicio
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;