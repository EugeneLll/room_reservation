from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers

from api.models import Participant, Reservation
from api.serializers.rooms import RoomSerializer


class ReservationSerializer(serializers.ModelSerializer):

    def create(self, validated_data):
        user = validated_data.pop("user")
        reservation = Reservation(**validated_data)
        reservation.save()
        Participant.objects.create(
            reservation=reservation,
            user=user,
            role="organizer",
            attends="accepted",
        )
        return reservation

    def validate(self, data):

        if data.get("start") >= data.get("end"):
            raise serializers.ValidationError({"non_field_errors": "End must occur after start."})

        if timezone.now() > data.get("start"):
            raise serializers.ValidationError({"start": "Start must be after the current time."})

        overlapping = Reservation.objects.filter(room_id=data.get("room")).filter(
            Q(start__lt=data.get("end")) & Q(end__gt=data.get("start")) & Q(is_cancelled=False)
        )

        if self.instance:
            overlapping = overlapping.exclude(id=self.instance.id)

        if overlapping.exists():
            raise serializers.ValidationError({"room": "This room is already reserved for this time"})

        return data

    class Meta:
        model = Reservation
        fields = ["id", "room", "start", "end", "title", "is_cancelled", "recovery_date"]
        extra_kwargs = {"is_cancelled": {"read_only": True}, "recovery_date": {"read_only": True}}


class ReservationsListSerializer(serializers.ModelSerializer):
    room = RoomSerializer()

    class Meta:
        model = Reservation
        fields = ["id", "room", "start", "end", "title", "is_cancelled", "recovery_date"]
        extra_kwargs = {"is_cancelled": {"read_only": True}, "recovery_date": {"read_only": True}}
