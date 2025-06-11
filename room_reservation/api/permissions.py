from rest_framework import permissions

from api.models import Participant


class IsReservationOrganizerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.participants.filter(user=request.user, role="organizer").exists()


class IsParticipantOrganizerOrReadOnly(permissions.BasePermission):

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        reservation_id = view.kwargs.get("reservation_id")
        if not reservation_id:
            return False

        return Participant.objects.filter(reservation_id=reservation_id, user=request.user, role="organizer").exists()
