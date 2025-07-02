// src/features/home/pages/HomePage.js
import React from 'react';
import { Button, Container, Typography, Box, AppBar, Toolbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();
  console.log('[HomePage] Renderizando página de inicio');

  const handleLoginClick = () => {
    console.log('[HomePage] Botón Login clickeado - Navegando a /login');
    navigate('/login');
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'flex-end' }}>
          <Button 
            color="inherit" 
            onClick={handleLoginClick}
            sx={{ fontWeight: 'bold' }}
          >
            Login
          </Button>
        </Toolbar>
      </AppBar>

      
      <Container maxWidth="md">
        <Box textAlign="center" mt={10}>
          <Typography variant="h2" gutterBottom>
            Bienvenido a MiERP
          </Typography>
          
          <Box mt={6} textAlign="left">
            <Typography variant="h4" gutterBottom color="primary">
              Nuestra Misión
            </Typography>
            <Typography variant="body1" paragraph>
              Proporcionar soluciones de software ERP de alta calidad que impulsen la eficiencia 
              y el crecimiento de su empresa mediante herramientas innovadoras y un servicio excepcional.
            </Typography>
          </Box>
          
          <Box mt={4} textAlign="left">
            <Typography variant="h4" gutterBottom color="primary">
              Nuestra Visión
            </Typography>
            <Typography variant="body1" paragraph>
              Ser líderes en la transformación digital de las empresas latinoamericanas, 
              siendo reconocidos por nuestra excelencia técnica y compromiso con el éxito 
              de nuestros clientes.
            </Typography>
          </Box>
          
          <Box mt={6}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={handleLoginClick}
              sx={{ px: 6, py: 2, fontSize: '1.1rem' }}
            >
              Comenzar ahora
            </Button>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default HomePage;