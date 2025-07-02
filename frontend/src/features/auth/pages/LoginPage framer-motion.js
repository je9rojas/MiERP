import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { motion } from 'framer-motion';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({ 
    username: '', 
    password: '' 
  });
  const [errors, setErrors] = useState({});
  const { login, isLoading, error, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Manejo optimizado de cambios en inputs
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    
    // Validación en tiempo real
    if (value.trim() === '') {
      setErrors(prev => ({ ...prev, [name]: 'Este campo es requerido' }));
    } else {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!credentials.username.trim()) newErrors.username = 'Usuario es requerido';
    if (!credentials.password.trim()) newErrors.password = 'Contraseña es requerida';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const result = await login(credentials);
      if (result.success) {
        console.log('Login exitoso. Redirigiendo a dashboard...');
      }
    } catch (err) {
      console.error('Error inesperado:', err);
    }
  };

  // Animaciones
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '16px'
      }}
    >
      <Box 
        sx={{ 
          maxWidth: 450,
          width: '100%',
          p: 4,
          boxShadow: 3,
          borderRadius: 4,
          backgroundColor: 'background.paper',
          position: 'relative',
          overflow: 'hidden',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #4b6cb7 0%, #182848 100%)',
            zIndex: 1
          }
        }}
      >
        <Box textAlign="center" mb={4}>
          <LockIcon 
            sx={{ 
              fontSize: 64, 
              color: 'primary.main',
              mb: 2,
              bgcolor: 'rgba(75, 108, 183, 0.1)',
              p: 2,
              borderRadius: '50%'
            }} 
          />
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              letterSpacing: 1,
              background: 'linear-gradient(90deg, #4b6cb7 0%, #182848 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Acceso al Sistema
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Ingrese sus credenciales para acceder a su cuenta
          </Typography>
        </Box>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                fontWeight: 'medium',
                fontSize: '0.9rem'
              }}
            >
              {error}
            </Alert>
          </motion.div>
        )}

        <Box 
          component="form" 
          onSubmit={handleSubmit}
          sx={{ 
            '& .MuiTextField-root': {
              mb: 2,
              backgroundColor: 'background.default',
              borderRadius: 1
            }
          }}
        >
          <TextField
            name="username"
            label="Usuario"
            variant="outlined"
            fullWidth
            value={credentials.username}
            onChange={handleInputChange}
            error={!!errors.username}
            helperText={errors.username}
            required
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="primary" />
                </InputAdornment>
              ),
              inputProps: { 
                maxLength: 50,
                'data-testid': 'username-input' 
              }
            }}
          />
          
          <TextField
            name="password"
            label="Contraseña"
            type="password"
            variant="outlined"
            fullWidth
            value={credentials.password}
            onChange={handleInputChange}
            error={!!errors.password}
            helperText={errors.password}
            required
            disabled={isLoading}
            InputProps={{
              inputProps: { 
                maxLength: 100,
                'data-testid': 'password-input' 
              }
            }}
          />
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{ 
                mt: 1,
                py: 1.5,
                fontWeight: 'bold',
                fontSize: '1.1rem',
                boxShadow: 2,
                borderRadius: 2,
                background: 'linear-gradient(90deg, #4b6cb7 0%, #182848 100%)',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)'
                }
              }}
              disabled={isLoading}
              data-testid="login-button"
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Ingresar al Sistema'
              )}
            </Button>
          </motion.div>
        </Box>
        
        <Box mt={3} textAlign="center">
          <Button 
            variant="text" 
            color="primary"
            onClick={() => navigate('/')}
            sx={{ fontWeight: 'bold' }}
          >
            ← Volver al inicio
          </Button>
        </Box>
      </Box>
    </motion.div>
  );
};

export default LoginPage;