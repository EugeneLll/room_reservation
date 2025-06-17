from collections import defaultdict

from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.models import Amenities, Reservation, Room
from api.serializers.rooms import (
    AmenitiesSerializer,
    RoomOccupiedSerializer,
    RoomSerializer,
)


class RoomsViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = RoomSerializer

    @action(methods=["get"], detail=False)
    def occupied(self, request):
        reservations = Reservation.objects.filter(end__gte=timezone.now(), is_cancelled=False).select_related("room")
        room_reservation = defaultdict(list)
        for reservation in reservations:
            room_reservation[str(reservation.room.id)].append({"start": reservation.start, "end": reservation.end})
        serializer = RoomOccupiedSerializer(
            list(
                map(
                    lambda pair: {"room_id": pair[0], "occupied_time": pair[1]},
                    room_reservation.items(),
                )
            ),
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class AmenitiesViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AmenitiesSerializer

    def get_queryset(self):
        room_id = self.kwargs.get("room_id")
        return Amenities.objects.filter(room_id=room_id)
