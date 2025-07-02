import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './app/contexts/AuthContext';

console.log('[index] Iniciando aplicación');

const startTime = performance.now();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);

// Medición de rendimiento opcional
const measureStartup = () => {
  const endTime = performance.now();
  const loadTime = endTime - startTime;
  console.log(`[index] 🕒 Tiempo de inicio: ${loadTime.toFixed(2)} ms`);
};

setTimeout(measureStartup, 0);