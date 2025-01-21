from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

from rest_framework.decorators import api_view
from rest_framework.parsers import JSONParser
from rest_framework.response import Response

import json
import datetime
from django.utils import timezone
from pytz import timezone as pytz_timezone

from .models import Bus, BusLocations
from .serializers import BusSerializer, OnBoardRecordsSerializer, BusLocationSerializer
from jwt_handler.permission import has_access_rights


# Create your views here.
@csrf_exempt
@api_view(['POST'])
def onBoard_create(request):
    """ 
    Code is responsible to create records for onboard 
    """
    if not has_access_rights(request, valid_auths=['BUS_DRIVER']):
        return Response({'error': 'Permission Denied'}, status=403)

    onBoardsrc = OnBoardRecordsSerializer(
        data=JSONParser().parse(request),
        context={'isCreate': True}
    )
    if onBoardsrc.is_valid(raise_exception=False):
        onBoardRec = onBoardsrc.save()
        onBoardRec.save()
        return Response(onBoardsrc.data, status=201)
    else:
        return Response(onBoardsrc.errors, status=400)


@csrf_exempt
@api_view(['POST'])
def bus_location_create(request):
    """ 
    Code is responsible to create records for onboard 
    """
    if not has_access_rights(request, valid_auths=['BUS_DRIVER']):
        return Response({'error': 'Permission Denied'}, status=403)

    busLocationsrc = BusLocationSerializer(
        data=JSONParser().parse(request),
        context={'isCreate': True}
    )
    if busLocationsrc.is_valid(raise_exception=False):
        busLocationRec = busLocationsrc.save()
        busLocationRec.save()
        return Response(busLocationsrc.data, status=201)
    else:
        return Response(busLocationsrc.errors, status=400)


@api_view(['GET'])
def get_driver_info(request):
    eastern = pytz_timezone('America/New_York')
    current_date = timezone.now().astimezone(eastern).date()
    qs = BusLocations.objects.filter(timeStamp__date=current_date)
    serializer = BusLocationSerializer(qs, many=True)
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
        if count == 1:
            break
    print(f"This is the response from the shuttle req. from the bus views. \n")
    print(len(re))
    return Response(json.dumps(re), status=200)


@api_view(['POST'])
def generate_bus_emergency_message(request):
    if not has_access_rights(request, valid_auths=['BUS_DRIVER']):
        return Response({'error': 'Permission Denied'}, status=403)

    driver_name = request.data.get('driver_name')
    lat = request.data.get('lat')
    lng = request.data.get('lng')

    phones = ['7247807267', '7248331073']

    msg = (
        "Emergency Report from the Waynesburg-Carmichaels fixed-route shuttle ({}), Location: ({}, {})."
        .format(
            driver_name,
            lat,
            lng,
        )
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


@csrf_exempt
@api_view(['POST'])
def bus_create(request):
    """ 
    Code is responsible to create records for bus 
    """
    if not has_access_rights(request, valid_auths=['MANAGER']):
        return Response({'error': 'Permission Denied'}, status=403)

    busSrc = BusSerializer(
        data=JSONParser().parse(request),
        context={'isCreate': True}
    )
    if busSrc.is_valid(raise_exception=False):
        busRec = busSrc.save()
        busRec.save()
        return Response(busSrc.data, status=201)
    else:
        return Response(busSrc.errors, status=400)


@csrf_exempt
@api_view(['GET'])
def get_all_buses(request):
    """ 
    Code is responsible to get all records for bus 
    """
    if not has_access_rights(request, valid_auths=['MANAGER']):
        return Response({'error': 'Permission Denied'}, status=403)

    buses = Bus.objects.all()
    serializer = BusSerializer(buses, many=True)
    return Response(serializer.data, status=200)


@csrf_exempt
@api_view(['GET'])
def get_bus(request, pk):
    """ 
    Code is responsible to get records for bus by pk 
    """
    if not has_access_rights(request, valid_auths=['MANAGER']):
        return Response({'error': 'Permission Denied'}, status=403)
    
    try:
        bus = Bus.objects.get(pk=pk)
    except Bus.DoesNotExist:
        return Response(status=404)
    serializer = BusSerializer(bus)
    return Response(serializer.data, status=200)


@csrf_exempt
@api_view(['PUT'])
def update_bus(request, pk):
    """ 
    Code is responsible to update records for bus by pk 
    """
    if not has_access_rights(request, valid_auths=['MANAGER']):
        return Response({'error': 'Permission Denied'}, status=403)

    try:
        bus = Bus.objects.get(pk=pk)
    except Bus.DoesNotExist:
        return Response(status=404)
    serializer = BusSerializer(bus, data=JSONParser().parse(request))
    if serializer.is_valid(raise_exception=False):
        serializer.save()
        return Response(serializer.data, status=200)
    else:
        return Response(serializer.errors, status=400)


@csrf_exempt
@api_view(['DELETE'])
def delete_bus(request, pk):
    """ 
    Code is responsible to delete records for bus by pk 
    """
    if not has_access_rights(request, valid_auths=['MANAGER']):
        return Response({'error': 'Permission Denied'}, status=403)

    try:
        bus = Bus.objects.get(pk=pk)
    except Bus.DoesNotExist:
        return Response(status=404)
    bus.delete()
    return Response(status=204)
