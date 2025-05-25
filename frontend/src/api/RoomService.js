import apiClient from './client';

export const RoomService = {
  getRooms: () => apiClient.get('/api/rooms/'),
  createRoom: (data) => apiClient.post('/api/rooms/', data),
  updateRoom: (roomId, data) => apiClient.put(`/api/rooms/${roomId}/`, data),
  deleteRoom: (roomId) => apiClient.delete(`/api/rooms/${roomId}/`),
};
