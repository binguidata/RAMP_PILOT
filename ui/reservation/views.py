from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from datetime import timedelta
from decimal import Decimal
from shapely.geometry import Point, Polygon
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from account.models import Customer
from rest_framework import status   
from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication
from cryptography.fernet import Fernet
from jwt_handler.permission import has_access_rights
from django.utils import timezone
import os
import datetime
import pytz
import pandas as pd
import json
import logging

from reservation.models import RecommendationHistory, ServiceArea, ShuttleDepots, Transaction, Shuttle, ShuttleReservation
from reservation.serializers import RecommendationHistorySerializer, ShuttleDepotsSerializer, ShuttleReservationSerializer, TransactionSerializer, ShuttleSerializer
from reservation.recommend import *
from shuttle.models import ShuttleDriverLogin


utc = pytz.UTC
logger = logging.getLogger(__name__)

cyptokey = settings.CRYPTO_KEY
cipher_suite = Fernet(cyptokey)


# def load_travel_data(json_file_path):
#     with open(json_file_path, 'r') as file:
#         return json.load(file)
# This function is to be called globally or in the Django app initialization
# travel_data = load_travel_data(reservation_config.OD_dist_mat_path)


def encrypt_data(data):
    return cipher_suite.encrypt(data.encode('utf-8')).decode('utf-8')


def decrypt_data(encrypted_data):
    try:
        # Assuming cipher_suite is already defined and properly configured
        decrypted_data = cipher_suite.decrypt(encrypted_data.encode('utf-8')).decode('utf-8')
        return decrypted_data, False  # False indicates no error occurred
    except Exception as e:
        return None, True  # True indicates an error occurred


# Create your views here.
@csrf_exempt
@transaction.atomic
@api_view(['POST'])
def recommend_route(request):
    # print("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
    # print("$p value of time is")
    # print(request.data.get('date_time'))
    if not has_access_rights(request, valid_auths=['CUSTOMER']):
        return Response({'error': 'Permission Denied'}, status=403)

    orig_lati = float(request.data.get('pickupLatitude'))
    orig_long = float(request.data.get('pickupLongitude'))
    dest_lati = float(request.data.get('dropoffLatitude'))
    dest_long = float(request.data.get('dropoffLongitude'))
    request_time = request.data.get('date_time')[11:]+':00'

    # convert to the required format
    orig_node, _ = nearest_node(orig_lati, orig_long)
    dest_node, _ = nearest_node(dest_lati, dest_long)
    request_time_sec = time_to_second(request_time)

    # check is in the service area or not
    pointPickup = Point(orig_lati, orig_long)
    pointDropoff = Point(dest_lati, dest_long)

    coords_greene = get_boundary_points('./area/greene_att_v2.txt')
    coords_morgantown = get_boundary_points('./area/morgantown.txt')
    coords_washington1 = get_boundary_points('./area/washington_trinity_point.txt')
    coords_washington2 = get_boundary_points('./area/washington_freedom_transit.txt')
    coords_washington3 = get_boundary_points('./area/washington_hospital.txt')
    poly_greene = Polygon(coords_greene)
    poly_morgantown = Polygon(coords_morgantown)
    poly_washington1 = Polygon(coords_washington1)
    poly_washington2 = Polygon(coords_washington2)
    poly_washington3 = Polygon(coords_washington3)
    if poly_greene.contains(pointPickup) or poly_morgantown.contains(pointPickup) or poly_washington1.contains(pointPickup) or poly_washington2.contains(pointPickup) or poly_washington3.contains(pointPickup):
       print('Pickup is within the service area.')
       is_origin_in_service_area = True
    else:
       print('Pickup is outside the service area.')
       is_origin_in_service_area = False
    # if poly_greene.contains(pointPickup):
    #     is_origin_in_service_area = True
    # else:
    #     is_origin_in_service_area = False

    if poly_greene.contains(pointDropoff) or poly_morgantown.contains(pointDropoff) or poly_washington1.contains(pointDropoff) or poly_washington2.contains(pointDropoff) or poly_washington3.contains(pointDropoff):
        print('Drop-off is within the service area.')
        is_destination_in_service_area = True
    else:
        print('Drop-off is outside the service area.')
        is_destination_in_service_area = False
    # if poly_greene.contains(pointDropoff):
    #     is_destination_in_service_area = True
    # else:
    #     is_destination_in_service_area = False

    rider0 = rider(uniqueID=0, riderID=0, origNode=orig_node, destNode=dest_node, requestTime=request_time_sec,
                   origService=is_origin_in_service_area, destService=is_destination_in_service_area)
    # print("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
    # print(rider0)
    # print(request.data.get('date_time'))
    riderInfo = assignTrip(None, G1, OD_time_mat, busSched, rider0)

    if rider0.orig_FR is not None:
        orig_name = busSched.loc[busSched['stopNode'] == rider0.orig_FR, 'stop_name'].iloc[0]
    else:
        orig_name = rider0.orig_FR

    if rider0.dest_FR is not None:
        dest_name = busSched.loc[busSched['stopNode'] == rider0.dest_FR, 'stop_name'].iloc[0]
    else:
        dest_name = rider0.dest_FR

    if len(rider0.fixedRoute) > 0 and rider0.fixedRoute != ['', '']:
        df_nodes = pd.read_csv(reservation_config.nodes_path)

        fixedRoute_firstNode = rider0.fixedRoute[0].split('_')[0]
        fixedRoute_lastNode = rider0.fixedRoute[len(rider0.fixedRoute) - 1].split('_')[0]
        fixedRoute_firstNode_lat = df_nodes.loc[df_nodes['node'].astype(str) == fixedRoute_firstNode, 'node_latitude'].iloc[0]
        fixedRoute_firstNode_lng = df_nodes.loc[df_nodes['node'].astype(str) == fixedRoute_firstNode, 'node_longitude'].iloc[0]
        fixedRoute_lastNode_lat = df_nodes.loc[df_nodes['node'].astype(str) == fixedRoute_lastNode, 'node_latitude'].iloc[0]
        fixedRoute_lastNode_lng = df_nodes.loc[df_nodes['node'].astype(str) == fixedRoute_lastNode, 'node_longitude'].iloc[0]
        
        context = {
            'riderInfo': riderInfo,
            'mode': rider0.mode,
            'fixedRoute': rider0.fixedRoute,
            'orig_FR': orig_name,
            'dest_FR': dest_name,
            'FR_deptTime': rider0.FR_deptTime,
            'FR_arrTime': rider0.FR_arrTime,
            'fixedRoute_firstNode_lat': fixedRoute_firstNode_lat,
            'fixedRoute_firstNode_lng': fixedRoute_firstNode_lng,
            'fixedRoute_lastNode_lat': fixedRoute_lastNode_lat,
            'fixedRoute_lastNode_lng': fixedRoute_lastNode_lng
        }
    else:
        context = {
            'riderInfo': riderInfo,
            'mode': rider0.mode,
            'fixedRoute': rider0.fixedRoute,
            'orig_FR': orig_name,
            'dest_FR': dest_name,
            'FR_deptTime': rider0.FR_deptTime,
            'FR_arrTime': rider0.FR_arrTime,
        }
    # print(context)
    return Response(context, status=200)


def create_transaction(data,username,mulitiple,count='1'):
    transacSer = TransactionSerializer(data=data, context={'isCreate': True})
    if transacSer.is_valid(raise_exception=False):
        with transaction.atomic():
            transac = transacSer.save()

            passengers = transac.passengers
            pickupDateTime = transac.pickupDateTime
            serviceArea = transac.serviceArea

            try:
                shuttle = pick_shuttle(serviceArea, pickupDateTime, passengers)
            except IndexError:
                transac.delete()
                code = 400
                msg = "No registered shuttle in the area."
                if mulitiple:
                    return {"status_code": str(code), "data": msg}
                else:
                    return JsonResponse({"error": msg}, status=code)

            reservData = {
                'username': username,
                'firstName': transac.firstName,
                'passengers': passengers,
                'pickupDateTime': pickupDateTime,
                'assistant': transac.assistant,
                'pickupAddress': transac.pickupAddress,
                'dropoffAddress': transac.dropoffAddress,
                'phoneNumber': transac.phoneNumber,
                'transaction': transac.pk,
                'shuttle': shuttle.name,
            }

            reservSer = ShuttleReservationSerializer(data=reservData)
            costreturn, error = decrypt_data(data['costData'])
            costis = Decimal(costreturn)
            if error:
                return JsonResponse({'error': 'API data manupulated decryption failed'}, status=400)
            print("######### cost is ",str(costis))
            # dd = transac.costData
            if reservSer.is_valid(raise_exception=False):
                reserv = reservSer.save()
                transac.reservation = reserv
                transac.save()
                if(mulitiple):
                    if transac.isBookedByUser and not balance_checker(transac,count, costis):
                        # transac.delete()
                        return {'status_code':'400','data':'Not enough balance.'}
                else:
                    if transac.isBookedByUser and not proceed_payment(transac,costis):
                        transac.delete()
                        if(mulitiple):
                            return {'status_code':'400','data':'Not enough balance.'}
                        else:
                            return JsonResponse({'error': 'Not enough balance.'}, status=400)

                # NOTE: Using threads in a WSGI application is risky. The WSGI
                # server may terminate long running threads. We instead should
                # use the real scheduler to periodically checkout outdated
                # transactions.
                #
                # now = datetime.datetime.now().astimezone(utc)
                # interval = (pickupDateTime - now).total_seconds() + 300
                # t = Timer(interval, auto_checkout, [transac])
                # t.start()

                account_sid = settings.ACCOUNT_SID
                auth_token = settings.AUTH_TOKEN
                client = Client(account_sid, auth_token)
                # if we allow the unpaid transection, we will need to update the else of this message part to include the correct cost / price. 
                msg = f"Hi {transac.firstName}! Thank you for booking your ride with RAMP Mobility Service. " \
                    f"You will be picked up at {transac.pickupAddress}, on {format_datetime(pickupDateTime)}. " \
                    f"{'Assistant will be provided when boarding and alighting. ' if transac.assistant else ''}" \
                    f"Your destination is {transac.dropoffAddress}. " \
                    f"Please have your confirmation code '{transac.confirmationCode}' ready" \
                    f"{' when you get on board.' if transac.isPaid else f' and pay ${passengers * 0.25:.2f}'}" \
                    f"Best regards."

                transac.pickupPOI, _ = nearest_node(transac.pickupLatitude, transac.pickupLongitude)
                transac.dropoffPOI, _ = nearest_node(transac.dropoffLatitude, transac.dropoffLongitude)
                transac.save()
                client.messages.create(
                    to=transac.phoneNumber,
                    from_=settings.PHONE_NUMBER,
                    body=msg
                )
                if(mulitiple):
                    print(f'this is the respopnse {transacSer.data}')
                    return {'status_code':'201','data':transacSer.data}
                else:
                    print(f'this is the respopnse {transacSer.data}')
                    return JsonResponse(transacSer.data, status=201)
            else:
                transac.delete()
                if(mulitiple):
                    print(f"withing the bad request 400 case 1 {reservSer.errors}")
                    return {'status_code':'400','data':reservSer.errors}
                else:
                    return JsonResponse(reservSer.errors, status=400)
    else:
        if(mulitiple):
            print(f"withing the bad request 400 case 2 {transacSer.errors}")
            return {'status_code':'400','data':transacSer.errors}
        else:
            return JsonResponse(transacSer.errors, status=400)


@csrf_exempt
@transaction.atomic
@api_view(['POST'])
def transaction_create(request):
    if not has_access_rights(request, valid_auths=['CUSTOMER']):
        return Response({'error': 'Permission Denied'}, status=403)

    data = JSONParser().parse(request)
    username = request.user.username
    return create_transaction(data,username,False)


@csrf_exempt
@api_view(['POST'])
def multiple_transactions(request):
    if not has_access_rights(request, valid_auths=['CUSTOMER']):
        return Response({'error': 'Permission Denied'}, status=403)

    data_list = JSONParser().parse(request)
    print(data_list)
    response_data = ''
    # count how many sthull * .25 ( < avl. ? :) 
    num_elements = len(data_list)
    for data in data_list:
        print(f'!!!@@@ {data}')
        new_data = {**data, 'username': request.user.username}
        
        # # Assuming create_transaction function is defined
        response = create_transaction(new_data, request.user.username, True, num_elements)
        
        if response['status_code'] == 201:
            response_data = response['data']
        # else:
            # return JsonResponse(response['data'], safe=False, status=response['status_code'])

    return JsonResponse(response['data'], safe=False, status=response['status_code'])


@transaction.atomic
def auto_checkout(transac: Transaction):
    now = datetime.datetime.now().astimezone(utc)
    thresh = now + timedelta(hours=5)
    # customer does not show up (misses the shuttle)
    if not transac.isCanceled and not transac.isBoarded and not transac.isMissed and thresh >= transac.pickupDateTime:
        transac.isMissed = True
        transac.save()


def pick_shuttle(serviceArea: ServiceArea, pickupTime: datetime, passengers: int) -> Shuttle:
    """
    Pick a shuttle from all available ones, currently always choose the first one
    """
    return serviceArea.get_available_shuttles(pickupTime, passengers)[0]


@transaction.atomic
def balance_checker(transac: Transaction,count , costis) -> bool:
    """
    Check for availalble balance and return value based on if no of trips are possible in available balance. 
    return:
        isCompleted: a boolean value indicate whether the balance is there to complete the trip. 
    """
    customer = transac.customer
    serviceArea = transac.serviceArea
    #charge = serviceArea.get_price(transac.passengers)
    charge = costis * transac.passengers
    price = charge * count 
    # check for enough balance
    if customer.balance >= price:
        return True
    else:
        return False


@transaction.atomic
def proceed_payment(transac: Transaction, tripCost: Decimal) -> bool:
    """
    Handle payment of a newly created transaction
    return:
        isCompleted: a boolean value indicate whether the payment completes
    """
    customer = transac.customer
    serviceArea = transac.serviceArea
    charge = serviceArea.get_price(transac.passengers)
    # price = charge
    price = tripCost * transac.passengers
    # check for enough balance
    if customer.balance >= price:
        customer.balance -= price
        customer.save()
        transac.charge = price
        transac.save()
        return True
    else:
        return False


def proceed_refund(transac: Transaction) -> float:
    """
    Utility function to calculate and proceed refund
    """
    customer = transac.customer
    serviceArea = transac.serviceArea

    # initialize a zero refund
    refund = serviceArea.get_price(0)
    refund = Decimal(0)

    # only paid transaction will get refund
    if transac.isPaid:
        if transac.isCanceled:  # refund all ticket charge for cancelled transactions
            #refund = serviceArea.get_price(transac.passengers)
            refund = transac.charge
        # else:   # refund for early checkout
        #     earlyLeave = max(0, int((transac.scheduledLeaveTime - transac.checkOutTime).total_seconds() / 60))
        #     unitCnt = math.floor(earlyLeave / unitMins)
        #     refund = unitCnt * serviceArea.price / 4 * serviceArea.checkOutRate
        #     if refund < 0:
        #         refund = 0

    customer.balance += refund
    customer.save()
    transac.refund = refund
    transac.save()
    return refund


def proceed_difference(transac: Transaction, newPassenger: int, oldPassenger: int) -> float:
    """
    Utility function to calculate and proceed extra payment or refund
    """
    customer = transac.customer
    costperPassenger = transac.charge / oldPassenger
    newCost = costperPassenger * newPassenger
    price = transac.charge - newCost
    if customer.balance >= price:
        customer.balance -= price
        customer.save()
        transac.charge += price
        if price < 0:
            transac.refund -= price
        else:
            transac.refund = Decimal(0)
        transac.save()
        return True
    else:
        return False



@api_view(['GET'])
def check_service_area(request):
    """
    Fetch information of the given parkinglot
    """
    print('start reservation.views.CheckServiceArea ...')
    if 'serviceArea' not in request.GET or 'pickupTime' not in request.GET:
        return Response({'error': 'Missing required fields'}, status=400)

    serviceAreaName = request.GET.get('serviceArea')

    if not ServiceArea.objects.filter(name__exact=serviceAreaName).exists():
        return Response({'error': 'Invalid service area name'}, status=400)

    serviceArea = ServiceArea.objects.get(name__exact=serviceAreaName)
    context = {
        'price': serviceArea.price,
        'name': serviceArea.name,
    }

    return Response(context, status=200)


@api_view(['GET'])
def transaction_list(request):
    """
    Fetch all reservation records of the user
    """
    if not has_access_rights(request, valid_auths=['CUSTOMER']):
        return Response({'error': 'Permission Denied'}, status=403)

    username = request.user.username
    qs = Transaction.objects.filter(customer__user__username__exact=username)
    serializer = TransactionSerializer(qs, many=True)
    return Response(serializer.data, status=200)


@api_view(['GET'])
def transaction_list_all(request):
    """
    Fetch all reservation records of the user
    """
    if not has_access_rights(request, valid_auths=['MANAGER']):
        return Response({'error': 'Permission Denied'}, status=403)

    qs = Transaction.objects
    serializer = TransactionSerializer(qs, many=True)
    return Response(serializer.data, status=200)
@api_view(['GET'])
def transaction_list_recent_and_future(request):
    """
    Fetch reservation records of the user from one day past until all future records based on pickupDateTime
    """
    if not has_access_rights(request, valid_auths=['MANAGER']):
        return Response({'error': 'Permission Denied'}, status=403)

    now = timezone.now()

    one_day_past = now - timedelta(days=1)

    qs = Transaction.objects.filter(pickupDateTime__gte=one_day_past)

    serializer = TransactionSerializer(qs, many=True)

    return Response(serializer.data, status=200)
@api_view(['POST'])
def get_depo_info_all(request):
    """
    Fetch all reservation records of the user
    """
    if not has_access_rights(request, valid_auths=['SHUTTLE_DRIVER']):
        return Response({'error': 'Permission Denied'}, status=403)
    username = request.data.get('userParam').get('username')
    customer = get_object_or_404(Customer, user__username=username)
    shuttle_driver_record = ShuttleDriverLogin.objects.filter(customer=customer).order_by('-datetimestamp').first()
    shuttle_record = Shuttle.objects.filter(shuttle_id_virtual=shuttle_driver_record.shuttle_id)
    depo_name = shuttle_record[0].depot_lookup_id
    qs = ShuttleDepots.objects.filter(name=depo_name)
    serializer = ShuttleDepotsSerializer(qs, many=True)
    return Response(serializer.data, status=200)

@api_view(['POST'])
def transaction_list_shuttle(request):
    """
    Fetch all reservation records of the user
    """
    if not has_access_rights(request, valid_auths=['SHUTTLE_DRIVER']):
        return Response({'error': 'Permission Denied'}, status=403)

    username = request.data.get('username')
    print(f"Username is {username}")

    customer = get_object_or_404(Customer, user__username=username)
    print(f"Customer obj is {customer}")
    shuttle_driver_record = ShuttleDriverLogin.objects.filter(customer=customer).order_by('-datetimestamp').first()
    shuttle_record = Shuttle.objects.filter(shuttle_id_virtual=shuttle_driver_record.shuttle_id)
    print(f'this the id from the shuttle virtual id {shuttle_record[0].allocated} and the id from driver record is {shuttle_driver_record.shuttle_id}')
    if shuttle_driver_record.shuttle_id and shuttle_record[0].allocated:
        shuttle_id = shuttle_driver_record.shuttle_id
        transaction_id_list = list(ShuttleReservation.objects.filter(shuttle_id=shuttle_id).values_list('transaction_id', flat=True))
        qs = Transaction.objects.filter(id__in=transaction_id_list)
        serializer = TransactionSerializer(qs, many=True)
        return Response(serializer.data, status=200)
    else:
        return Response({'error': 'Select shutle error'}, status=404)


@api_view(['GET'])
def check_modify(request):
    """
    Query for the extension options
    """
    if not has_access_rights(request, valid_auths=['CUSTOMER', 'MANAGER']):
        return Response({'error': 'Permission Denied'}, status=403)

    if 'tranId' not in request.GET:
        return Response({'error': 'Missing required fields'}, status=400)

    tranId = request.GET.get('tranId')
    if not Transaction.objects.filter(pk=tranId).exists():
        return Response({'error': 'Invalid transaction'}, status=400)

    transac = Transaction.objects.get(pk=tranId)
    if request.user.username != transac.customer.user.username:
        return Response({'error': 'Unauthorized action'}, status=401)

    return Response({}, status=200)


@transaction.atomic
@api_view(['POST'])
def transaction_action(request):
    """
    Handle actions including check in, check out, extend and cancel
    """
    print('start reservation.views.TransactionAction ...',request.data)
    if 'username' not in request.data or 'action' not in request.data \
            or 'tranId' not in request.data or 'isBoarded' not in request.data \
            or 'auth' not in request.data:
        return Response({}, status=404)
    username = request.data.get('username')
    action = request.data.get('action')
    tranId = request.data.get('tranId')
    boarded = request.data.get('isBoarded')
    auth = int(request.data.get('auth'))

    data = request.data
    if not Transaction.objects.filter(pk=tranId).exists():
        data["error"] = "Specified reservation not found!"
        return Response(data, status=400)
    transac = Transaction.objects.get(pk=tranId)
    phoneNumber = transac.phoneNumber
    if action == "cancel" or action == "modify" or action == "missed":
        if (transac.customer.user.username != username) and (auth != 2) and (auth != 1) :
            data["error"] = "You are not authorized to modify this reservation!"
            return Response(data, status=400)

    # Check access
    valid_auths = []
    if action == 'cancel' or action == 'modify':
        valid_auths = ['CUSTOMER', 'MANAGER']
    else:
        valid_auths = ['SHUTTLE_DRIVER']
    if not has_access_rights(request, valid_auths=valid_auths):
        return Response({'error': 'Permission Denied'}, status=403)

    if action == 'cancel':
        print('action == cancel')
        data['isCanceled'] = True
        serializer = TransactionSerializer(
            transac,
            data,
            context={"isCreate": False},
            partial=True
        )
        if serializer.is_valid(raise_exception=True):
            now = datetime.datetime.now().astimezone(utc)
            if transac.pickupDateTime < now + timedelta(minutes=15.0):
                data["error"] = "Cannot cancel an active transaction!"
                return Response(data, status=401)
            shuttleReservation = transac.shuttleAllocation
            shuttleReservation.delete()

            serializer.save()
            refund = proceed_refund(transac)
            ctx = serializer.data
            ctx['refund'] = refund

            account_sid = settings.ACCOUNT_SID
            auth_token = settings.AUTH_TOKEN
            client = Client(account_sid, auth_token)

            msg = \
                "Hi {}! We received your request to cancel the following reservation. " \
                "Pickup Time: {}. " \
                "Pickup Address: {}. " \
                "Drop-off Address: {}. " \
                "Number of Passengers: {}. " \
                "See you on the next ride.". \
                    format(
                    str(transac.firstName),
                    format_datetime(transac.pickupDateTime),
                    transac.pickupAddress,
                    transac.dropoffAddress,
                    transac.passengers,
                )

            client.messages.create(
                to=phoneNumber,
                from_=settings.PHONE_NUMBER,
                body=msg
            )

            return Response(ctx, status=200)
    elif action == 'modify':
        print('action == modify')

        oldPassengers = transac.passengers
        newPassengers = int(request.data.get('passengers'))
        diffPassengers = newPassengers - oldPassengers
        if diffPassengers != 0:
            print('diffPassengers', diffPassengers)
            if not proceed_difference(transac, newPassengers, oldPassengers):
                return Response({'error': 'Not enough balance.'}, status=400)

        serializer = TransactionSerializer(
            transac,
            data,
            context={"isCreate": False},
            partial=True
        )
        if serializer.is_valid(raise_exception=False):
            serializer.save()
            shuttleReservation = transac.shuttleAllocation
            shuttleReservation.pickupDateTime = transac.pickupDateTime
            shuttleReservation.passengers = transac.passengers
            shuttleReservation.save()

            account_sid = settings.ACCOUNT_SID
            auth_token = settings.AUTH_TOKEN
            client = Client(account_sid, auth_token)

            msg = \
                "Hi {}! We received your request to change your reservation. " \
                "Here is your updated reservation. " \
                "Pickup Time: {}. " \
                "Pickup Address: {}. " \
                "Drop-off Address: {}. " \
                "Number of Passengers: {}. " \
                "Access Assistant: {}. " \
                "Confirmation Code: {}. " \
                "Best regards.". \
                    format(
                    str(shuttleReservation.firstName),
                    format_datetime(shuttleReservation.pickupDateTime),
                    shuttleReservation.pickupAddress,
                    shuttleReservation.dropoffAddress,
                    shuttleReservation.passengers,
                    "Yes" if shuttleReservation.assistant else "No",
                    transac.confirmationCode,
                )

            client.messages.create(
                to=phoneNumber,
                from_=settings.PHONE_NUMBER,
                body=msg
            )

            return Response(serializer.data, status=201)
        else:
            return Response(serializer.errors, status=400)
    elif action == 'board':
        print('action == board')
        data['isBoarded'] = True
        serializer = TransactionSerializer(
            transac,
            data,
            context={"isCreate": False},
            partial=True
        )
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            ctx = serializer.data

            return Response(ctx, status=200)
    elif action == 'alight':
        print('action == alight')
        data['isBoarded'] = True
        data['isAlighted'] = True
        serializer = TransactionSerializer(
            transac,
            data,
            context={"isCreate": False},
            partial=True
        )
        if serializer.is_valid(raise_exception=True):
            shuttleReservation = transac.shuttleAllocation
            shuttleReservation.delete()

            serializer.save()
            ctx = serializer.data

            return Response(ctx, status=200)
    elif action == 'missed':
        print('action == missed')
        data['isMissed'] = True
        serializer = TransactionSerializer(
            transac,
            data,
            context={"isCreate": False},
            partial=True
        )
        if serializer.is_valid(raise_exception=True):
            print("valid serializer ")
            now = datetime.datetime.now().astimezone(utc)
            if transac.pickupDateTime > now - timedelta(minutes=2.0):
                data["error"] = "Cannot mark missed pickupTime in Future !"
                return Response(data, status=401)

            shuttleReservation = transac.shuttleAllocation
            shuttleReservation.delete()
            serializer.save()
            ctx = serializer.data
            return Response(ctx, status=200)

    return Response({}, status=401)


def format_datetime(time):
    """
    format pickupDateTime
    """
    hours, meridiem = format_hour(time.hour)
    dt = str(time.year) + '-' + str(time.month) + '-' + str(time.day) + ' ' + hours + ':' + str(time.minute) + meridiem
    return dt


def format_hour(hours):
    """
    convert 24 hour to AM/PM format
    """
    if hours > 12:
        return [str(hours - 12), 'PM']
    else:
        return [str(hours), 'AM']


def get_boundary_points(input_file_path):
    from django.conf import settings
    coords = []
    with open(os.path.join(settings.BASE_DIR, input_file_path)) as f:
        for line in f:
            points = list(map(float, line.split(',')))
            coords.append(points)
    return coords


def is_valid_number(client, number):
    try:
        response = client.lookups.phone_numbers(number).fetch(type="carrier")
        return True
    except TwilioRestException as e:
        if e.code == 20404:
            return False
        else:
            raise e


@api_view(['GET'])
def history_list(request):
    """
    Fetch all reservation records of the user
    """
    if not has_access_rights(request, valid_auths=['CUSTOMER']):
        return Response({'error': 'Permission Denied'}, status=403)

    username = request.user.username
    now = datetime.datetime.now().astimezone(utc)
    qs = RecommendationHistory.objects.filter(customer__user__username__exact=username, pickupDateTime__gte=now,reservation=False)
    serializer = RecommendationHistorySerializer(qs, many=True)
    return Response(serializer.data, status=200)


def message_trip(customer, trip):
    """Send a text message to *customer* about *trip*.

    *customer* should be an 'account.models.Customer' instance. *trip* should
     be a dict created by 'recommend_route'.

    """
    template = (
        "Thank you for using RAMP service. "
        "Your trip information: {}, {}, {}."
    )
    mode_names = {0: "walk",
                  1: "take on-demand van",
                  2: "take fixed-route shuttle"}

    orig = trip["orig_FR"]
    dest = trip["dest_FR"]
    modes = trip["mode"]
    parts = [f"(1) {mode_names[modes[0]]} to {orig}",
             f"(2) {mode_names[modes[1]]} from {orig} to {dest}",
             f"(3) {mode_names[modes[2]]} to {dest}"]
    message = template.format(*parts)
    logging.debug(f"Sending text message to {customer.tel}: {message}")
    client = Client(settings.ACCOUNT_SID, settings.AUTH_TOKEN)
    client.messages.create(to=customer.tel,
                           from_=settings.PHONE_NUMBER,
                           body=message)


@api_view(['POST'])
def history_list_create(request):
    """
    Fetch all reservation history records of the user
    """
    if not has_access_rights(request, valid_auths=['CUSTOMER']):
        return Response({'error': 'Permission Denied'}, status=403)

    username = request.user.username
    serializer = RecommendationHistorySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    if serializer.is_valid():
        history = serializer.save(username=username)
        if history.reservation:
            try:
                message_trip(request.user.customer, history.recommendation_obj)
            except Exception as e:
                logger.error(f"Failed to send text message to user {username}"
                             f"(exception: {e})")
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)



@api_view(['GET'])
def get_history_record(request):
    if not has_access_rights(request, valid_auths=['CUSTOMER']):
        return Response({'error': 'Permission Denied'}, status=403)

    username = request.user.username
    pickupAddress = request.GET.get('pickupAddress', '')
    dropoffAddress = request.GET.get('dropoffAddress', '')
    passengers = request.GET.get('passengers', '')
    now = datetime.datetime.now().astimezone(utc)
    qs = RecommendationHistory.objects.filter(
        Q(customer__user__username__exact=username) &
        Q(pickupDateTime__gte=now) &
        Q(reservation=True)&
        Q(passengers__exact=passengers) &
        Q(pickupAddress=pickupAddress) | Q(dropoffAddress=dropoffAddress)
    )
    serializer = RecommendationHistorySerializer(qs, many=True)
    return Response(serializer.data, status=200)


@api_view(['GET'])
def getShuttleAvailability(request):
    print('GET request for shuttle availability ')

    if not has_access_rights(request, valid_auths=['SHUTTLE_DRIVER']):
        return Response({'error': 'Permission Denied'}, status=403)

    qs = Shuttle.objects.filter(
        Q(allocated=False) & Q(inservice=False)
    )
    serializer = ShuttleSerializer(qs, many=True)
    print(' @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ response from shuttle availability is ')
    print(serializer.data)
    return Response(serializer.data,status=200)


@api_view(['GET'])
def getShuttleAll(request):
    print('GET request for shuttle all records ')
    if not has_access_rights(request, valid_auths=['MANAGER']):
        return Response({'error': 'Permission Denied'}, status=403)

    qs = Shuttle.objects.all()
    serializer = ShuttleSerializer(qs, many=True)
    print(' @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ response from shuttle get all is ')
    print(serializer.data)
    return Response(serializer.data,status=200)


@api_view(['POST'])
def setShuttleById(request):
    if not has_access_rights(request, valid_auths=['MANAGER']):
        return Response({'error': 'Permission Denied'}, status=403)

    data = JSONParser().parse(request)
    shuttle_id = data.get('id')

    try:
        shuttle = Shuttle.objects.get(id=shuttle_id)
        
        shuttle.make = data.get('make', shuttle.make)
        shuttle.model = data.get('model', shuttle.model)
        shuttle.color = data.get('color', shuttle.color)
        shuttle.platenumber = data.get('Platenumber', shuttle.platenumber)
        shuttle.capacity = data.get('capacity', shuttle.capacity)

        shuttle.save()

        response_data = {
            'id': shuttle.id,
            'make': shuttle.make,
            'model': shuttle.model,
            'color': shuttle.color,
            'platenumber': shuttle.platenumber,
            'capacity': shuttle.capacity,
            'message': 'Shuttle updated successfully.'
        }
        return Response(response_data, status=status.HTTP_200_OK)

    except Shuttle.DoesNotExist:
        return Response({'error': 'Shuttle not found.'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def update_shuttle_allocation(request):
    print("within post req. for set shuttle allocation")
    if not has_access_rights(request, valid_auths=['SHUTTLE_DRIVER', 'MANAGER']):
        return Response({'error': 'Permission Denied'}, status=403)

    try:
        shuttle_id = request.data['id']
        allocated = request.data['allocated']
        shuttle = Shuttle.objects.get(id=shuttle_id)
        shuttle.allocated = allocated
        shuttle.save()

        return Response({"message": f"Shuttle with ID {shuttle_id} updated successfully."}, status=status.HTTP_200_OK)

    except Shuttle.DoesNotExist:
        return Response({"message": "Shuttle not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def update_shuttle_inservice(request):
    print("within post req. for set shuttle allocation")
    try:
        shuttle_id = request.data['id']
        inservice = request.data['inservice']
        shuttle = Shuttle.objects.get(id=shuttle_id)
        shuttle.inservice = inservice
        shuttle.save()

        return Response({"message": f"Shuttle with ID {shuttle_id} updated successfully."}, status=status.HTTP_200_OK)

    except Shuttle.DoesNotExist:
        return Response({"message": "Shuttle not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@ api_view(['POST'])
def update_shuttle_properties(request):
    if not has_access_rights(request, valid_auths=['MANAGER']):
        return Response({'error': 'Permission Denied'}, status=403)

    try:
        shuttle_id = request.data['id']
        capacity = request.data['capacity']
        depot_id = request.data['capdepot_idacity']
        starttime = request.data['starttime']
        endtime = request.data['endtime']
        shuttle = Shuttle.objects.get(id=shuttle_id)
        shuttle.capacity = capacity
        shuttle.depot_id = depot_id
        shuttle.starttime = starttime
        shuttle.endtime = endtime
        shuttle.save()

        return Response({"message": f"Shuttle with ID {shuttle_id} updated successfully."}, status=status.HTTP_200_OK)

    except Shuttle.DoesNotExist:
        return Response({"message": "Shuttle not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)


def get_distance_from_json(orig_node, dest_node):
    travel_key = f"{orig_node},{dest_node}"
    with open(reservation_config.OD_dist_mat_path, 'r') as f:
        data = json.load(f)
    return data.get(travel_key, None)  


def get_time_from_json(orig_node, dest_node):
    travel_key = f"{orig_node},{dest_node}"
    with open(reservation_config.OD_time_mat_path, 'r') as f:
        data = json.load(f)
    return data.get(travel_key, None)    


@api_view(['POST'])
def req_calculation(request):
    print("POST REQ MADE TO /req_calculation api with data ", request.data)
    if not has_access_rights(request, valid_auths=['SHUTTLE_DRIVER']):
        return Response({'error': 'Permission Denied'}, status=403)

    try:
        shuttle_lati = float(request.data.get('currentLat'))
        shuttle_long = float(request.data.get('currentLng'))
        nextpickup_lati = float(request.data.get('nextTrip')['pickupLatitude'])
        nextpickup_long = float(request.data.get('nextTrip')['pickupLongitude'])
        username = request.data.get('username')
        customer = get_object_or_404(Customer, user__username=username)
        shuttle_driver_record = ShuttleDriverLogin.objects.filter(customer=customer).order_by('-datetimestamp').first()
        shuttle_record = Shuttle.objects.filter(shuttle_id_virtual=shuttle_driver_record.shuttle_id)
        shuttle_node = nearest_node_return(shuttle_lati, shuttle_long)
        nextpickup_node = nearest_node_return(nextpickup_lati, nextpickup_long)
        depo_node = shuttle_record[0].depot_id     
        td_sd = get_distance_from_json(shuttle_node,depo_node)
        tt_sp = get_time_from_json(shuttle_node,nextpickup_node)
        tt_sd = get_time_from_json(shuttle_node,depo_node)
        tt_dp = get_time_from_json(depo_node,nextpickup_node)
        if tt_sd is None:
            return JsonResponse({'error': 'Travel time and distance data not found for the provided nodes.tt_sd'}, status=404)
        if tt_sp is None:
            return JsonResponse({'error': 'Travel time and distance data not found for the provided nodes. tt_sp'}, status=404)
        if tt_sd is None:
            return JsonResponse({'error': 'Travel time and distance data not found for the provided nodes. tt_sd'}, status=404)
        if tt_dp is None:
            return JsonResponse({'error': 'Travel time and distance data not found for the provided nodes. tt_dp'}, status=404)
        data = {
            "tt_sp": tt_sp,
            "tt_sd": tt_sd,
            "tt_dp": tt_dp,
            "td_sd": td_sd
        }
        return JsonResponse({'data': data}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def req_calculation_distance_based_cost(request):
    print("POST REQ MADE TO /req_calculation api with data ", request.data)
    
    try:
        start_loc = request.data.get('startLoc')
        end_loc = request.data.get('endLoc')
        p_lat = float(start_loc.get('lat'))
        p_lng = float(start_loc.get('lng'))
        d_lat = float(end_loc.get('lat'))
        d_lng = float(end_loc.get('lng'))
        start_node = nearest_node_return(p_lat,p_lng)
        end_node = nearest_node_return(d_lat,d_lng)
        dist_start_end_node = get_distance_from_json(start_node,end_node)
        cost = float(0)
        if dist_start_end_node < 2:
            cost += 2.25
        elif dist_start_end_node < 4:
            cost += 2.85
        elif dist_start_end_node < 7:
            cost += 3.60
        elif dist_start_end_node < 12:
            cost += 4.80
        elif dist_start_end_node < 20:
            cost += 5.70
        elif dist_start_end_node < 25:
            cost += 6.45
        else:
            cost += 7.50
        encrypted_cost = encrypt_data(str(cost))
        return JsonResponse({'cost': str(cost),'data': encrypted_cost}, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def set_shuttle(request, transaction_id):
    """Explicitly assign a shuttle to transaction of *transaction_id*."""
    if not has_access_rights(request, valid_auths=['MANAGER']):
        return Response({'error': 'Permission Denied'}, status=403)

    transaction = get_object_or_404(Transaction, pk=transaction_id)
    serializer = ShuttleReservationSerializer(transaction.shuttleAllocation,
                                              data=request.data,
                                              partial=True)
    if serializer.is_valid():
        serializer.save()
        return JsonResponse(data=serializer.data, status=200)
    else:
        return JsonResponse(data=serializer.errors, status=400)
