from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .models import Room
from .serializers import RoomSerializer


class RoomsViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RoomSerializer
