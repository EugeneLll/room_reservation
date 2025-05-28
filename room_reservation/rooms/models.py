import uuid

from django.db import models


class Room(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    address = models.CharField(max_length=50)
    room_name = models.CharField(max_length=50)
    human_capacity = models.PositiveIntegerField(default=10)

    def __str__(self):
        return f"{self.room_name}, {self.address}, {self.human_capacity}"
