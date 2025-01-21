from sqlite3 import IntegrityError
from rest_framework import serializers

from datetime import datetime, timedelta
import zoneinfo
from account.models import Customer
from django.conf import settings
from django.utils import timezone
from django.contrib.auth.models import User
from reservation.models import ServiceArea, Shuttle, ShuttleReservation, Transaction, RecommendationHistory, ShuttleDepots

utc = zoneinfo.ZoneInfo("UTC")
pickup_timezone = zoneinfo.ZoneInfo("America/New_York")
PICKUP_TIME_PADDING = 40

# Register your models here.
def FormatTime(time):
    """
    Utlitity function to format the input time from the frontend server
    """
    fmtTime = datetime(year=time.year, month=time.month, day=time.day, hour=time.hour, minute=time.minute)
    return fmtTime.astimezone(utc)


class ShuttleSerializer(serializers.ModelSerializer):
    serviceArea = serializers.CharField(source='serviceArea.name')

    class Meta:
        model = Shuttle
        fields = ['id', 'name', 'serviceArea', 'allocated', 'platenumber',
                  'color', 'model', 'make', 'inservice', 'capacity',
                  'starttime', 'endtime', 'depot_id']


class ServiceAreaSerializer(serializers.ModelSerializer):
    
    addr = serializers.CharField(source='location.address')

    class Meta:
        model = ServiceArea
        fields = ['name', 'addr', 'price', 'capacity']


class ShuttleReservationSerializer(serializers.ModelSerializer):

    shuttle = serializers.CharField(source='shuttle.name')
    username = serializers.CharField(source='customer.user.username')

    class Meta:
        model = ShuttleReservation
        fields = [
            'username',
            'firstName',
            'passengers',
            'pickupDateTime',
            'assistant',
            'pickupAddress',
            'dropoffAddress',
            'phoneNumber',
            'shuttle',
            'transaction',
        ]
        extra_kwargs = {'transaction': {'write_only': True}}

    def create(self, validated_data):
        shuttleName = validated_data.pop('shuttle', {})['name']
        shuttle = Shuttle.objects.get(name__exact=shuttleName)
        username = validated_data.pop('customer', {})['user']['username']
        customer = Customer.objects.get(user__username__exact=username)

        shuttleReservation = ShuttleReservation(customer=customer, shuttle=shuttle, **validated_data)
        shuttleReservation.save()

        return shuttleReservation

    def update(self, instance, validated_data):
        if "shuttle" in validated_data:
            shuttle = Shuttle.objects.get(
                name__exact=validated_data["shuttle"]["name"]
            )
            instance.shuttle = shuttle
            instance.lastSimUpdate = timezone.now()
            instance.save()
        return instance

    def validate_username(self, value):
        if not Customer.objects.filter(user__username__exact=value).exists():
            raise serializers.ValidationError("Invalid username!")
        return value

    def validate_shuttle(self, value):
        if not Shuttle.objects.filter(name__exact=value).exists():
            raise serializers.ValidationError("Shuttle {} not exists".format(value))
        return value


class TransactionSerializer(serializers.ModelSerializer):

    username = serializers.CharField(source='customer.user.username')
    serviceArea = serializers.CharField(source='serviceArea.name')
    shuttleColor = serializers.CharField(
        source='shuttleAllocation.shuttle.color',
        read_only=True)
    shuttleModel = serializers.CharField(
        source='shuttleAllocation.shuttle.model',
        read_only=True)
    shuttleMake = serializers.CharField(
        source='shuttleAllocation.shuttle.make',
        read_only=True)
    shuttlePlatenumber = serializers.CharField(
        source='shuttleAllocation.shuttle.platenumber',
        read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id',
            'username',
            'serviceArea',
            'charge',
            'refund',
            'firstName',
            'passengers',
            'pickupDateTime',
            'assistant',
            'pickupAddress',
            'dropoffAddress',
            'pickupLatitude',
            'pickupLongitude',
            'dropoffLatitude',
            'dropoffLongitude',
            'pickupPOI',
            'dropoffPOI',
            'pickupPOITravelTime',
            'dropoffPOITravelTime',
            'phoneNumber',
            'confirmationCode',
            'isBoarded',
            'isAlighted',
            'isCanceled',
            'isMissed',
            'isPaid',
            'isBookedByUser',
            'isBookedByDriver',
            'isBookedByManager',
            'isVirtualRider',
            'waitSimTime',
            'realPickupDateTime',
            'realDropoffDateTime',
            'etaTime',
            'pickup_Sim',
            'dropoff_Sim',
            'shuttleColor',
            'shuttleModel',
            'shuttleMake',
            'shuttlePlatenumber',
        ]
        extra_kwargs = {'createdAt': {'read_only': True}}

    def create(self, validated_data):
        username = validated_data.pop('customer', {})['user']['username']
        customer = Customer.objects.filter(user__username__exact=username).first()

        serviceAreaName = validated_data.pop('serviceArea', {})['name']
        serviceArea = ServiceArea.objects.filter(name__exact=serviceAreaName).first()

        charge = serviceArea.get_price(validated_data.get('passengers'))

        transac = Transaction(
            customer=customer,
            serviceArea=serviceArea,
            charge=charge,
            **validated_data,
        )
        transac.save()

        return transac

    def update(self, instance, validated_data):
        print('reservation.serializers.TransactionSerializer.update ...')
        instance.firstName = validated_data.get('firstName', instance.firstName)
        instance.passengers = validated_data.get('passengers', instance.passengers)
        instance.pickupDateTime = validated_data.get('pickupDateTime', instance.pickupDateTime)
        instance.assistant = validated_data.get('assistant', instance.assistant)
        instance.pickupAddress = validated_data.get('pickupAddress', instance.pickupAddress)
        instance.dropoffAddress = validated_data.get('dropoffAddress', instance.dropoffAddress)
        instance.isBoarded = validated_data.get('isBoarded', instance.isBoarded)
        instance.isAlighted = validated_data.get('isAlighted', instance.isAlighted)
        instance.isCanceled = validated_data.get('isCanceled', instance.isCanceled)
        instance.isMissed = validated_data.get('isMissed', instance.isMissed)
        instance.isPaid = validated_data.get('isPaid', instance.isPaid)
        instance.waitSimTime = validated_data.get('waitSimTime', instance.waitSimTime)

        if validated_data.get('isBoarded', False):
            instance.realPickupDateTime = timezone.now()
        elif validated_data.get('isAlighted', False):
            instance.realDropoffDateTime = timezone.now()

        instance.save()
        return instance

    def validate(self, attrs):
        """
        Check the availability of the shuttle
        """
        print('reservation.serializers.TransactionSerializer.validate ...')
        isBoarded = attrs['isBoarded']
        isMissed = attrs.get("isMissed", False)
        pickupTime = attrs['pickupDateTime']
        currentTime = datetime.now().astimezone(utc)
        if not isBoarded and isMissed == False:
            print("reservation.serializers.TransactionSerializer.validate ... isMissed set to false")
            if pickupTime < currentTime - timedelta(minutes=PICKUP_TIME_PADDING):
                raise serializers.ValidationError(
                    "pickup time can not be within "
                    "{} minutes from now".format(PICKUP_TIME_PADDING)
                )
        if isMissed == True:
            print("reservation.serializers.TransactionSerializer.validate ... isMissed set to true")
            currentTimeInRiderTimeZone = datetime.now().astimezone(pickup_timezone)
            if not isBoarded:
                 if pickupTime > currentTimeInRiderTimeZone - timedelta(minutes=1.0):
                     raise serializers.ValidationError("can not mark missed for future pickup ")


        return attrs

    def is_create(self):
        return self.context["isCreate"]

    def validate_username(self, value):
        if not Customer.objects.all().filter(user__username__exact=value).exists():
            raise serializers.ValidationError("Invalid username")
        return value

    def validate_checkInTime(self, value):
        if value.minute % 15 != 0:
            raise serializers.ValidationError("Invalid check in time!")
        return FormatTime(value)

    def validate_scheduledLeaveTime(self, value):
        if value.minute % 15 != 0:
            raise serializers.ValidationError("Invalid scheduled leave time!")
        return FormatTime(value)

    def validate_checkOutTime(self, value):
        return FormatTime(value)

    def validate_serviceArea(self, value):
        if not ServiceArea.objects.filter(name__exact=value).exists():
            raise serializers.ValidationError("Invalid ServiceArea!")
        return value


# Adding Serializer for RecommnedationHistory 
class RecommendationHistorySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='customer.user.username')

    class Meta:
        model = RecommendationHistory
        fields = [
            'username',
            'firstName',
            'passengers',
            'pickupDateTime',
            'assistant',
            'pickupAddress',
            'dropoffAddress',
            'reservation',
            'tripStartAddress',
            'tripEndAddress',
            'trip_startLoc_lat' ,
            'trip_startLoc_lng' ,
            'trip_endLoc_lat' ,
            'trip_endLoc_lng',
            'recommendation_obj'
        ]
    def create(self, validated_data):
        username = validated_data.pop('username', None)
        if not username:
            raise serializers.ValidationError("Missing username field")

        try:
            user = User.objects.filter(username__exact=username).first()
            customer = Customer.objects.get(user__exact=user)
        except User.DoesNotExist:
            raise serializers.ValidationError("User does not exist")
        except Customer.DoesNotExist:
            raise serializers.ValidationError("Customer does not exist")
        except IntegrityError:
            error_message = "Duplicate record. Please ensure the combination of customer, first name, pickup date and time, pickup address, dropoff address, and phone number is unique."
            raise serializers.ValidationError(detail=error_message)
        except:
            raise serializers.ValidationError("User does not exists")
        validated_data['customer'] = customer
        try:
            recommendation_history = RecommendationHistory.objects.create(**validated_data)
            return recommendation_history
        except Exception as e:
            raise serializers.ValidationError("Error occurred while creating RecommendationHistory: {}".format(str(e)))

class ShuttleDepotsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShuttleDepots
        fields = ['id', 'name', 'node_id', 'latitude', 'longitude', 'address']
