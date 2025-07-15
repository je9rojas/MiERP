// /frontend/src/App.js
// CÓDIGO FINAL, SIMPLIFICADO Y CORRECTO

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline'; // Mantenemos CssBaseline para normalizar estilos
import AppRoutes from './routes/AppRoutes';

function App() {
  // Este hook es útil para la depuración, lo mantenemos.
  const location = useLocation();
  useEffect(() => {
    // Usamos un log más descriptivo
    console.log(`[App] Navegación detectada. Nueva ruta: ${location.pathname}`);
  }, [location]);

  // Este log nos ayuda a ver cuándo se re-renderiza el componente App
  console.log(`[App] Renderizando el componente principal de la aplicación.`);

  return (
    <>
      {/* 
        CssBaseline resetea los estilos del navegador para que Material-UI se vea consistente.
        No necesita estar dentro de un ThemeProvider aquí porque el tema ya fue provisto en index.js.
      */}
      <CssBaseline />
      
      {/* 
        Renderizamos el componente que gestiona todas las rutas de la aplicación.
        Como <App /> está envuelto por AuthProvider en index.js, AppRoutes también lo está.
      */}
      <AppRoutes />
    </>
  );
}

export default App;