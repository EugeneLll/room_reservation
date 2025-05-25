import apiClient from './client';

export const UserService = {
  getUsers: () => apiClient.get('/api/users/'),
  getUser: (userId) => apiClient.get(`/api/users/${userId}/`),
  createUser: (data) => apiClient.post('/api/users/', data),
  updateUser: (userId, data) => apiClient.put(`/api/users/${userId}/`, data),
  deleteUser: (userId) => apiClient.delete(`/api/users/${userId}/`),
};
