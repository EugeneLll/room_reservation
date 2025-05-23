from django.urls import include, path
from reservations import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"", views.ReservationsViewSet, basename="rooms")

participants_router = DefaultRouter()
participants_router.register(r"", views.ParticipantsViewSet, basename="participants")

urlpatterns = [
    path("", include(router.urls)),
    path("<str:reservation_id>/participants/", include(participants_router.urls)),
]
