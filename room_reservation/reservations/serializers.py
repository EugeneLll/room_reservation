from django.utils import timezone
from rest_framework import serializers
from rest_framework.fields import CurrentUserDefault
from rooms.serializers import RoomSerializer
from users.serializers import UserSerializer

from .models import Participant, Reservation


class ReservationSerializer(serializers.ModelSerializer):

    def create(self, validated_data):
        # user = validated_data.pop("user")
        reservation = Reservation(**validated_data)
        reservation.save()
        # Participant.objects.create(
        #     reservation=reservation,
        #     user=user,
        #     role="organizer",
        #     attends="accepted",
        # )
        return reservation

    def validate(self, data):

        if data["start"] > data["end"]:
            raise serializers.ValidationError("end must occur after start", "start_before_end")
        if timezone.now() > data["start"]:
            raise serializers.ValidationError("start must be after now", "start_before_now")
        return data

    class Meta:
        model = Reservation
        fields = ["id", "room", "start", "end", "title"]


class ReservationsListSerializer(serializers.ModelSerializer):
    room = RoomSerializer()

    class Meta:
        model = Reservation
        fields = ["id", "room", "start", "end", "title"]


class ParticipantsSerializer(serializers.ModelSerializer):

    class Meta:
        model = Participant
        fields = ["id", "reservation", "user", "role", "attends"]


class ParticipantsListSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = Participant
        fields = ["id", "reservation", "user", "role", "attends"]
