from datetime import datetime
import pytz
from rest_framework import serializers
from account.models import Customer
utc = pytz.UTC

from .models import OnBoardRecords, BusLocations, Bus


# Register your models here.
def format_time(time):
    """
    Utlitity function to format the input time from the frontend server
    """
    fmtTime = datetime(year=time.year, month=time.month, day=time.day, hour=time.hour, minute=time.minute)
    return fmtTime.astimezone(utc)


class OnBoardRecordsSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='customer.user.username')
    class Meta:
        model = OnBoardRecords
        fields = [
            'username',
            'timeStamp',
            'onboard_count',
            'offboard_count',
            'bus_number',
            'latitude',
            'longitude'
        ]

    def create(self, validated_data):
        username = validated_data.pop('customer', {})['user']['username']
        if username is None:
            raise serializers.ValidationError("Invalid username")
        customer = Customer.objects.filter(user__username__exact=username).first()
        if customer is None:
            raise serializers.ValidationError("Customer not found")
        onBoardRecords = OnBoardRecords(
            customer=customer,
            **validated_data,
        )
        onBoardRecords.save()
        return onBoardRecords

    def validate_username(self, value):
        if not Customer.objects.all().filter(user__username__exact=value).exists():
            raise serializers.ValidationError("Invalid username")
        return value


class BusLocationSerializer (serializers.ModelSerializer):
    username = serializers.CharField(source='customer.user.username')
    class Meta:
        model = BusLocations
        fields = [
            'username',
            'timeStamp',
            'bus_number',
            'latitude',
            'longitude'
        ]

    def create(self, validated_data):
        print('Within the Create serailzer of the Bus Location data is ')
        print(validated_data)
        username = validated_data.pop('customer', {})['user']['username']
        if username is None:
            raise serializers.ValidationError("Invalid username")
        customer = Customer.objects.filter(user__username__exact=username).first()
        if customer is None:
            raise serializers.ValidationError("Customer not found")
        busLocations = BusLocations(
            customer=customer,
            **validated_data,
        )
        busLocations.save()
        return busLocations


class BusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bus
        fields = ['id', 'name', 'platenumber', 'color', 'model', 'make', 'capacity', 'allocated']
