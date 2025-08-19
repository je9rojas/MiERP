// /frontend/src/app/contexts/AuthContext.js

/**
 * @file [VERSIÓN DE DEPURACIÓN - ENFOQUE SIMPLE] Proveedor de Contexto de Autenticación.
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
    console.log(`[AUTH_CONTEXT_DEBUG] Reducer despachado -> Tipo: ${action.type}`, { payload: action.payload, estadoAnterior: state });
    
    switch (action.type) {
        case 'INITIALIZE':
            return {
                ...state,
                isAuthenticated: !!action.payload.user,
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

    console.log("[AUTH_CONTEXT_DEBUG] AuthProvider RENDERIZADO.");

    useEffect(() => {
        console.log("[AUTH_CONTEXT_DEBUG] 1. useEffect de inicialización INICIADO.");
        let isMounted = true; // Flag para controlar el estado de montaje

        const initializeAuth = async () => {
            console.log("[AUTH_CONTEXT_DEBUG] 2. Función initializeAuth() EJECUTADA.");
            const token = getAuthToken();
            let user = null;

            if (token) {
                try {
                    console.log("[AUTH_CONTEXT_DEBUG] 3. Token encontrado. Llamando a verifyTokenAPI...");
                    user = await verifyTokenAPI(); // No se pasa el AbortSignal aquí
                    console.log("[AUTH_CONTEXT_DEBUG] 4. ÉXITO en verifyTokenAPI. Usuario:", user);
                } catch (error) {
                    console.error("[AUTH_CONTEXT_DEBUG] 4. ERROR en verifyTokenAPI.", error);
                    removeAuthToken(); // Si hay cualquier error, el token es inválido.
                    user = null;
                }
            }
            
            // --- CORRECCIÓN CRÍTICA ---
            // Solo despachar si el componente sigue montado.
            // Esto asegura que la acción INITIALIZE se despache al final de la
            // operación asíncrona, sin importar el resultado, y evita warnings
            // de actualización de estado en un componente desmontado.
            if (isMounted) {
                console.log("[AUTH_CONTEXT_DEBUG] 5. Proceso finalizado. Despachando INITIALIZE.");
                dispatch({ type: 'INITIALIZE', payload: { user } });
            }
        };

        initializeAuth();

        return () => {
            console.log("[AUTH_CONTEXT_DEBUG] 6. Limpieza de useEffect.");
            isMounted = false;
        };
    }, []);

    const login = useCallback(async (credentials) => {
        // ... (la lógica de login no cambia)
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
        // ... (la lógica de logout no cambia)
        removeAuthToken();
        dispatch({ type: 'LOGOUT' });
    }, []);

    const value = useMemo(() => {
        console.log(`[AUTH_CONTEXT_DEBUG] useMemo -> Creando valor. isInitialized: ${state.isInitialized}`);
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