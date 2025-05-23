from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Participant, Reservation
from .serializers import ParticipantsSerializer, ReservationSerializer


class ReservationsViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()
    permission_classes = [AllowAny]
    serializer_class = ReservationSerializer
    # parts of extended functionality
    # def create(self, request, *args, **kwargs):
    #     serializer = ReservationSerializer(data=request.data)
    #     serializer.is_valid(raise_exception=True)
    #     reservation = serializer.save(user=request.user)
    #     serialized_data = ReservationSerializer(data=reservation)
    #     serialized_data.is_valid()

    #     return Response(serialized_data.data, status=status.HTTP_200_OK)

    # @action(detail=True)
    # def participants(self, request, pk=None):
    #     participants = Participant.objects.filter(reservation_id=pk)
    #     serializer = ParticipantsSerializer(data=participants, many=True)
    #     serializer.is_valid()

    #     return Response(serializer.data, status=status.HTTP_200_OK)
