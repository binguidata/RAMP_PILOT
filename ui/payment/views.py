import random
import string
from datetime import datetime
from django.shortcuts import get_object_or_404
import pytz
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response

from account.models import Customer
from account.serializers import CustomerProfileSerializer
from payment.models import Coupon
from twilio.base.exceptions import TwilioRestException
from jwt_handler.permission import has_access_rights
from decimal import Decimal

import json

tz = pytz.timezone(settings.TIME_ZONE)


# Create your views here.
@api_view(['POST'])
def redeem_coupon(request):
    if 'username' not in request.data \
         or 'promotionCode' not in request.data:
        return Response({'error': 'Missing required fields'}, status=400)

    username = request.data.get('username')
    customer = Customer.objects.filter(user__username__exact=username)
    if not customer.exists():
        return Response({'error': 'Invalid user.'}, status=400)
    customer = customer.first()

    promotionCode = request.data.get('promotionCode')

    coupon = Coupon.objects.filter(promotionCode=promotionCode)[0]

    if coupon and not coupon.isUsed and coupon.expireAt > datetime.now(tz):
        customer.balance += coupon.value
        customer.save()
        serializer = CustomerProfileSerializer(customer)
        coupon.isUsed = True
        coupon.save()
        return Response(serializer.data, status=200)
    else:
        return Response({'error': 'Coupon is invalid or expired.'}, status=400)


# Create your views here.
@api_view(['POST'])
def generate_coupon(request):
    if not has_access_rights(request, valid_auths=['MANAGER']):
        return Response({'error': 'Permission Denied'}, status=403)

    coupon_value = float(request.data.get('value'))
    phone = request.data.get('phone')
    if coupon_value <= 0:
        return Response({'msg': 'Coupon value can not be less than or equals to 0'}, status=200)
    from twilio.rest import Client
    from django.conf import settings
    account_sid = settings.ACCOUNT_SID
    auth_token = settings.AUTH_TOKEN
    client = Client(account_sid, auth_token)

    if not is_valid_number(client, str(phone)):
        return Response({'error': 'Not valid phone number!'}, status=400)

    find = False
    coupon_str = ''
    while not find:
        coupon_str = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(20))
        coupon_checker = Coupon.objects.filter(promotionCode=coupon_str)
        if len(coupon_checker) == 0:
            find = True

    new_coupon = Coupon(promotionCode=coupon_str, isUsed=False, expireAt=datetime(year=2024, month=10, day=1),
                        value=coupon_value)
    new_coupon.save()
    msg = 'This is your coupon number : {}'. \
        format(coupon_str)

    client.messages.create(
        to=phone,
        from_=settings.PHONE_NUMBER,
        body=msg
    )
    return Response({'msg': 'success and the coupon code is sent to your phone'.format(coupon_str)}, status=200)


@api_view(['POST'])
def paypal_amount_update(request):
    customer = Customer.objects.get(user__username__exact=request.user.username)
    customer.balance = float(customer.balance) + float(request.data['paypal_amount'])
    customer.save()
    return Response({"successful"}, status=200)

def is_valid_number(client, number):
    try:
        client.lookups.phone_numbers(number).fetch(type="carrier")
        return True
    except TwilioRestException as e:
        if e.code == 20404:
            return False
        else:
            raise e


@api_view(['POST'])
def get_customers(request):
    customers = Customer.objects.all().values('id', 'first_name', 'last_name', 'tel')
    return Response(list(customers), status=200)


@api_view(['POST'])
def allocate_coupon(request):
    if not has_access_rights(request, valid_auths=['MANAGER']):
        return Response({'error': 'Permission Denied'}, status=403)

    data = json.loads(request.body)
    customer_id = data.get('customer_id')
    value = Decimal(data.get('value'))

    if value <= 0:
        return Response({'msg': 'Coupon value cannot be less than or equal to 0'}, status=200)

    customer = get_object_or_404(Customer, id=customer_id)

    find = False
    coupon_str = ''
    while not find:
        coupon_str = ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(20))
        coupon_checker = Coupon.objects.filter(promotionCode=coupon_str)
        if len(coupon_checker) == 0:
            find = True

    new_coupon = Coupon(promotionCode=coupon_str, isUsed=True, expireAt=datetime(year=2024, month=10, day=1),
                        value=value)
    new_coupon.save()


    # Add the coupon value to the customer's balance
    customer.balance += value
    customer.save()

    return Response({'msg': f'Coupon code {coupon_str} generated and added {value} to customer balance'}, status=200)