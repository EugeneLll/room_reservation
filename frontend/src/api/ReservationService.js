import apiClient from "./client";

export const ReservationService = {
  getReservations: () => apiClient.get("/api/reservations/"),
  createReservation: (data) => apiClient.post("/api/reservations/", data),
  updateReservation: (reservationId, data) =>
    apiClient.put(`/api/reservations/${reservationId}/`, data),
  deleteReservation: (reservationId) =>
    apiClient.delete(`/api/reservations/${reservationId}/`),

  getParticipants: (reservationId) =>
    apiClient.get(`/api/reservations/${reservationId}/participants/`),
  addParticipant: (reservationId, data) =>
    apiClient.post(`/api/reservations/${reservationId}/participants/`, data),
  updateParticipant: (reservationId, participantId, data) =>
    apiClient.put(`/api/reservations/${reservationId}/${participantId}/`, data),
  deleteParticipant: (reservationId, participantId) =>
    apiClient.delete(`/api/reservations/${reservationId}/${participantId}/`),
};
