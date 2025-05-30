import apiClient from "./client";

export const UserService = {
  getUsers: () => apiClient.get("/api/users/"),
  getUser: (userId) => apiClient.get(`/api/users/${userId}/`),
  createUser: (data) => apiClient.post("/api/users/signup/", data),
  updateUser: (userId, data) => apiClient.put(`/api/users/${userId}/`, data),
  deleteUser: (userId) => apiClient.delete(`/api/users/${userId}/`),

  getCurrentUser: () => apiClient.get("/api/users/me/"),
  getUserReservations: () => apiClient.get("/api/users/reservations/"),
};
