// /frontend/src/app/contexts/AuthContext.js
// CÓDIGO COMPLETO Y CORREGIDO - LISTO PARA COPIAR Y PEGAR

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { loginAPI, getUserProfile, verifyToken } from '../../api/authAPI';
import { setAuthToken, getAuthToken, removeAuthToken } from '../../utils/auth/auth';

const AuthContext = createContext();

console.log('[AuthContext] Creando contexto de autenticación');

const authReducer = (state, action) => {
  console.log(`[AuthReducer] Action: ${action.type}`, action.payload);
  
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return { 
        ...state, 
        user: action.payload.user, 
        isAuthenticated: true, 
        isLoading: false,
        error: null
      };
    case 'LOGOUT':
      return { 
        ...state, 
        user: null, 
        isAuthenticated: false, 
        isLoading: false 
      };
    case 'LOADING':
      return { ...state, isLoading: true, error: null };
    case 'ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'AUTH_CHECK_COMPLETE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: !!action.payload.isAuthenticated,
        user: action.payload.user || null
      };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  isLoading: true, // Inicia en true para mostrar un loader mientras se verifica el token
  error: null
};

export const AuthProvider = ({ children }) => {
  console.log('[AuthProvider] Inicializando proveedor de autenticación');
  
  const [state, dispatch] = useReducer(authReducer, initialState);

  // --- CORRECCIÓN EN useCallback ---
  // Todas las funciones que usan `dispatch` deben incluirlo en su array de dependencias.
  // Esto asegura que las funciones son estables y no se recrean innecesariamente.
  
  const login = useCallback(async (credentials) => {
    console.log('[AuthProvider] Iniciando proceso de login');
    dispatch({ type: 'LOADING' });
    try {
      const { token, user } = await loginAPI(credentials);
      console.log('[AuthProvider] Login exitoso', { token, user });
      setAuthToken(token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user } });
      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Credenciales incorrectas';
      console.error('[AuthProvider] Error en login:', errorMessage);
      dispatch({ type: 'ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [dispatch]); // <--- Se añade dispatch

  const logout = useCallback(() => {
    console.log('[AuthProvider] Ejecutando logout');
    removeAuthToken();
    dispatch({ type: 'LOGOUT' });
    // No hay necesidad de devolver nada aquí si no se usa
  }, [dispatch]); // <--- Se añade dispatch

  // --- CORRECCIÓN PRINCIPAL EN useEffect ---
  // Este efecto se ejecutará solo UNA VEZ, cuando el componente se monta por primera vez.
  // Es la forma correcta y segura de hacer una verificación de autenticación inicial.
  useEffect(() => {
    const checkAuthStatus = async () => {
        console.log('[AuthProvider] Verificando autenticación inicial');
        dispatch({ type: 'LOADING' });
        
        try {
            const token = getAuthToken();
            if (!token) {
                console.log('[AuthProvider] No hay token - Usuario no autenticado');
                dispatch({ type: 'AUTH_CHECK_COMPLETE', payload: { isAuthenticated: false } });
                return;
            }

            // La verificación de token y perfil es una buena práctica
            await verifyToken(); 
            const user = await getUserProfile();

            console.log('[AuthProvider] Token y perfil válidos. Usuario autenticado.');
            dispatch({ type: 'AUTH_CHECK_COMPLETE', payload: { isAuthenticated: true, user } });

        } catch (error) {
            console.warn('[AuthProvider] Fallo en la verificación de sesión:', error.message);
            removeAuthToken();
            dispatch({ type: 'AUTH_CHECK_COMPLETE', payload: { isAuthenticated: false } });
        }
    };
    
    checkAuthStatus();
  }, [dispatch]); // <-- Depender de 'dispatch' es seguro, ya que nunca cambia.

  // --- Las funciones de ayuda no necesitan 'checkAuth' ---
  const hasRole = useCallback((role) => {
    return state.user?.role === role;
  }, [state.user]);

  const isAdmin = useCallback(() => {
    return ['admin', 'superadmin'].includes(state.user?.role);
  }, [state.user]);

  console.log('[AuthProvider] Renderizando proveedor');
  
  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout,
      // ya no es necesario exportar checkAuth, es un proceso interno del provider
      hasRole,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};