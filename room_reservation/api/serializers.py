from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers
from rest_framework.authtoken.models import Token

from .models import Participant, Reservation, Room


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ("id", "username", "email", "password")
        extra_kwargs = {"password": {"write_only": True, "required": True}}

    def create(self, validated_data):
        user = get_user_model().objects.create_user(**validated_data)
        Token.objects.create(user=user)
        return user


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ["id", "address", "room_name", "human_capacity"]


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

        if data.get("start") >= data.get("end"):
            raise serializers.ValidationError({"non_field_errors": "End must occur after start."})

        if timezone.now() > data.get("start"):
            raise serializers.ValidationError({"start": "Start must be after the current time."})

        overlapping = Reservation.objects.filter(room_id=data["room"]).filter(
            Q(start__lt=data.get("end")) & Q(end__gt=data.get("start"))
        )

        if self.instance:
            overlapping.exclude(id=self.instance.id)

        if overlapping.exists():
            raise serializers.ValidationError({"room": "This room is already reserved for this time"})

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
