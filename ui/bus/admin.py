from django.contrib import admin
from datetime import datetime
import pytz

from .models import Bus, BusLocations, OnBoardRecords

utc = pytz.utc


# Register your models here.
def translate_time(time: datetime):
    return time.astimezone(utc)


class OnBoardRecordsAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'get_username',
        'get_time_stamp',
        'get_onboard_count',
        'get_offboard_count',
        'get_bus_number',
        'get_latitude',
        'get_longitude',
    )

    def get_username(self, obj):
        return obj.customer.user.username
    get_username.short_description = 'driver'

    def get_time_stamp(self, obj):
        return translate_time(obj.timeStamp) 
    get_time_stamp.short_description = 'date time'

    def get_onboard_count(self, obj):
        return obj.onboard_count
    get_onboard_count.short_description = 'onboard_count'

    def get_offboard_count(self, obj):
        return obj.offboard_count
    get_offboard_count.short_description = 'offboard_count'

    def get_bus_number(self, obj):
        return obj.bus_number
    get_bus_number.short_description = 'bus_number'

    def get_latitude(self, obj):
        return obj.latitude
    get_latitude.short_description = 'latitude'

    def get_longitude(self, obj):
        return obj.longitude
    get_longitude.short_description = 'longitude'


class BusLocationAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'get_username',
        'get_time_stamp',
        'get_latitude',
        'get_longitude',
    )

    def get_username(self, obj):
        return obj.customer.user.username
    get_username.short_description = 'driver'

    def get_time_stamp(self, obj):
        return translate_time(obj.timeStamp) 
    get_time_stamp.short_description = 'date time'

    def get_latitude(self, obj):
        return obj.latitude
    get_latitude.short_description = 'latitude'

    def get_longitude(self, obj):
        return obj.longitude
    get_longitude.short_description = 'longitude'


admin.site.register(OnBoardRecords, OnBoardRecordsAdmin)
admin.site.register(BusLocations, BusLocationAdmin)
admin.site.register(Bus)
