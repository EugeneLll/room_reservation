from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

from api.models import Participant, Reservation, get_user_model


@shared_task
def send_booking_confirmation(reservation_id, user_id):
    try:
        user = get_user_model().objects.get(id=user_id)
        reservation = Reservation.objects.get(id=reservation_id)
        context = {
            "user": user,
            "room": reservation.room,
            "reservation": reservation,
            "year": timezone.now().year,
            "time": f"""{reservation.start.astimezone("Europe/Moscow").strftime('%H:%M')} - {
                    reservation.end.astimezone("Europe/Moscow").strftime('%H:%M')}""",
        }

        content = render_to_string("confirmation.html", context)

        return send_mail(
            "Room Reservation confirmed",
            from_email=settings.EMAIL_HOST_USER,
            message="",
            html_message=content,
            recipient_list=[user.email],
            fail_silently=False,
        )

    except Exception:
        pass


@shared_task
def send_participant_invitation(participant_id):
    try:
        participant = Participant.objects.select_related(
            "user",
            "reservation",
            "reservation__room",
        ).get(id=participant_id)
        print(participant.user, participant.reservation.room, participant.reservation)

        context = {
            "participant": participant.user,
            "room": participant.reservation.room,
            "reservation": participant.reservation,
            "year": timezone.now().year,
            "time": f"""{participant.reservation.start.astimezone("Europe/Moscow").strftime('%H:%M')} - {
                    participant.reservation.end.astimezone("Europe/Moscow").strftime('%H:%M')}""",
        }

        subject = "Meeting Invitation"
        content = render_to_string("invitation.html", context)
        return send_mail(
            subject,
            from_email=settings.EMAIL_HOST_USER,
            message="",
            html_message=content,
            recipient_list=[participant.user.email],
            fail_silently=False,
        )

    except Exception:
        pass
