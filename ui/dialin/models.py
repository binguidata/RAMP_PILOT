from django.db import models


# Create your models here.
class DialinUser(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    username = models.CharField(max_length=100)
    cellphone_number = models.CharField(max_length=15)
    email_address = models.EmailField(max_length=254, blank=False, null=False)
    signed_consent = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
