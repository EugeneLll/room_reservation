import django
import os
from dotenv import load_dotenv
from django.contrib.auth import get_user_model

load_dotenv()

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "room_reservation.settings")
django.setup()

User = get_user_model()

password = os.getenv("DJANGO_SUPERUSER_PASSWORD", "12345678")
username = os.getenv("DJANGO_SUPERUSER_USERNAME", "igor")
email = os.getenv("DJANGO_SUPERUSER_EMAIL", "default@admin.com")

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username=username, email=email, password=password)
    print("superuser created")
