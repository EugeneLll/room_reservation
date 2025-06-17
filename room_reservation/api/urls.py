from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from api.views import participants, reservations, rooms, users

users_router = DefaultRouter()
users_router.register(r"", users.UsersViewSet, basename="users")

rooms_router = DefaultRouter()
rooms_router.register(r"", rooms.RoomsViewSet, basename="rooms")

reservations_router = DefaultRouter()
reservations_router.register(r"", reservations.ReservationsViewSet, basename="reservations")

participants_router = DefaultRouter()
participants_router.register(r"", participants.ParticipantsViewSet, basename="participants")

amenities_router = DefaultRouter()
amenities_router.register(r"", rooms.AmenitiesViewSet, basename="amenities")

urlpatterns = [
    path(
        "token/",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),
    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path(
        "token/logout/",
        users.LogoutView.as_view(),
        name="logout",
    ),
    path(
        "rooms/",
        include(rooms_router.urls),
        name="rooms_list",
    ),
    path(
        "rooms/<str:room_id>/amenities/",
        include(amenities_router.urls),
        name="amenities_for_the_room",
    ),
    path(
        "users/",
        include(users_router.urls),
        name="users",
    ),
    path(
        "reservations/",
        include(reservations_router.urls),
        name="reservations",
    ),
    path(
        "reservations/<str:reservation_id>/participants/",
        include(participants_router.urls),
        name="participants_for_reservation",
    ),
]
