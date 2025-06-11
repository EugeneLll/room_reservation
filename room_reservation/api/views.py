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
    MeSerializer,
    ParticipantsListSerializer,
    ParticipantsSerializer,
    ReservationSerializer,
    ReservationsListSerializer,
    RoomSerializer,
    UserReservationsSerializer,
    UserSerializer,
)


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
        reservations = (
            Reservation.objects.filter(
                Q(start__gt=timezone.now())
                & Q(participants__user=request.user)
                & Q(participants__role="organizer")
                & Q(is_cancelled=False)
            )
            .all()
            .values_list("id", flat=True)
        )
        serializer = MeSerializer({"user": request.user, "organized_reservations": reservations})
        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"])
    def reservations(self, request):
        participants = Participant.objects.filter(
            user=request.user,
            reservation__start__gt=timezone.now(),
            reservation__is_cancelled=False,
        ).select_related("reservation")
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

        if room:
            queryset = queryset.filter(room__id=room)
        if status == "upcoming":
            queryset = queryset.filter(Q(start__gte=timezone.now()) & Q(is_cancelled=False))
        elif status == "cancelled":
            queryset = queryset.filter(is_cancelled=True)
        return queryset

    def create(self, request):
        serializer = ReservationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reservation = serializer.save(user=request.user)
        serialized_data = ReservationSerializer(instance=reservation).data

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


class ParticipantsViewSet(SplitDetailListSerializerViewSetMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsParticipantOrganizerOrReadOnly]
    list_serializer = ParticipantsListSerializer
    detail_serialzier = ParticipantsSerializer

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

        print(instance.user, request.user)

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
