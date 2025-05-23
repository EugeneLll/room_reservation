from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rooms import views

router = DefaultRouter()
router.register(r"", views.RoomsViewSet, basename="rooms")

urlpatterns = [
    path("", include(router.urls)),
]
