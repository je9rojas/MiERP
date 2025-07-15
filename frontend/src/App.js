// /frontend/src/App.js
// COMPONENTE RAÍZ Y CONTENEDOR PRINCIPAL DE LA APLICACIÓN

import React from 'react';
import { CssBaseline } from '@mui/material';
import AppRoutes from './routes/AppRoutes';

/**
 * El componente App es el contenedor más alto de la lógica de la UI.
 * Su única responsabilidad es establecer estilos base consistentes para toda la aplicación
 * (a través de CssBaseline) y renderizar el componente que gestiona todas las rutas.
 * No contiene lógica de negocio.
 */
function App() {
  return (
    <>
      <CssBaseline />
      <AppRoutes />
    </>
  );
}

export default App;