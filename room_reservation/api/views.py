from api.models import Participant, Reservation, Room
from api.serializers import (
    ParticipantsListSerializer,
    ParticipantsSerializer,
    ReservationSerializer,
    ReservationsListSerializer,
    RoomSerializer,
    UserSerializer,
)
from django.contrib.auth import get_user_model
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


class UsersViewSet(viewsets.ModelViewSet):
    queryset = get_user_model().objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserSerializer


class RoomsViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RoomSerializer

    @action(detail=True)
    def reservations(self, request, pk):
        query = Reservation.objects.filter(room_id=pk)
        serializer = ReservationSerializer(instance=query, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ReservationsViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return ReservationsListSerializer
        return ReservationSerializer


class ParticipantsViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return ParticipantsListSerializer
        return ParticipantsSerializer

    def get_queryset(self):
        pk = self.kwargs.get("reservation_id")
        return Participant.objects.filter(reservation_id=pk)
