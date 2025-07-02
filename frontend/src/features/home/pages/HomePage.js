import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Container, Typography, Box, AppBar, Toolbar } from '@mui/material';

const HomePage = () => {
  console.log('[HomePage] Renderizando página de inicio');

  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'flex-end' }}>
          <Button 
            color="inherit" 
            component={Link}
            to="/login"
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
              component={Link}
              to="/login"
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