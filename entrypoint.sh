#!/bin/bash

echo "Making migrations"

python manage.py migrate

echo "Creationg superuser"

python create_superuser.py

echo "Running the server"

exec python manage.py runserver 0.0.0.0:8000