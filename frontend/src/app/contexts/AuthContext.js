// /frontend/src/app/contexts/AuthContext.js

/**
 * @file [VERSIÓN DE DEPURACIÓN EXHAUSTIVA] Proveedor de Contexto de Autenticación.
 */

// ==============================================================================
// SECCIÓN 1: IMPORTACIONES
// ==============================================================================

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { loginAPI, verifyTokenAPI } from '../../features/auth/api/authAPI';
import { setAuthToken, getAuthToken, removeAuthToken } from '../../utils/auth/auth';
import { formatApiError } from '../../utils/errorUtils';

// ==============================================================================
// SECCIÓN 2: DEFINICIÓN DEL CONTEXTO Y DEL REDUCER
// ==============================================================================

const AuthContext = createContext(null);

const authReducer = (state, action) => {
    // LOG DETALLADO DEL REDUCER
    console.log(`[AUTH_DEBUG] A. REDUCER INVOCADO con acción: ${action.type}`, { payload: action.payload });
    const newState = (() => {
        switch (action.type) {
            case 'INITIALIZE':
                return { ...state, isAuthenticated: !!action.payload.user, user: action.payload.user, isInitialized: true, isLoading: false };
            case 'LOGIN_REQUEST':
                return { ...state, isLoading: true, error: null };
            case 'LOGIN_SUCCESS':
                return { ...state, isAuthenticated: true, user: action.payload.user, isLoading: false, error: null };
            case 'LOGIN_FAILURE':
                return { ...state, isLoading: false, error: action.payload };
            case 'LOGOUT':
                return { ...state, isAuthenticated: false, user: null };
            default:
                return state;
        }
    })();
    console.log(`[AUTH_DEBUG] B. REDUCER TERMINADO. Nuevo estado:`, newState);
    return newState;
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

    console.log("[AUTH_DEBUG] 1. AuthProvider RENDERIZADO. Estado actual:", state);

    useEffect(() => {
        console.log("[AUTH_DEBUG] 2. useEffect de inicialización INICIADO.");
        let isMounted = true;

        const initializeAuth = async () => {
            console.log("[AUTH_DEBUG] 3. Función initializeAuth() EJECUTADA.");
            const token = getAuthToken();
            let user = null;

            if (token) {
                try {
                    console.log("[AUTH_DEBUG] 4. Token encontrado. Llamando a verifyTokenAPI...");
                    user = await verifyTokenAPI();
                    console.log("[AUTH_DEBUG] 5. ÉXITO en verifyTokenAPI. Usuario:", user);
                } catch (error) {
                    console.error("[AUTH_DEBUG] 5. ERROR en verifyTokenAPI.", error);
                    removeAuthToken();
                    user = null;
                }
            } else {
                 console.log("[AUTH_DEBUG] 4. No se encontró token.");
            }
            
            if (isMounted) {
                console.log("[AUTH_DEBUG] 6. Componente montado. Despachando INITIALIZE...");
                dispatch({ type: 'INITIALIZE', payload: { user } });
            } else {
                console.log("[AUTH_DEBUG] 6. Componente DESMONTADO. NO se despacha INITIALIZE.");
            }
        };

        initializeAuth();

        return () => {
            console.log("[AUTH_DEBUG] 7. Limpieza de useEffect. isMounted -> false.");
            isMounted = false;
        };
    }, []);

    const login = useCallback(async (credentials) => {
        dispatch({ type: 'LOGIN_REQUEST' });
        try {
            const { access_token, user } = await loginAPI(credentials);
            setAuthToken(access_token);
            dispatch({ type: 'LOGIN_SUCCESS', payload: { user } });
        } catch (error) {
            const errorMessage = formatApiError(error) || 'Credenciales incorrectas o error de red.';
            dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
            throw new Error(errorMessage);
        }
    }, []);

    const logout = useCallback(() => {
        removeAuthToken();
        dispatch({ type: 'LOGOUT' });
    }, []);

    const value = useMemo(() => {
        console.log(`[AUTH_DEBUG] 8. useMemo recalculado. isInitialized ahora es: ${state.isInitialized}`);
        return { ...state, login, logout };
    }, [state, login, logout]);

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