from django.contrib import admin

from api.models import Participant, Reservation, Room


@admin.register(Room, Reservation, Participant)
class MultipleAdmin(admin.ModelAdmin):
    pass
