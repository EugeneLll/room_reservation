from django.contrib import admin
from django.urls import include, path
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path("admin/", admin.site.urls),
    path("auth/", obtain_auth_token),
    path("rooms/", include("rooms.urls")),
    path("users/", include("users.urls")),
    path("reservations/", include("reservations.urls")),
]
