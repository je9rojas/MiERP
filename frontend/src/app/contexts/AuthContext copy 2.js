// /frontend/src/app/contexts/AuthContext.js

/**
 * @file Proveedor de Contexto de Autenticación.
 * Este archivo es el cerebro de la gestión de sesión del usuario. Expone el estado
 * de autenticación (si el usuario está logueado, quién es, etc.) y las funciones
 * para `login` y `logout` a toda la aplicación.
 */

// --- SECCIÓN 1: IMPORTACIONES ---
import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { loginAPI, verifyToken } from '../../features/auth/api/authAPI';
import { setAuthToken, getAuthToken, removeAuthToken } from '../../utils/auth/auth';

// --- SECCIÓN 2: DEFINICIÓN DEL CONTEXTO Y REDUCER ---

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'INITIALIZE':
      return { ...state, isAuthenticated: action.payload.isAuthenticated, user: action.payload.user, isInitialized: true, isLoading: false };
    case 'LOGIN_REQUEST':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.payload.user, isAuthenticated: true, isLoading: false, error: null };
    case 'LOGIN_FAILURE':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null
};


// --- SECCIÓN 3: COMPONENTE PROVEEDOR (PROVIDER) ---

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Efecto de inicialización: Se ejecuta una sola vez cuando la aplicación carga.
   * Su propósito es verificar si existe un token válido en el almacenamiento local
   * y restaurar la sesión del usuario sin que tenga que volver a iniciar sesión.
   */
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[AuthContext] Iniciando inicialización de la sesión...');
      try {
        const token = getAuthToken();
        if (!token) {
          console.log('[AuthContext] No se encontró token. Finalizando como deslogueado.');
          dispatch({ type: 'INITIALIZE', payload: { isAuthenticated: false, user: null } });
          return;
        }

        console.log('[AuthContext] Token encontrado. Llamando a verifyToken para validar y obtener el usuario...');
        // Lógica optimizada: una sola llamada a la API que verifica el token y devuelve el usuario.
        const user = await verifyToken();
        
        console.log('[AuthContext] Usuario obtenido de verifyToken. Finalizando como logueado.', user);
        dispatch({ type: 'INITIALIZE', payload: { isAuthenticated: true, user } });

      } catch (error) {
        console.warn('[AuthContext] La inicialización falló (token inválido o expirado). Limpiando y finalizando como deslogueado.');
        removeAuthToken();
        dispatch({ type: 'INITIALIZE', payload: { isAuthenticated: false, user: null } });
      }
    };
    initializeAuth();
  }, []);

  /**
   * Función de Login: Maneja el proceso de inicio de sesión.
   */
  const login = useCallback(async (credentials) => {
    console.log('[AuthContext] 1. Iniciando proceso de login...');
    dispatch({ type: 'LOGIN_REQUEST' });
    try {
      console.log('[AuthContext] 2. Llamando a loginAPI...');
      const { token, user } = await loginAPI(credentials);
      
      console.log('[AuthContext] 6. loginAPI ha respondido exitosamente. Guardando token...');
      setAuthToken(token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user } });
      console.log('[AuthContext] 7. Login completado.');

    } catch (error) {
      console.error('[AuthContext] 8. Se ha producido un error durante el login.', error);
      const errorMessage = error.message || 'Credenciales incorrectas';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
    }
  }, []);

  /**
   * Función de Logout: Limpia la sesión del usuario.
   */
  const logout = useCallback(() => {
    console.log('[AuthContext] Ejecutando logout...');
    removeAuthToken();
    dispatch({ type: 'LOGOUT' });
  }, []);

  // Se memoriza el valor del contexto para evitar re-renderizados innecesarios.
  const value = useMemo(() => ({ ...state, login, logout }), [state, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


// --- SECCIÓN 4: HOOK PERSONALIZADO ---

/**
 * Hook `useAuth`: Simplifica el acceso al contexto de autenticación desde cualquier
 * componente hijo, asegurando que se utilice dentro de un `AuthProvider`.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};