from django.urls import include, path
from reservations import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"", views.ReservationsViewSet, basename="rooms")

urlpatterns = [
    path("", include(router.urls)),
]
