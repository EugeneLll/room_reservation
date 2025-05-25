from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Participant, Reservation
from .serializers import (
    ParticipantsListSerializer,
    ParticipantsSerializer,
    ReservationSerializer,
    ReservationsListSerializer,
)


class ReservationsViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return ReservationsListSerializer
        return ReservationSerializer

    # parts of extended functionality
    # def create(self, request, *args, **kwargs):
    #     serializer = ReservationSerializer(data=request.data)
    #     serializer.is_valid(raise_exception=True)
    #     reservation = serializer.save(user=request.user)
    #     serialized_data = ReservationSerializer(instance=reservation)

    #     return Response(serialized_data.data, status=status.HTTP_200_OK)


class ParticipantsViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return ParticipantsListSerializer
        return ParticipantsSerializer

    def get_queryset(self):
        pk = self.kwargs.get("reservation_id")
        return Participant.objects.filter(reservation_id=pk)
