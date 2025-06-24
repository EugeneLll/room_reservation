import os

from celery import shared_task
from dotenv import load_dotenv

from api.models import Participant, Reservation, get_user_model
from api.services.email import (
    send_booking_confirmation_email,
    send_participant_invitation_email,
)

load_dotenv()

MAX_RETRIES = int(os.getenv("CELERY_MAX_RETRIES", 3))
COUNTDOWN = int(os.getenv("CELERY_COUNTDOWN", 2))


@shared_task(autoretry_for=(Exception,), retry_kwargs={"max_retries": MAX_RETRIES, "countdown": COUNTDOWN})
def send_booking_confirmation(reservation_id, user_id):
    user = get_user_model().objects.get(id=user_id)
    reservation = Reservation.objects.get(id=reservation_id)
    return send_booking_confirmation_email(user, reservation)


@shared_task(autoretry_for=(Exception,), retry_kwargs={"max_retries": MAX_RETRIES, "countdown": COUNTDOWN})
def send_participant_invitation(participant_id):
    participant = Participant.objects.select_related(
        "user",
        "reservation",
        "reservation__room",
    ).get(id=participant_id)
    return send_participant_invitation_email(participant)
