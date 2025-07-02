import React, { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import { useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './app/theme';

function App() {
  const location = useLocation();
  
  useEffect(() => {
    console.log('[App] Cambio de ruta detectado:', location.pathname);
  }, [location.pathname]);
  
  console.log('[App] Renderizando aplicación. Ruta actual:', location.pathname);
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRoutes />
    </ThemeProvider>
  );
}

export default App;