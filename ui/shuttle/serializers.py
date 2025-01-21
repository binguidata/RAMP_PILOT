from datetime import datetime

import pytz
from rest_framework import serializers

from account.models import Customer
from shuttle.models import ShuttleLocation, ShuttleRoute , ShuttleDriverLogin

utc = pytz.UTC

# Register your models here.
def format_time(time):
    """
    Utlitity function to format the input time from the frontend server
    """
    fmtTime = datetime(year=time.year, month=time.month, day=time.day, hour=time.hour, minute=time.minute)
    return fmtTime.astimezone(utc)

class ShuttleDriverLoginSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='customer.user.username')
    class Meta:
        model = ShuttleDriverLogin
        fields = [
            'id',
            'username',
            'name',
            'datetimestamp',
            'latitude',
            'longitude',
            'shuttle_id',
            'plate_number',

        ]
    def create(self, validated_data):
        username = validated_data.pop('customer', {})['user']['username']
        customer = Customer.objects.filter(user__username__exact=username).first()

        ShuttleDriverLoginData = ShuttleDriverLogin(
            customer=customer,
            **validated_data,
        )
        ShuttleDriverLoginData.save()

        return ShuttleDriverLoginData

    def validate_username(self, value):
        if not Customer.objects.all().filter(user__username__exact=value).exists():
            raise serializers.ValidationError("Invalid username")
        return value
class ShuttleLocationSerializer(serializers.ModelSerializer):

    username = serializers.CharField(source='customer.user.username')

    class Meta:
        model = ShuttleLocation
        fields = [
            'id',
            'username',
            'timeStamp',
            'latitude',
            'longitude',
        ]
        extra_kwargs = {'createdAt': {'read_only': True}}

    def create(self, validated_data):
        username = validated_data.pop('customer', {})['user']['username']
        customer = Customer.objects.filter(user__username__exact=username).first()

        shuttleLoc = ShuttleLocation(
            customer=customer,
            **validated_data,
        )
        shuttleLoc.save()

        return shuttleLoc

    def validate_username(self, value):
        if not Customer.objects.all().filter(user__username__exact=value).exists():
            raise serializers.ValidationError("Invalid username")
        return value


class ShuttleRouteSerializer(serializers.ModelSerializer):

    class Meta:
        model = ShuttleRoute
        fields = [
            'date',
            'routeList',
            'shuttleName'
        ]
