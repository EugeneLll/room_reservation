#!/bin/bash


echo "Making migrations"
python manage.py migrate

echo "Creationg superuser"
python manage.py createsuperuser --noinput

echo "Running the server"
exec python manage.py runserver 0.0.0.0:8000