from django.contrib import admin
from account.models import Customer


# Register your models here.
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('get_username', 'tel', 'first_name', 'last_name', 'balance', 'created_time')
    search_fields = ('get_username',)

    def get_username(self, obj):
        return obj.user.username

    get_username.short_description = "Username"


admin.site.register(Customer, CustomerAdmin)
