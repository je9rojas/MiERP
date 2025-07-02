import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
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
  isLoading: true,
  error: null
};

export const AuthProvider = ({ children }) => {
  console.log('[AuthProvider] Inicializando proveedor de autenticación');
  
  const [state, dispatch] = useReducer(authReducer, initialState);
  const isMounted = useRef(true);

  useEffect(() => {
    console.log('[AuthProvider] Montando componente');
    return () => {
      console.log('[AuthProvider] Desmontando componente');
      isMounted.current = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    console.log('[AuthProvider] Iniciando proceso de login');
    dispatch({ type: 'LOADING' });
    
    try {
      console.log('[AuthProvider] Llamando a loginAPI');
      const { token, user } = await loginAPI(credentials);
      console.log('[AuthProvider] Login exitoso', { token, user });
      
      setAuthToken(token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user } });
      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                         error.message || 
                         'Credenciales incorrectas';
      
      console.error('[AuthProvider] Error en login:', errorMessage);
      dispatch({ type: 'ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(() => {
    console.log('[AuthProvider] Ejecutando logout');
    removeAuthToken();
    dispatch({ type: 'LOGOUT' });
    return { success: true };
  }, []);

  const checkAuth = useCallback(async () => {
    console.log('[AuthProvider] Verificando autenticación');
    dispatch({ type: 'LOADING' });
    
    try {
      console.log('[AuthProvider] Obteniendo token');
      const token = getAuthToken();
      console.log('[AuthProvider] Token encontrado:', !!token);
      
      if (!token) {
        console.log('[AuthProvider] No hay token - Usuario no autenticado');
        dispatch({ type: 'AUTH_CHECK_COMPLETE', payload: { isAuthenticated: false } });
        return;
      }

      console.log('[AuthProvider] Verificando token con el servidor');
      let tokenValid = false;
      try {
        tokenValid = await verifyToken();
        console.log('[AuthProvider] Token válido:', tokenValid);
      } catch (error) {
        console.warn('[AuthProvider] Error al verificar token:', error.message);
      }

      if (!tokenValid) {
        console.log('[AuthProvider] Token inválido - Limpiando token');
        removeAuthToken();
        dispatch({ type: 'AUTH_CHECK_COMPLETE', payload: { isAuthenticated: false } });
        return;
      }

      console.log('[AuthProvider] Obteniendo perfil de usuario');
      try {
        const user = await getUserProfile();
        console.log('[AuthProvider] Perfil obtenido:', user);
        dispatch({ type: 'AUTH_CHECK_COMPLETE', payload: { isAuthenticated: true, user } });
      } catch (error) {
        console.error('[AuthProvider] Error al obtener perfil:', error.message);
        removeAuthToken();
        dispatch({ type: 'AUTH_CHECK_COMPLETE', payload: { isAuthenticated: false } });
      }
    } catch (error) {
      console.error('[AuthProvider] Error en checkAuth:', error.message);
      removeAuthToken();
      dispatch({ type: 'AUTH_CHECK_COMPLETE', payload: { isAuthenticated: false } });
    }
  }, []);

  useEffect(() => {
    console.log('[AuthProvider] Efecto montaje - Verificando autenticación inicial');
    checkAuth();
  }, [checkAuth]);

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
      checkAuth,
      hasRole,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  console.log('[useAuth] Accediendo al contexto de autenticación');
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};