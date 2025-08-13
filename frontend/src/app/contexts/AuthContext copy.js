// /frontend/src/app/contexts/AuthContext.js

/**
 * @file Proveedor de Contexto de Autenticación.
 *
 * Este archivo es el cerebro de la gestión de sesión del usuario. Expone el estado
 * de autenticación (si el usuario está logueado, quién es, su rol, etc.) y las
 * funciones para `login` y `logout` a toda la aplicación. Está diseñado para ser
 * robusto y compatible con el `StrictMode` de React 18.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { loginAPI, verifyTokenAPI } from '../../features/auth/api/authAPI';
import { setAuthToken, getAuthToken, removeAuthToken } from '../../utils/auth/auth';

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DEL CONTEXTO Y DEL REDUCER
// ==============================================================================

const AuthContext = createContext(null);

const authReducer = (state, action) => {
    switch (action.type) {
        case 'INITIALIZE':
            return {
                ...state,
                isAuthenticated: action.payload.isAuthenticated,
                user: action.payload.user,
                isInitialized: true,
                isLoading: false,
            };
        case 'LOGIN_REQUEST':
            return { ...state, isLoading: true, error: null };
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                isAuthenticated: true,
                user: action.payload.user,
                isLoading: false,
                error: null,
            };
        case 'LOGIN_FAILURE':
            return { ...state, isLoading: false, error: action.payload };
        case 'LOGOUT':
            return {
                ...state,
                isAuthenticated: false,
                user: null,
                isInitialized: true, // El logout también es un estado inicializado
            };
        default:
            return state;
    }
};

const initialState = {
    isAuthenticated: false,
    isInitialized: false,
    isLoading: false,
    user: null,
    error: null,
};

// ==============================================================================
// SECCIÓN 3: COMPONENTE PROVEEDOR (PROVIDER)
// ==============================================================================

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        const controller = new AbortController();

        const initializeAuth = async () => {
            const token = getAuthToken();
            if (!token) {
                dispatch({ type: 'INITIALIZE', payload: { isAuthenticated: false, user: null } });
                return;
            }

            try {
                const user = await verifyTokenAPI(controller.signal);
                dispatch({ type: 'INITIALIZE', payload: { isAuthenticated: true, user } });
            } catch (error) {
                if (error.name === 'CanceledError') {
                    // Este error es esperado cuando el componente se desmonta en StrictMode.
                    // No se realiza ninguna acción de estado, ya que una nueva inicialización está en camino.
                    return;
                }
                // Para cualquier otro error (ej. 401 Unauthorized), se limpia la sesión.
                removeAuthToken();
                dispatch({ type: 'INITIALIZE', payload: { isAuthenticated: false, user: null } });
            }
        };

        initializeAuth();

        // Esta función de limpieza se ejecuta cuando el componente se desmonta.
        return () => {
            controller.abort();
        };
    }, []);

    const login = useCallback(async (credentials) => {
        dispatch({ type: 'LOGIN_REQUEST' });
        try {
            const { access_token, user } = await loginAPI(credentials);
            setAuthToken(access_token);
            dispatch({ type: 'LOGIN_SUCCESS', payload: { user } });
        } catch (error) {
            const errorMessage = error.message || 'Credenciales incorrectas o error de red.';
            dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
            // Se relanza el error para que el componente del formulario pueda atraparlo también.
            throw new Error(errorMessage);
        }
    }, []);

    const logout = useCallback(() => {
        removeAuthToken();
        dispatch({ type: 'LOGOUT' });
    }, []);

    const value = useMemo(() => ({
        ...state,
        login,
        logout,
    }), [state, login, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// ==============================================================================
// SECCIÓN 4: HOOK PERSONALIZADO
// ==============================================================================

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
    }
    return context;
};