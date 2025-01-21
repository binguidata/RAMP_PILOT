from django.db import models
from django.contrib.auth.models import Permission, User
from rest_framework.permissions import BasePermission
from django.utils import timezone


# Create your models here.
class Customer(models.Model):
    user = models.OneToOneField(User, related_name='customer', on_delete=models.CASCADE)
    tel = models.CharField(max_length=15)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    role = models.IntegerField()
    created_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.username


class MyPermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        return False
