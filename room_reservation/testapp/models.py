from django.db import models
import uuid


# Create your models here.
class TestExample(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    test_field_chr = models.CharField(max_length=100)
    test_field_int = models.IntegerField(default=111)
