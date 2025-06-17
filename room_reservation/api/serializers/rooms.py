from rest_framework import serializers

from api.models import Amenities, Room


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ["id", "address", "room_name", "human_capacity"]


class AmenitiesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenities
        fields = ["id", "name", "amount", "room"]


class OccupiedTimeSerializer(serializers.Serializer):
    start = serializers.DateTimeField()
    end = serializers.DateTimeField()


class RoomOccupiedSerializer(serializers.Serializer):
    room_id = serializers.UUIDField()
    occupied_time = OccupiedTimeSerializer(many=True)
