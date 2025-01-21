from django.contrib import admin
from payment.models import Coupon


# Register your models here.
class CouponAdmin(admin.ModelAdmin):
    list_display = ('promotionCode', 'value', 'expireAt', 'isUsed')


admin.site.register(Coupon, CouponAdmin)
