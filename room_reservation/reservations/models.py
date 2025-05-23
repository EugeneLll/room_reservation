import datetime
import uuid

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models
from rooms.models import Room


class Reservation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    start = models.DateTimeField()
    end = models.DateTimeField()
    title = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"{self.title} in room: {self.room} starts: {self.start} ends: {self.end}"


class Participant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE)
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    role = models.CharField(
        max_length=10,
        choices=[("organizer", "Organizer"), ("attendee", "Attendee")],
        default="attendee",
    )
    attends = models.CharField(
        max_length=10,
        choices=[
            ("pending", "Pending"),
            ("accepted", "Accepted"),
            ("declined", "Declined"),
        ],
        default="pending",
    )

    def __str__(self):
        return f"Participant: {self.user.username} ({self.role}) in {self.reservation.room} ({self.attends})"
