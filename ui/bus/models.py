from django.db import models

from account.models import Customer


# Create your models here.
class OnBoardRecords(models.Model):
    customer = models.ForeignKey(Customer, related_name='busDriver', on_delete=models.PROTECT)
    timeStamp = models.DateTimeField(auto_now_add=True)
    onboard_count = models.PositiveIntegerField()
    offboard_count = models.PositiveIntegerField()
    bus_number = models.CharField(max_length=10)
    latitude = models.DecimalField(max_digits=12, decimal_places=9)
    longitude = models.DecimalField(max_digits=12, decimal_places=9)


# this table is being used to store the location of the bus.
class BusLocations(models.Model):
    customer = models.ForeignKey(Customer, related_name='busDriverLocation', on_delete=models.PROTECT)
    bus_number = models.CharField(max_length=10) # for now this is a simple field but need to come up with the data base of buses also.
    latitude = models.DecimalField(max_digits=12, decimal_places=9)
    longitude = models.DecimalField(max_digits=12, decimal_places=9)
    timeStamp = models.DateTimeField(auto_now_add=True)
    createdAt = models.DateTimeField(auto_now_add=True)


class Bus(models.Model):
    name = models.CharField(max_length=20, verbose_name="Bus Name", blank=True)
    platenumber = models.CharField(max_length=10, unique=True, default="GC0001")    
    color = models.CharField(verbose_name="vehicle color", max_length=30, null=True, blank=True)
    model = models.CharField(verbose_name="vehicle model", max_length=50, null=True, blank=True)
    make = models.CharField(verbose_name="vehicle make", max_length=50, null=True, blank=True)
    capacity = models.PositiveIntegerField(default=7, help_text="Number of passengers the bus can carry")
    allocated = models.BooleanField(default=False)
