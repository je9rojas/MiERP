import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/contexts/AuthContext';
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  CircularProgress,
  Alert
} from '@mui/material';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirigir si ya está autenticado (al cargar la página)
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await login({ username, password });
      
      if (result.success) {
        // La redirección ahora se maneja en el efecto anterior
        console.log('Login exitoso. Redirigiendo a dashboard...');
      } else if (result.error) {
        console.error('Error en login:', result.error);
      }
    } catch (err) {
      console.error('Error inesperado:', err);
    }
  };

  return (
    <Box sx={{ 
      maxWidth: 400, 
      mx: 'auto', 
      mt: 8,
      p: 3,
      boxShadow: 3,
      borderRadius: 2,
      backgroundColor: 'background.paper'
    }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom 
        align="center"
        sx={{ 
          color: 'primary.main', 
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: 1
        }}
      >
        MiERP - Login
      </Typography>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            textAlign: 'center',
            fontWeight: 'medium',
            fontSize: '0.9rem'
          }}
        >
          {error}
        </Alert>
      )}

      <Box 
        component="form" 
        onSubmit={handleSubmit} 
        sx={{ 
          mt: 2,
          '& .MuiTextField-root': {
            backgroundColor: 'background.default',
            borderRadius: 1
          }
        }}
      >
        <TextField
          label="Usuario"
          variant="outlined"
          fullWidth
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={isLoading}
          inputProps={{ 
            maxLength: 50,
            'data-testid': 'username-input' 
          }}
        />
        
        <TextField
          label="Contraseña"
          type="password"
          variant="outlined"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          inputProps={{ 
            maxLength: 100,
            'data-testid': 'password-input' 
          }}
        />
        
        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          sx={{ 
            mt: 3,
            py: 1.5,
            fontWeight: 'bold',
            fontSize: '1.1rem',
            boxShadow: 2,
            '&:hover': {
              transform: 'translateY(-2px)',
              transition: 'transform 0.2s',
              boxShadow: 3
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
      </Box>
    </Box>
  );
};

export default LoginPage;