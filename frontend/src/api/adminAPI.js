// /frontend/src/api/adminAPI.js
import api from './axiosConfig'; // Usamos la instancia de axios ya configurada

export const getUsers = () => {
  return api.get('/users');
};

export const getRoles = () => {
  return api.get('/roles');
};

export const createUser = (userData) => {
  return api.post('/users', userData);
};

export const updateUser = (username, userData) => {
  return api.put(`/users/${username}`, userData);
};

export const deleteUser = (username) => {
  return api.delete(`/users/${username}`);
};