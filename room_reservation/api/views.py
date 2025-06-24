from collections import defaultdict
from datetime import timedelta
from uuid import UUID

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import Serializer
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from api.models import Amenities, Participant, Reservation, Room
from api.permissions import (
    IsParticipantOrganizerOrReadOnly,
    IsReservationOrganizerOrReadOnly,
)
from api.serializers import (
    AmenitiesSerializer,
    ParticipantsListSerializer,
    ParticipantsSerializer,
    ReservationSerializer,
    ReservationsListSerializer,
    RoomOccupiedSerializer,
    RoomSerializer,
    UserReservationsSerializer,
    UserSerializer,
)
from api.tasks import send_booking_confirmation, send_participant_invitation


class SplitDetailListSerializerViewSetMixin:
    list_serializer: Serializer | None = None
    detail_serialzier: Serializer | None = None

    def get_serializer_class(self):
        if self.action == "list" and self.list_serializer is not None:
            return self.list_serializer
        elif self.detail_serialzier is not None:
            return self.detail_serialzier
        return super().get_serializer_class()


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            refresh_token = request.data.get("token")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except TokenError as e:
            print(e)
            return Response(status=status.HTTP_400_BAD_REQUEST)


class UsersViewSet(viewsets.ModelViewSet):
    queryset = get_user_model().objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    @action(detail=False, methods=["POST"], permission_classes=[AllowAny])
    def signup(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"message": "User created"},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False)
    def me(self, request):
        serializer = UserSerializer(instance=request.user)
        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"])
    def reservations(self, request):
        invitation = request.query_params.get("type")

        participants = Participant.objects.filter(
            user=request.user,
            reservation__start__gt=timezone.now(),
            reservation__is_cancelled=False,
        )

        if invitation == "invitation":
            participants = participants.filter(attends="pending")

        participants = participants.select_related("reservation")

        data = [{"reservation": participant.reservation, "participant": participant} for participant in participants]

        serializer = UserReservationsSerializer(data, many=True)
        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class RoomsViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = RoomSerializer

    @action(methods=["get"], detail=False)
    def occupied(self, request):
        reservations = Reservation.objects.filter(end__gte=timezone.now(), is_cancelled=False).select_related("room")
        room_reservation = defaultdict(list)
        for reservation in reservations:
            room_reservation[str(reservation.room.id)].append({"start": reservation.start, "end": reservation.end})
        serializer = RoomOccupiedSerializer(
            list(
                map(
                    lambda pair: {"room_id": pair[0], "occupied_time": pair[1]},
                    room_reservation.items(),
                )
            ),
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class AmenitiesViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AmenitiesSerializer

    def get_queryset(self):
        room_id = self.kwargs.get("room_id")
        return Amenities.objects.filter(room_id=room_id)


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


class ParticipantsViewSet(SplitDetailListSerializerViewSetMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsParticipantOrganizerOrReadOnly]

    list_serializer = ParticipantsListSerializer
    detail_serialzier = ParticipantsSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        send_participant_invitation.delay(serializer.data.get("id"))
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        reservation = instance.reservation

        if reservation.is_cancelled:
            return Response(
                {"detail": "Cannot modify participants in a cancelled reservation"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if reservation.start <= timezone.now():
            return Response(
                {"detail": "Cannot modify participants after reservation has started"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        organizers = Participant.objects.exclude(id=instance.id).filter(reservation=reservation, role="organizer")

        if not organizers.exists():
            return Response(
                {"detail": "Cannot delete the last organizer in the reservation"},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().destroy(request, *args, **kwargs)

    @action(methods=["PATCH"], detail=True, permission_classes=[IsAuthenticated])
    def change_status(self, request, reservation_id, pk=None):
        instance = self.get_object()
        reservation = instance.reservation

        if instance.user != request.user:
            return Response(
                {"detail": "Current user doesn't have rights to modify attendance status"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if instance.attends != "pending":
            return Response(
                {"detail": "Cannot modify attendance status, it was already defined"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if reservation.is_cancelled:
            return Response(
                {"detail": "Cannot modify attendance status in a cancelled reservation"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if reservation.start <= timezone.now():
            return Response(
                {"detail": "Cannot modify attendance status after reservation has started"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.data.get("status") not in ["accepted", "declined"]:
            return Response(
                {"status": "Status field has wrong value"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        instance.attends = request.data.get("status")
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(
            {
                "message": "Attendance status modified successfully",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def get_queryset(self):
        reservation_id = self.kwargs.get("reservation_id")
        return Participant.objects.filter(reservation__id=reservation_id)
