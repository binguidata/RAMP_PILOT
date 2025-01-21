import random
import logging
from datetime import datetime, timedelta
import pytz
from django.conf import settings
from django.db import models
from django.utils import timezone

from account.models import Customer

openHour = 10
closeHour = 21
utc = pytz.UTC
tz = pytz.timezone(settings.TIME_ZONE)  # the timezone set in the settings
unitMins = 15
logger = logging.getLogger(__name__)


# Create your models here.
class Location(models.Model):
    address = models.CharField(max_length=40)
    latitude = models.DecimalField(max_digits=12, decimal_places=9)
    longitude = models.DecimalField(max_digits=12, decimal_places=9)

    def __str__(self):
        return self.address


class ShuttleDepots(models.Model):
    name = models.CharField(max_length=50)
    node_id = models.BigIntegerField()
    latitude = models.DecimalField(max_digits=12, decimal_places=9, default=0.0)
    longitude = models.DecimalField(max_digits=12, decimal_places=9, default=0.0)
    address = models.CharField(max_length=100, default="NA")
    def __str__(self):
        return self.name


class ServiceArea(models.Model):
    location = models.ForeignKey(Location, on_delete=models.PROTECT)
    price = models.DecimalField(max_digits=4, decimal_places=2)
    name = models.CharField(max_length=20)

    def __str__(self):
        return self.name

    def get_available_shuttles(self, pickupTime: datetime, passengers: int):
        """
        Fetch a list of available shuttles
        args:
            pickupTime: pickup time
            passengers: number of passengers
        return:
            availableShuttles: list of available shuttles
        """
        # By default, use only *currently* active shuttles
        shuttles = list(Shuttle.objects.filter(serviceArea_id=self.id,
                                               inservice=False,
                                               allocated=True))
        # If there are no active shuttles, fallback to all used shuttles
        if len(shuttles) == 0:
            shuttles = list(Shuttle.objects.filter(serviceArea_id=self.id,
                                                   inservice=False))
        # If there are still no such shuttles, resort to use all shuttles
        if len(shuttles) == 0:
            shuttles = list(Shuttle.objects.filter(serviceArea_id=self.id))
        random.shuffle(shuttles)
        return shuttles

    def get_max_availability(self, pickupTime):
        """
        Get the max possible duration given a pickup time
        args:
            pickupTime: pickup time
        return:
            mxDuration: the max duration possible
        """
        mx = []
        shuttles = Shuttle.objects.all().filter(serviceArea_id=self.id)
        for shuttle in shuttles:
            mx.append(shuttle.get_max_availability(pickupTime))
        return max(mx)

    def get_price(self, passengers):
        """
        Calculate the shuttle charge
        args:
            inTime: number of passengers
        return:
            price: charge for the given number of passengers
        """
        unitPrice = self.price
        return unitPrice * passengers


class Shuttle(models.Model):
    name = models.CharField(max_length=20)
    serviceArea = models.ForeignKey(
        ServiceArea, related_name='shuttle', on_delete=models.CASCADE)
    allocated = models.BooleanField(default=False)
    platenumber = models.CharField(max_length=10, default="GC0001")
    color = models.CharField(verbose_name="vehicle color",
                             max_length=30, null=True, blank=True)
    model = models.CharField(verbose_name="vehicle model",
                             max_length=50, null=True, blank=True)
    make = models.CharField(verbose_name="vehicle make",
                            max_length=50, null=True, blank=True)

    # New Fields:
    shuttle_id_virtual = models.PositiveIntegerField()
    capacity = models.PositiveIntegerField(default=13)
    depot_id = models.BigIntegerField(default=4975875143)
    starttime = models.DecimalField(
        max_digits=3, decimal_places=1, default=5.0)
    endtime = models.DecimalField(max_digits=3, decimal_places=1, default=20.5)
    inservice = models.BooleanField(default=False)
    depot_lookup_id = models.ForeignKey(
        ShuttleDepots, related_name='shuttle_depot', on_delete=models.PROTECT)

    last_modified = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['name', 'serviceArea']

    def get_max_availability(self, pickupTime: datetime) -> int:
        """
        args:
            pickupTime: pickup time
        return:
            mxDuration: max possible duration
        """
        closeTime = pickupTime.astimezone(tz).replace(hour=closeHour, minute=0).astimezone(utc)
        pickupTime = pickupTime.astimezone(utc)
        mxDuration = max(0, int((closeTime - pickupTime) / timedelta(seconds=60)))
        earliestRes = self.reservation.filter(endTime__gt=pickupTime)
        if earliestRes.exists():
            earliestRes = earliestRes.earliest('startTime')
            delta = earliestRes.startTime - pickupTime
            mxDuration = max(0, int(delta / timedelta(seconds=60)))

        mxDuration = min(720, mxDuration)
        return mxDuration

    def get_curr_reservation(self):
        """
        return:
            reservation: a ShuttleReservation instance if the shuttle is currently being occupied or None otherwise
        """
        now = datetime.now().astimezone(utc)
        qs = self.reservation.filter(startTime__lte=now, endTime__gt=now)
        if qs.exists():
            return qs.first()
        else:
            return None
        
    def __str__(self):
        return self.serviceArea.name + "-" + self.name


class Transaction(models.Model):
    customer = models.ForeignKey(Customer, related_name='transactions', on_delete=models.PROTECT)
    serviceArea = models.ForeignKey(ServiceArea, related_name='shuttle_transaction', on_delete=models.PROTECT)
    firstName = models.CharField(max_length=100)
    passengers = models.IntegerField(default=1)
    pickupDateTime = models.DateTimeField()
    assistant = models.BooleanField(default=False)
    pickupAddress = models.CharField(max_length=300)
    dropoffAddress = models.CharField(max_length=300)
    pickupLatitude = models.DecimalField(max_digits=12, decimal_places=9)
    pickupLongitude = models.DecimalField(max_digits=12, decimal_places=9)
    dropoffLatitude = models.DecimalField(max_digits=12, decimal_places=9)
    dropoffLongitude = models.DecimalField(max_digits=12, decimal_places=9)
    pickupPOI = models.BigIntegerField(default=-1)
    dropoffPOI = models.BigIntegerField(default=-1)
    pickupPOITravelTime = models.IntegerField(default=60)
    dropoffPOITravelTime = models.IntegerField(default=60)
    phoneNumber = models.CharField(max_length=20)

    charge = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    refund = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    confirmationCode = models.CharField(max_length=10)
    isBoarded = models.BooleanField(default=False)
    isAlighted = models.BooleanField(default=False)
    isCanceled = models.BooleanField(default=False)
    isMissed = models.BooleanField(default=False)
    isPaid = models.BooleanField(default=False)
    isBookedByUser = models.BooleanField(default=False)
    isBookedByDriver = models.BooleanField(default=False)
    isBookedByManager = models.BooleanField(default=False)
    isVirtualRider = models.BooleanField(default=False)
    waitSimTime = models.IntegerField(default=0)
    createdAt = models.DateTimeField(auto_now_add=True)
    realPickupDateTime = models.DateTimeField(null=True, blank=True)
    realDropoffDateTime = models.DateTimeField(null=True, blank=True)
    estimatedArrivalTime = models.DateTimeField(null=True, blank=True)
    pickup_Sim = models.BigIntegerField(null=True)
    dropoff_Sim = models.BigIntegerField(null=True)

    class Meta:
        ordering = ['-pickupDateTime']

    @property
    def etaTime(self):
        """Number of seconds to the estimated time to arrive of the shuttle.

        If there is no estimated time, this is -1.

        """
        arrival_time = self.estimatedArrivalTime
        if arrival_time is None:
            logger.warning("Failed to estimate arrival time; "
                           "fallback to pickup time")
            arrival_time = self.pickupDateTime
        if arrival_time is None:
            logger.error("Failed to get ETA")
            return -1
        now = timezone.now()
        return max(0, int((arrival_time - now).total_seconds()))

    @etaTime.setter
    def etaTime(self, seconds):
        """Set the estimated arrival time to *seconds* later from now.

        *seconds* must be a non-negative integer.

        """
        if not isinstance(seconds, int) or seconds < 0:
            raise RuntimeError(f"Invalid ETA time '{seconds}'")
        now = datetime.now(tz=utc)
        self.estimatedArrivalTime = now + timedelta(seconds=seconds)


class ShuttleReservation(models.Model):
    customer = models.ForeignKey(Customer, related_name='shuttleReservation', on_delete=models.PROTECT)
    transaction = models.OneToOneField(Transaction, related_name='shuttleAllocation', on_delete=models.CASCADE)
    shuttle = models.ForeignKey(Shuttle, related_name='reservation', on_delete=models.PROTECT)
    firstName = models.CharField(max_length=100)
    passengers = models.IntegerField(default=1)
    pickupDateTime = models.DateTimeField()
    assistant = models.BooleanField() 
    pickupAddress = models.CharField(max_length=300)
    dropoffAddress = models.CharField(max_length=300)
    phoneNumber = models.CharField(max_length=20)
    auth = models.IntegerField(default=-1)
    lastSimUpdate = models.DateTimeField(
        verbose_name="Last simulation update time",
        null=True, blank=True,
    )


# Model to store the RecommendationHistory Records :
class RecommendationHistory(models.Model):
    customer = models.ForeignKey(Customer, related_name='recommendationHistory', on_delete=models.PROTECT)
    firstName = models.CharField(max_length=30 , null=True, blank=True)
    passengers = models.IntegerField(default=1)
    pickupDateTime = models.DateTimeField()
    assistant = models.BooleanField(default=1) 
    pickupAddress = models.CharField(max_length=300)
    dropoffAddress = models.CharField(max_length=300)
    reservation = models.BooleanField(default=0) 
    tripStartAddress = models.CharField(max_length=300, null=True, blank=True)
    tripEndAddress = models.CharField(max_length=300, null=True, blank=True)
    trip_startLoc_lat = models.FloatField(blank=True,null=True)
    trip_startLoc_lng = models.FloatField(blank=True,null=True)
    trip_endLoc_lat = models.FloatField(blank=True,null=True)
    trip_endLoc_lng = models.FloatField(blank=True,null=True)
    recommendation_obj = models.JSONField(default=dict)

    class Meta:
        unique_together = [['customer','firstName','pickupDateTime','pickupAddress','dropoffAddress','passengers']] #this is applied so that unqiue records are only saved.
