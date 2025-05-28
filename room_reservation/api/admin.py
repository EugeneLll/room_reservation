from api.models import Participant, Reservation, Room
from django.contrib import admin


@admin.register(Room, Reservation, Participant)
class MultipleAdmin(admin.ModelAdmin):
    pass
