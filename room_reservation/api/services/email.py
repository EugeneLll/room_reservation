from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone


def send_booking_confirmation_email(user, reservation):
    context = {
        "user": user,
        "room": reservation.room,
        "reservation": reservation,
        "year": timezone.now().year,
        "time": f"""{(reservation.start + timedelta(hours=3)).strftime('%H:%M')} - {
                (reservation.end + timedelta(hours=3)).strftime('%H:%M')}""",
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


def send_participant_invitation_email(participant):
    context = {
        "participant": participant.user,
        "room": participant.reservation.room,
        "reservation": participant.reservation,
        "year": timezone.now().year,
        "time": f"""{(participant.reservation.start + timedelta(hours=3)).strftime('%H:%M')} - {
                (participant.reservation.end + timedelta(hours=3)).strftime('%H:%M')}""",
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
