import apiClient from "./client";

export const RoomService = {
  getRooms: () => apiClient.get("/api/rooms/"),
  createRoom: (data) => apiClient.post("/api/rooms/", data),
  updateRoom: (roomId, data) => apiClient.put(`/api/rooms/${roomId}/`, data),
  deleteRoom: (roomId) => apiClient.delete(`/api/rooms/${roomId}/`),

  getRoomAmenities: (roomId) =>
    apiClient.get(`/api/rooms/${roomId}/amenities/`),
  createAmenity: (roomId, data) =>
    apiClient.post(`/api/rooms/${roomId}/amenities/`, data),
  updateAmenity: (roomId, amenityId, data) =>
    apiClient.put(`/api/rooms/${roomId}/amenities/${amenityId}/`, data),
  deleteAmenity: (roomId, amenityId) =>
    apiClient.delete(`/api/rooms/${roomId}/amenities/${amenityId}/`),
};
