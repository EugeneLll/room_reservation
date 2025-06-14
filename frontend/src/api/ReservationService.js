import apiClient from "./client";

export const ReservationService = {
  getReservations: (params = {}) =>
    apiClient.get("/api/reservations/", { params }),
  createReservation: (data) => apiClient.post("/api/reservations/", data),
  updateReservation: (reservationId, data) =>
    apiClient.put(`/api/reservations/${reservationId}/`, data),
  deleteReservation: (reservationId) =>
    apiClient.patch(`/api/reservations/${reservationId}/cancel/`),

  recoverReservation: (reservationId) =>
    apiClient.patch(`/api/reservations/${reservationId}/recover/`),

  getParticipants: (reservationId) =>
    apiClient.get(`/api/reservations/${reservationId}/participants/`),
  addParticipant: (reservationId, data) =>
    apiClient.post(`/api/reservations/${reservationId}/participants/`, data),
  updateParticipant: (reservationId, participantId, data) =>
    apiClient.put(
      `/api/reservations/${reservationId}/participants/${participantId}/`,
      data
    ),
  deleteParticipant: (reservationId, participantId) =>
    apiClient.delete(
      `/api/reservations/${reservationId}/participants/${participantId}/`
    ),
  modifyAttendance: (reservationId, participantId, data) =>
    apiClient.patch(
      `/api/reservations/${reservationId}/participants/${participantId}/change_status/`,
      data
    ),
};
