import React from 'react';
import { Box } from '@mui/material';
import { useLocation, Outlet } from 'react-router-dom';

const AuthLayout = () => {
  const location = useLocation();
  console.log('[AuthLayout] Renderizando layout para:', location.pathname);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100%',
        bgcolor: 'background.default',
        p: 3,
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1200
      }}
    >
      <Outlet /> {/* Aquí se renderiza el LoginPage u otra ruta hija */}
    </Box>
  );
};

export default AuthLayout;
