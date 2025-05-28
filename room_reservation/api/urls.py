from api import views
from django.urls import include, path
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework.routers import DefaultRouter

users_router = DefaultRouter()
users_router.register(r"", views.UsersViewSet, basename="users")

rooms_router = DefaultRouter()
rooms_router.register(r"", views.RoomsViewSet, basename="rooms")

reservations_router = DefaultRouter()
reservations_router.register(r"", views.ReservationsViewSet, basename="reservations")

participants_router = DefaultRouter()
participants_router.register(r"", views.ParticipantsViewSet, basename="participants")

urlpatterns = [
    path("auth/", obtain_auth_token),
    path("rooms/", include(rooms_router.urls)),
    path("users/", include(users_router.urls)),
    path("reservations/", include(reservations_router.urls)),
    path(
        "reservations/<str:reservation_id>/participants/",
        include(participants_router.urls),
    ),
]
