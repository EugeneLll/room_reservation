from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from api.models import Participant
from api.serializers.participants import UserReservationsSerializer
from api.serializers.users import UserSerializer


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
