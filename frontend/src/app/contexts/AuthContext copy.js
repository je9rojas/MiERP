// /frontend/src/app/contexts/AuthContext.js
// CÓDIGO FINAL Y COMPLETO CON LOGGING DETALLADO PARA DEPURACIÓN

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { loginAPI, getUserProfile, verifyToken } from '../../api/authAPI';
import { setAuthToken, getAuthToken, removeAuthToken } from '../../utils/auth/auth';

// 1. Creación del Contexto
const AuthContext = createContext(null);

// 2. Definición del Reducer para manejar la lógica del estado
const authReducer = (state, action) => {
  // Log para ver cada acción que se despacha, muy útil para depurar flujos complejos.
  console.log(`[AuthReducer] Acción recibida: %c${action.type}`, 'color: blue; font-weight: bold;', action.payload || '');

  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        user: action.payload.user,
        isInitialized: true, // Marcamos como inicializado para que los guardianes de ruta dejen de mostrar el loader
        isLoading: false,
      };

    case 'LOGIN_REQUEST':
      // Se activa al iniciar el proceso de login, útil para mostrar spinners en el botón de login
      return { ...state, isLoading: true, error: null };

    case 'LOGIN_SUCCESS':
      // Se activa cuando la API devuelve un token y usuario válidos
      return { ...state, isAuthenticated: true, user: action.payload.user, isLoading: false, error: null };

    case 'LOGIN_FAILURE':
      // Se activa si las credenciales son incorrectas o hay un error de red
      return { ...state, isAuthenticated: false, user: null, error: action.payload, isLoading: false };

    case 'LOGOUT':
      // Limpia el estado al cerrar sesión
      return { ...state, isAuthenticated: false, user: null };

    default:
      // Caso por defecto que devuelve el estado sin cambios si la acción no coincide
      return state;
  }
};

// 3. Estado Inicial de la Aplicación
const initialState = {
  isAuthenticated: false,
  isInitialized: false, // Inicia como 'false' para que la app muestre un loader mientras se verifica la sesión
  isLoading: false,
  user: null,
  error: null,
};


// 4. Componente Provider que envuelve la aplicación
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Efecto para inicializar la sesión al cargar la aplicación por primera vez
  useEffect(() => {
    const initializeAuth = async () => {
      // console.groupCollapsed agrupa los logs para mantener la consola limpia
      console.groupCollapsed('%c[AuthContext] 🚀 Proceso de Inicialización de Sesión', 'color: purple; font-weight: bold;');
      
      try {
        const token = getAuthToken();
        console.log(`Paso 1: Buscando token en almacenamiento... Encontrado: ${token ? '✅ Sí' : '❌ No'}`);

        if (!token) {
          // Si no hay token, la inicialización termina rápido. El usuario no está logueado.
          dispatch({ type: 'INITIALIZE', payload: { isAuthenticated: false, user: null } });
          console.log('Paso 2: Finalizado. No hay token, sesión no iniciada.');
          console.groupEnd(); // Cierra el grupo de logs
          return;
        }

        console.log('Paso 2: Token encontrado. Verificando validez con el endpoint /verify-token...');
        await verifyToken();
        console.log('Paso 3: Verificación de token exitosa. ✅');

        console.log('Paso 4: Obteniendo perfil de usuario con el endpoint /profile...');
        const user = await getUserProfile();
        console.log('Paso 5: Perfil de usuario obtenido exitosamente. ✅', user);
        
        // Si todo va bien, inicializamos con el usuario autenticado.
        dispatch({ type: 'INITIALIZE', payload: { isAuthenticated: true, user } });
        console.log('Paso 6: Inicialización completada. Usuario autenticado.');
        
      } catch (error) {
        // Si cualquier paso del `try` falla (ej. token expirado), se ejecuta este bloque.
        console.error('Paso X: Ocurrió un error durante la inicialización. Esto es normal si el token ha expirado.', error.response?.data || error.message);
        console.log('Limpiando token inválido y finalizando como sesión no iniciada.');
        removeAuthToken();
        dispatch({ type: 'INITIALIZE', payload: { isAuthenticated: false, user: null } });
      } finally {
        // Se asegura de que el grupo de logs siempre se cierre.
        console.groupEnd();
      }
    };

    initializeAuth();
  }, []); // El array vacío [] asegura que este efecto se ejecute solo una vez.

  // Función de Login, envuelta en useCallback para optimización
  const login = useCallback(async (credentials) => {
    console.groupCollapsed('%c[AuthContext] 🔑 Proceso de Login', 'color: green; font-weight: bold;');
    dispatch({ type: 'LOGIN_REQUEST' });
    
    try {
      console.log('Paso 1: Enviando credenciales a la API para el usuario:', credentials.username);
      const { token, user } = await loginAPI(credentials);
      console.log('Paso 2: Respuesta exitosa de la API. ✅', { user });
      
      console.log('Paso 3: Guardando token en almacenamiento local.');
      setAuthToken(token);
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user } });
      console.log('Paso 4: Login completado. Estado de la aplicación actualizado.');
      console.groupEnd();
      return true; // Devuelve 'true' para que el formulario sepa que puede redirigir

    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Credenciales incorrectas';
      console.error('Paso X: Ocurrió un error durante el login.', errorMessage);
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      console.groupEnd();
      return false; // Devuelve 'false' para que el formulario sepa que NO debe redirigir
    }
  }, []);

  // Función de Logout
  const logout = useCallback(() => {
    console.groupCollapsed('%c[AuthContext] 🚪 Proceso de Logout', 'color: red; font-weight: bold;');
    console.log('Paso 1: Eliminando token del almacenamiento.');
    removeAuthToken();
    dispatch({ type: 'LOGOUT' });
    console.log('Paso 2: Logout completado. Estado de la aplicación limpiado.');
    console.groupEnd();
  }, []);

  // useMemo para optimizar y no recrear el objeto 'value' innecesariamente en cada render
  const value = useMemo(() => ({
    ...state,
    login,
    logout,
  }), [state, login, logout]);

  // El Provider pone el 'value' a disposición de todos los componentes hijos
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 5. Hook Personalizado para facilitar el uso del contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    // Este error previene que el hook se use fuera del Provider, un error común.
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};