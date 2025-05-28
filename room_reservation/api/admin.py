from django.contrib import admin

from .models import Participant, Reservation, Room


@admin.register(Room, Reservation, Participant)
class MultipleAdmin(admin.ModelAdmin):
    pass
