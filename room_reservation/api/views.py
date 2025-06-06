from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import Serializer

from api.models import Amenities, Participant, Reservation, Room
from api.serializers import (
    AmenitiesSerializer,
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
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    @action(detail=False, methods=["POST"], permission_classes=[AllowAny])
    def signup(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "User created"},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False)
    def me(self, request):
        serializer = UserSerializer(instance=request.user)
        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    @action(detail=False)
    def reservations(self, request):
        queryset = Reservation.objects.filter(Q(start__gt=timezone.now()) & Q(participant__user=request.user))
        serializer = ReservationsListSerializer(instance=queryset, many=True)
        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class RoomsViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = RoomSerializer


class AmenitiesViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AmenitiesSerializer

    def get_queryset(self):
        room_id = self.kwargs.get("room_id")
        return Amenities.objects.filter(room_id=room_id)


class ReservationsViewSet(SplitDetailListSerializerViewSetMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    list_serializer = ReservationsListSerializer
    detail_serialzier = ReservationSerializer

    def get_queryset(self):
        queryset = Reservation.objects.all()
        room = self.request.query_params.get("room")
        status = self.request.query_params.get("status")

        if room:
            queryset = queryset.filter(room__id=room)
        if status == "upcoming":
            queryset = queryset.filter(start__gte=timezone.now())
        return queryset

    def create(self, request):
        serializer = ReservationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reservation = serializer.save(user=request.user)
        serialized_data = ReservationSerializer(instance=reservation)

        return Response(
            serialized_data.data,
            status=status.HTTP_200_OK,
        )


class ParticipantsViewSet(SplitDetailListSerializerViewSetMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    list_serializer = ParticipantsListSerializer
    detail_serialzier = ParticipantsSerializer

    def get_queryset(self):
        reservation_id = self.kwargs.get("reservation_id")
        return Participant.objects.filter(reservation_id=reservation_id)
