from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

from rest_framework.decorators import api_view
from rest_framework.parsers import JSONParser
from rest_framework.response import Response

import json
import datetime
from django.utils import timezone
from pytz import timezone as pytz_timezone

from shuttle.models import ShuttleLocation, ShuttleRoute, ShuttleDriverLogin
from shuttle.serializers import ShuttleLocationSerializer, ShuttleRouteSerializer, ShuttleDriverLoginSerializer
from jwt_handler.permission import has_access_rights

# Create your views here.
@csrf_exempt

@api_view(['POST'])
def shuttle_driverlogin_create(request):
    """
    Handle requests to record shuttle's location
    """
    if not has_access_rights(request, valid_auths=['SHUTTLE_DRIVER']):
        return Response({'error': 'Permission Denied'}, status=403)

    shuttle_driverLogin = ShuttleDriverLoginSerializer(
        data=JSONParser().parse(request),
        context={'isCreate': True}
    )
    if shuttle_driverLogin.is_valid(raise_exception=False):
        shuttle_driverObj = shuttle_driverLogin.save()
        shuttle_driverObj.save()
        return Response(shuttle_driverLogin.data, status=201)
    else:
        return Response(shuttle_driverLogin.errors, status=400)


@api_view(['POST'])
def shuttle_location_create(request):
    """
    Handle requests to record shuttle's location
    """
    if not has_access_rights(request, valid_auths=['SHUTTLE_DRIVER']):
        return Response({'error': 'Permission Denied'}, status=403)

    shuttleLocSer = ShuttleLocationSerializer(
        data=JSONParser().parse(request),
        context={'isCreate': True}
    )
    if shuttleLocSer.is_valid(raise_exception=False):
        shuttleLoc = shuttleLocSer.save()
        shuttleLoc.save()
        return Response(shuttleLocSer.data, status=201)
    else:
        return Response(shuttleLocSer.errors, status=400)


@api_view(['POST'])
def update_driver_info(request):
    if not has_access_rights(request, valid_auths=['SHUTTLE_DRIVER']):
        return Response({'error': 'Permission Denied'}, status=403)

    username = request.data["username"]
    qs = ShuttleLocation.objects.get(customer__user__username=username)
    qs.latitude = request.data.get('lat')
    qs.longitude = request.data.get('lng')
    qs.save()
    return Response({"msg": 'Success'}, status=200)


@api_view(['GET'])
def get_driver_info(request):
    eastern = pytz_timezone('America/New_York')
    current_date = timezone.now().astimezone(eastern).date()
    qs = ShuttleLocation.objects.filter(timeStamp__date=current_date)
    serializer = ShuttleLocationSerializer(qs, many=True)
    datas = sorted(list(serializer.data), key=lambda x: (x['timeStamp']), reverse=True)
    check = []
    re = []
    count = 0
    for d in datas:
        if d['username'] not in check:
            count += 1
            re.append({
                'username': d['username'],
                'lat': d['latitude'],
                'log': d['longitude'],
                'date_time': d['timeStamp'],
            })
            check.append(d['username'])
        if count == 3:
            break
    return Response(json.dumps(re), status=200)


@api_view(['GET'])
def shuttle_location_list(request):
    """
    Fetch all reservation records of the user
    """
    username = request.user.username
    qs = ShuttleLocation.objects.filter(customer__user__username__exact=username)
    serializer = ShuttleLocationSerializer(qs, many=True)
    return Response(serializer.data, status=200)


@api_view(['GET'])
def shuttle_route_list(request):
    """
    Fetch all reservation records of the user
    """
    today = datetime.date.today()
    qs = ShuttleRoute.objects.filter(date=today, shuttleName='shuttle 101')
    serializer = ShuttleRouteSerializer(qs, many=True)
    return Response(serializer.data, status=200)


@api_view(['POST'])
def generate_shuttle_emergency_message(request):
    if not has_access_rights(request, valid_auths=['SHUTTLE_DRIVER']):
        return Response({'error': 'Permission Denied'}, status=403)

    driver_name = request.data.get('driver_name')
    passengers = int(request.data.get('passengers'))
    shuttlePlatenumber = request.data.get('shuttlePlatenumber')
    lat = request.data.get('lat')
    lng = request.data.get('lng')

    phones = ['7247807267', '7248331073']
    msg = (
        "Emergency report from on-demand van "
        f"(driver: {driver_name}, plate number: {shuttlePlatenumber}): "
        f"{passengers} passengers at location ({lat}, {lng})"
    )

    from twilio.rest import Client
    from django.conf import settings
    account_sid = settings.ACCOUNT_SID
    auth_token = settings.AUTH_TOKEN
    client = Client(account_sid, auth_token)

    for phone in phones:
        client.messages.create(
            to=phone,
            from_=settings.PHONE_NUMBER,
            body=msg
        )
    return Response({'msg': 'Report has been sent out!'}, status=200)
