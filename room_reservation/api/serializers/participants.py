from rest_framework import serializers

from api.models import Participant
from api.serializers.reservations import ReservationsListSerializer
from api.serializers.users import UserSerializer


class ParticipantsSerializer(serializers.ModelSerializer):

    class Meta:
        model = Participant
        fields = ["id", "reservation", "user", "role", "attends"]


class ParticipantsListSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = Participant
        fields = ["id", "reservation", "user", "role", "attends"]


class UserReservationsSerializer(serializers.Serializer):
    reservation = ReservationsListSerializer()
    participant = ParticipantsSerializer()
