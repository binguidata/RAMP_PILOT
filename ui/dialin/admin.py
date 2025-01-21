from django.contrib import admin
from dialin.models import DialinUser


# Register your models here.
class DialinUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'first_name', 'last_name', 'cellphone_number', 'email_address', 'signed_consent')

admin.site.register(DialinUser, DialinUserAdmin)
