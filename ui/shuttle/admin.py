from django.contrib import admin
from datetime import datetime
import pytz

from shuttle.models import ShuttleLocation, ShuttleDriverLogin

utc = pytz.utc


# Register your models here.
def translate_time(time: datetime):
    return time.astimezone(utc)


class ShuttleLocationAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'get_username',
        # 'shuttle',
        'get_time_stamp',
        # 'get_address',
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


class ShuttleDriverLoginAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'get_username',
        'get_name',
        'get_time_stamp',
        'get_shuttle_id',
        'get_plate_number',
    )

    def get_username(self, obj):
        return obj.customer.user.username
    get_username.short_description = 'driver'

    def get_name(self, obj):
        return obj.name
    get_name.short_description = 'name'

    def get_time_stamp(self, obj):
        return translate_time(obj.datetimestamp) 
    get_time_stamp.short_description = 'date time'

    def get_latitude(self, obj):
        return obj.latitude
    get_latitude.short_description = 'latitude'

    def get_longitude(self, obj):
        return obj.longitude
    get_longitude.short_description = 'longitude'

    def get_shuttle_id(self, obj):
        return obj.shuttle_id
    get_shuttle_id.short_description = 'shuttle id'

    def get_plate_number(self, obj):
        return obj.plate_number
    get_plate_number.short_description = 'plate number'


admin.site.register(ShuttleLocation, ShuttleLocationAdmin)
admin.site.register(ShuttleDriverLogin, ShuttleDriverLoginAdmin)
