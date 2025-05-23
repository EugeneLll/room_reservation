from reservations.models import Reservation
from reservations.serializers import ReservationSerializer
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Room
from .serializers import RoomSerializer


class RoomsViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RoomSerializer

    @action(detail=True)
    def reservations(self, request, pk):
        query = Reservation.objects.filter(room_id=pk)
        serializer = ReservationSerializer(instance=query, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
