import api from './axiosConfig';

export const loginAPI = async (credentials) => {
  try {
    // Cambiar a x-www-form-urlencoded que es lo que espera OAuth2PasswordRequestForm
    const params = new URLSearchParams();
    params.append('username', credentials.username);
    params.append('password', credentials.password);

    const response = await api.post('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      validateStatus: (status) => status < 500
    });

    if (!response.data?.access_token) {
      throw new Error(response.data?.detail || 'Credenciales incorrectas');
    }

    return {
      token: response.data.access_token,
      user: response.data.user
    };
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 
                  error.response?.data?.message || 
                  'Error al iniciar sesión');
  }
};

export const registerAPI = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData, {
      validateStatus: (status) => status < 500
    });

    if (!response.data?.access_token) {
      throw new Error(response.data?.detail || 'Error en el registro');
    }

    return {
      token: response.data.access_token,
      user: response.data.user
    };
  } catch (error) {
    const errorMessage = error.response?.data?.detail || 
                       'Error al registrar usuario';
    throw new Error(errorMessage);
  }
};

export const getUserProfile = async () => {
  try {
    const response = await api.get('/auth/profile', {
      validateStatus: (status) => status < 500
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al cargar perfil');
  }
};

export const verifyToken = async () => {
  try {
    const response = await api.get('/auth/verify-token', {
      validateStatus: (status) => status < 500
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};