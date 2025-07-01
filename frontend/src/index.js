// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';  // Asegúrate de importar el App.js corregido

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />  {/* Solo este componente, sin routers adicionales */}
  </React.StrictMode>
);