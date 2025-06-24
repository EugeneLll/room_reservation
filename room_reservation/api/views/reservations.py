from datetime import timedelta
from uuid import UUID

from django.db.models import Q
from django.conf import settings
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.models import Participant, Reservation
from api.permissions import IsReservationOrganizerOrReadOnly
from api.serializers.reservations import (
    ReservationSerializer,
    ReservationsListSerializer,
)
from api.tasks import send_booking_confirmation
from api.views.base import SplitDetailListSerializerViewSetMixin


class ReservationsViewSet(
    SplitDetailListSerializerViewSetMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated, IsReservationOrganizerOrReadOnly]

    list_serializer = ReservationsListSerializer
    detail_serialzier = ReservationSerializer

    def get_queryset(self):
        queryset = Reservation.objects.all()
        room = self.request.query_params.get("room")
        status = self.request.query_params.get("status")
        now = timezone.now()

        if room:
            queryset = queryset.filter(room__id=room)
        if status == Reservation.Status.UPCOMING:
            queryset = queryset.filter(Q(start__gte=now) & Q(is_cancelled=False))
        elif status == Reservation.Status.CANCELLED:
            queryset = queryset.filter(Q(start__gte=now) & Q(is_cancelled=True))
        elif status == Reservation.Status.PAST:
            queryset = queryset.filter(Q(end__lt=now) & Q(is_cancelled=False))
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        organized_ids = set(
            Participant.objects.filter(user=request.user, role="organizer", reservation__in=queryset).values_list(
                "reservation_id", flat=True
            )
        )

        serializer = self.get_serializer(queryset, many=True)
        response_data = serializer.data
        for reservation_data in response_data:
            reservation_data["is_organized"] = UUID(reservation_data["id"]) in organized_ids

        return Response(response_data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)

        is_organized = Participant.objects.filter(reservation=instance, user=request.user, role="organizer").exists()

        response_data = serializer.data
        response_data["is_organized"] = is_organized

        return Response(response_data)

    def create(self, request):
        serializer = ReservationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reservation = serializer.save(user=request.user)
        serialized_data = ReservationSerializer(instance=reservation).data
        send_booking_confirmation.delay(reservation.id, request.user.id)
        return Response(
            serialized_data,
            status=status.HTTP_200_OK,
        )

    @action(methods=["PATCH"], detail=True)
    def cancel(self, request, pk=None):
        reservation = self.get_object()

        if reservation.is_cancelled:
            return Response(
                {"detail": "Reservation is already cancelled"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if reservation.start <= timezone.now():
            return Response(
                {"detail": "Cannot cancel a reservation that has already started"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reservation.is_cancelled = True
        reservation.save()

        serializer = self.get_serializer(reservation)
        return Response(
            {"message": "Reservation cancelled successfully", "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["patch"])
    def recover(self, request, pk=None):
        reservation = self.get_object()

        if not reservation.is_cancelled:
            return Response(
                {"detail": "Reservation is not cancelled"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ALLOWED_HOURS = settings.ALLOWED_HOURS

        if reservation.start <= timezone.now() - timedelta(hours=ALLOWED_HOURS):
            return Response(
                {
                    "detail": f"Cannot recover a reservation that has less then {ALLOWED_HOURS} hours till start",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        reservation.is_cancelled = False
        reservation.recovery_date = timezone.now()
        reservation.save()

        serializer = self.get_serializer(reservation)
        return Response(
            {"message": "Reservation cancelled successfully", "data": serializer.data},
            status=status.HTTP_200_OK,
        )
