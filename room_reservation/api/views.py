from django.contrib.auth import get_user_model
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.serializers import Serializer

from api.models import Participant, Reservation, Room
from api.serializers import (
    ParticipantsListSerializer,
    ParticipantsSerializer,
    ReservationSerializer,
    ReservationsListSerializer,
    RoomSerializer,
    UserSerializer,
)


class SplitDetailListSerializerViewSetMixin:
    list_serializer: Serializer | None = None
    detail_serialzier: Serializer | None = None

    def get_serializer_class(self):
        if self.action == "list" and self.list_serializer is not None:
            return self.list_serializer
        elif self.detail_serialzier is not None:
            return self.detail_serialzier
        return super().get_serializer_class()


class UsersViewSet(viewsets.ModelViewSet):
    queryset = get_user_model().objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserSerializer

    @action(detail=False, methods=["POST"], permission_classes=[AllowAny])
    def signup(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "User created"}, status=status.HTTP_201_CREATED)

    @action(detail=False)
    def me(self, request):
        serializer = UserSerializer(instance=request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RoomsViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RoomSerializer

    @action(detail=True)
    def reservations(self, request, pk):
        query = Reservation.objects.filter(room_id=pk)
        serializer = ReservationSerializer(instance=query, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ReservationsViewSet(SplitDetailListSerializerViewSetMixin, viewsets.ModelViewSet):
    queryset = Reservation.objects.all()
    permission_classes = [AllowAny]
    list_serializer = ReservationsListSerializer
    detail_serialzier = ReservationSerializer


class ParticipantsViewSet(SplitDetailListSerializerViewSetMixin, viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    list_serializer = ParticipantsListSerializer
    detail_serialzier = ParticipantsSerializer

    def get_queryset(self):
        pk = self.kwargs.get("reservation_id")
        return Participant.objects.filter(reservation_id=pk)
