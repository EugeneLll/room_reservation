from celery import shared_task

from api.models import Participant, Reservation, get_user_model
from api.services.email import (
    send_booking_confirmation_email,
    send_participant_invitation_email,
)


@shared_task(autoretry_for=(Exception,), retry_kwargs={"max_retries": 3, "countdown": 2})
def send_booking_confirmation(reservation_id, user_id):
    user = get_user_model().objects.get(id=user_id)
    reservation = Reservation.objects.get(id=reservation_id)
    return send_booking_confirmation_email(user, reservation)


@shared_task(autoretry_for=(Exception,), retry_kwargs={"max_retries": 3, "countdown": 2})
def send_participant_invitation(participant_id):
    participant = Participant.objects.select_related(
        "user",
        "reservation",
        "reservation__room",
    ).get(id=participant_id)
    return send_participant_invitation_email(participant)
