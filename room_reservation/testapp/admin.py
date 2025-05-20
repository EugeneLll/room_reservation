from django.contrib import admin
from .models import TestExample


@admin.register(TestExample)
class TestExampleAdmin(admin.ModelAdmin):
    list_display = ("id", "test_field_chr", "test_field_int")
