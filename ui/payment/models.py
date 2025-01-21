from django.db import models


# Create your models here.
class Coupon(models.Model):
    promotionCode = models.CharField(max_length=20)
    isUsed = models.BooleanField(default=False)
    expireAt = models.DateTimeField()
    value = models.IntegerField()
