from django.db import models

from account.models import Customer
# from reservation.models import Shuttle, ServiceArea


# Create your models here.
class ShuttleLocation(models.Model):
    customer = models.ForeignKey(Customer, related_name='shuttleDriver', on_delete=models.PROTECT)
    timeStamp = models.DateTimeField()
    latitude = models.DecimalField(max_digits=12, decimal_places=9)
    longitude = models.DecimalField(max_digits=12, decimal_places=9)
    createdAt = models.DateTimeField(auto_now_add=True)


class ShuttleRoute(models.Model):
    shuttleName = models.TextField(default="ghost shuttle")
    date = models.DateField(null=False)
    routeList = models.TextField(null=True)


class ShuttleDriverLogin(models.Model):
    customer = models.ForeignKey(Customer, related_name='shuttleDriverLogIn', on_delete=models.PROTECT)
    name = models.CharField(max_length=100)
    datetimestamp = models.DateTimeField()
    latitude = models.DecimalField(max_digits=12, decimal_places=9)
    longitude = models.DecimalField(max_digits=12, decimal_places=9)
    shuttle_id = models.CharField(max_length=2)
    plate_number = models.CharField(max_length=10, default='ghostno')
