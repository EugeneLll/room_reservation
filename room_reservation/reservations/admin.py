from django.contrib import admin

from .models import Participant, Reservation


@admin.register(Reservation, Participant)
class ReservationsAdmin(admin.ModelAdmin):
    pass
