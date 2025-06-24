from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.models import Participant
from api.permissions import IsParticipantOrganizerOrReadOnly
from api.serializers.participants import (
    ParticipantsListSerializer,
    ParticipantsSerializer,
)
from api.tasks import send_participant_invitation
from api.views.base import SplitDetailListSerializerViewSetMixin


class ParticipantsViewSet(SplitDetailListSerializerViewSetMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsParticipantOrganizerOrReadOnly]

    list_serializer = ParticipantsListSerializer
    detail_serialzier = ParticipantsSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        send_participant_invitation.delay(serializer.data.get("id"))
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        reservation = instance.reservation

        if reservation.is_cancelled:
            return Response(
                {"detail": "Cannot modify participants in a cancelled reservation"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if reservation.start <= timezone.now():
            return Response(
                {"detail": "Cannot modify participants after reservation has started"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        organizers = Participant.objects.exclude(id=instance.id).filter(reservation=reservation, role="organizer")

        if not organizers.exists():
            return Response(
                {"detail": "Cannot delete the last organizer in the reservation"},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().destroy(request, *args, **kwargs)

    @action(methods=["PATCH"], detail=True, permission_classes=[IsAuthenticated])
    def change_status(self, request, reservation_id, pk=None):
        instance = self.get_object()
        reservation = instance.reservation

        print(instance.user, request.user)

        if instance.user != request.user:
            return Response(
                {"detail": "Current user doesn't have rights to modify attendance status"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if instance.attends != "pending":
            return Response(
                {"detail": "Cannot modify attendance status, it was already defined"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if reservation.is_cancelled:
            return Response(
                {"detail": "Cannot modify attendance status in a cancelled reservation"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if reservation.start <= timezone.now():
            return Response(
                {"detail": "Cannot modify attendance status after reservation has started"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.data.get("status") not in ["accepted", "declined"]:
            return Response(
                {"status": "Status field has wrong value"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        instance.attends = request.data.get("status")
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(
            {
                "message": "Attendance status modified successfully",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def get_queryset(self):
        reservation_id = self.kwargs.get("reservation_id")
        return Participant.objects.filter(reservation__id=reservation_id)
