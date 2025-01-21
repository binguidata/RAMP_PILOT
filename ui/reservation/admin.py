from django.contrib import admin
from reservation.models import Location, ServiceArea, Shuttle, ShuttleReservation, Transaction, RecommendationHistory, ShuttleDepots
from datetime import datetime
import pytz

utc = pytz.utc


# Register your models here.
def translate_time(time: datetime):
    return time.astimezone(utc)


class LocationAdmin(admin.ModelAdmin):
    list_display = ('address', 'latitude', 'longitude')


class ServiceAreaAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'get_addr', 'get_shuttle')

    def get_addr(self, obj):
        return obj.location.address
    get_addr.short_description = 'Address'

    def get_shuttle(self, obj):
        return obj.shuttle.all().count()
    get_shuttle.short_description = 'Number of Shuttles'


class ShuttleAdmin(admin.ModelAdmin):
    list_display = ('get_serviceArea', 'name')

    def get_serviceArea(self, obj):
        return obj.serviceArea.name
    get_serviceArea.short_description = 'serviceArea'


class ShuttleReservationAdmin(admin.ModelAdmin):
    list_display = (
        'get_customer',
        'get_first_name',
        'get_passengers',
        'get_assistant',
        'get_pickup_time',
        'get_pickup_address',
        'get_dropoff_address',
    )

    def get_customer(self, obj):
        return obj.customer.user.username
    get_customer.short_description = 'customer'

    def get_first_name(self, obj):
        return obj.firstName
    get_first_name.short_description = 'first name'

    def get_passengers(self, obj):
        return obj.passengers
    get_passengers.short_description = 'number of passengers'

    def get_pickup_time(self, obj):
        return translate_time(obj.pickupDateTime) 
    get_pickup_time.short_description = 'pickup time'

    def get_assistant(self, obj):
        return obj.assistant
    get_assistant.short_description = 'assistant'

    def get_pickup_address(self, obj):
        return obj.pickupAddress
    get_pickup_address.short_description = 'pickup address'

    def get_dropoff_address(self, obj):
        return obj.dropoffAddress
    get_dropoff_address.short_description = 'drop-off address'


class TransactionAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'get_username',
        'get_service_area',
        'get_shuttle',
        'get_first_name',
        'get_passengers',
        'get_assistant',
        'get_pickup_time',
        'get_pickup_address',
        'get_dropoff_address',
        'charge',
        'refund',
        'isCanceled',
        'isMissed',
        'isBoarded',
        'isAlighted',
    )
        
    def get_username(self, obj):
        return obj.customer.user.username
    get_username.short_description = 'customer'

    def get_service_area(self, obj):
        return obj.serviceArea.name
    get_service_area.short_description = 'service area'

    def get_shuttle(self, obj):
        if obj.shuttleAllocation is not None:
            return obj.shuttleAllocation.shuttle.name
        else:
            return 'Not assigned'
    get_shuttle.short_description = 'shuttle'

    def get_first_name(self, obj):
        return obj.firstName
    get_first_name.short_description = 'first name'

    def get_passengers(self, obj):
        return obj.passengers
    get_passengers.short_description = 'number of passengers'

    def get_pickup_time(self, obj):
        return translate_time(obj.pickupDateTime) 
    get_pickup_time.short_description = 'pickup time'

    def get_assistant(self, obj):
        return obj.assistant
    get_assistant.short_description = 'assistant'

    def get_pickup_address(self, obj):
        return obj.pickupAddress
    get_pickup_address.short_description = 'pickup address'

    def get_dropoff_address(self, obj):
        return obj.dropoffAddress
    get_dropoff_address.short_description = 'drop-off address'

    def get_confirmation_code(self, obj):
        return obj.confirmation_code
    get_confirmation_code.short_description = 'confirmation code'


class RecommendationHistoryAdmin(admin.ModelAdmin):
    list_display = (
        'get_customer',
        'get_first_name',
        'get_passengers',
        'get_assistant',
        'get_pickup_time',
        'get_pickup_address',
        'get_dropoff_address',
    )
    def get_customer(self, obj):
        return obj.customer.user.username
    get_customer.short_description = 'customer'

    def get_first_name(self, obj):
        return obj.firstName
    get_first_name.short_description = 'first name'

    def get_passengers(self, obj):
        return obj.passengers
    get_passengers.short_description = 'number of passengers'

    def get_pickup_time(self, obj):
        return translate_time(obj.pickupDateTime) 
    get_pickup_time.short_description = 'pickup time'

    def get_assistant(self, obj):
        return obj.assistant
    get_assistant.short_description = 'assistant'

    def get_pickup_address(self, obj):
        return obj.pickupAddress
    get_pickup_address.short_description = 'pickup address'

    def get_dropoff_address(self, obj):
        return obj.dropoffAddress
    get_dropoff_address.short_description = 'drop-off address'


class ShuttleDepotsAdmin(admin.ModelAdmin):
    list_display = ['name', 'node_id']


admin.site.register(Location, LocationAdmin)
admin.site.register(ServiceArea, ServiceAreaAdmin)
admin.site.register(Shuttle, ShuttleAdmin)
admin.site.register(ShuttleReservation, ShuttleReservationAdmin)
admin.site.register(RecommendationHistory,RecommendationHistoryAdmin)
admin.site.register(Transaction, TransactionAdmin)
admin.site.register(ShuttleDepots, ShuttleDepotsAdmin)
