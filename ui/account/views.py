import enum

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from account.models import Customer
from account.serializers import CustomerProfileSerializer
from jwt_handler.permission import has_access_rights


# Initial balance for a customer upon registration
INITIAL_BALANCE = 0


class UserGroups(enum.Enum):
    customer = 0
    driver = 1
    manager = 2
    admin = 3


# Register view function for customers
@api_view(['POST'])
@permission_classes([AllowAny])
def user_register(request):
    request.data['role'] = UserGroups.customer.value
    serializer = CustomerProfileSerializer(data=request.data)

    # Check if username, tel, email is duplicated
    users_username = User.objects.filter(username=request.data['username'])
    if len(users_username) > 0:
        return Response({"msg": "Current username has been used"}, 
                        status=status.HTTP_406_NOT_ACCEPTABLE)

    users_tel = Customer.objects.filter(tel=request.data['tel'])
    if len(users_tel) > 0:
        return Response({"msg": "Current phone number has been used"}, 
                        status=status.HTTP_406_NOT_ACCEPTABLE)

    email_in_use = User.objects.filter(email=request.data['email']).exists()
    # Check if any records exist with the provided email
    if email_in_use:
        # If email is found, return a response that the email is already in use
        return Response({"msg": "Current email has been used"}, status=status.HTTP_406_NOT_ACCEPTABLE)

    # Keep checking the validity of the password
    if request.data['password'] != request.data['repassword']:
        return Response({"msg": "Password should be the same"}, status=status.HTTP_406_NOT_ACCEPTABLE)
    if len(request.data['password']) < 8:
        return Response({"msg": "Password should be at least 8 characters"}, status=status.HTTP_406_NOT_ACCEPTABLE)

    if serializer.is_valid():
        customer = serializer.save()
        # NOTE: This may be a bit inefficient
        customer.balance = INITIAL_BALANCE
        customer.save()
        if customer:
            return Response({"msg": "Register Success"}, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Register view function for shuttle drivers
@api_view(['POST'])
@permission_classes([AllowAny])
def shuttle_user_register(request):
    request.data['role'] = UserGroups.driver.value
    serializer = CustomerProfileSerializer(data=request.data)
    # Serializer
    if serializer.is_valid():
        customer = serializer.save()
        if customer:
            context = check_auth(customer)
            return Response(context, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Register view function for managers
@api_view(['POST'])
@permission_classes([AllowAny])
def manage_user_register(request):
    request.data['role'] = UserGroups.manager.value
    serializer = CustomerProfileSerializer(data=request.data)
    # Serializer
    if serializer.is_valid():
        customer = serializer.save()
        if customer:
            context = check_auth(customer)
            return Response(context, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Check customer's permission and auth
def check_auth(customer):
    user_name = customer.user.username
    cur_user = User.objects.get(username=user_name)
    strr = list(cur_user.get_all_permissions())[0]
    context = {'auth': False}
    if strr and strr == 'shuttle.view_shuttlelocation':
        context['auth'] = True
    return context


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def fetch_profile(request):
    customer = Customer.objects.get(user__username__exact=request.user.username)
    data = {
        'username': customer.user.username,
        'tel': customer.tel,
        'first_name': customer.first_name,
        'last_name': customer.last_name,
        'balance': customer.balance,
        'email': customer.user.email,
    }

    return Response(data, status=200)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def modify_profile(request):
    customer = Customer.objects.get(user__username__exact=request.user.username)
    if 'tel' in request.data:
        customer.tel = request.data.get('tel')
    if 'first_name' in request.data:
        customer.first_name = request.data.get('first_name')
    if 'last_name' in request.data:
        customer.last_name = request.data.get('last_name')
    if 'email' in request.data:
        customer.user.email = request.data.get('email')
        customer.user.save()
    customer.save()

    if 'password' in request.data:
        user = User.objects.get(username=request.user.username)
        user.set_password(request.data.get('password'))
        user.save()

    serializer = CustomerProfileSerializer(customer)
    return Response(serializer.data, status=200)


@api_view(['POST'])
@permission_classes([AllowAny])
def forget_password(request):
    # user = request.POST['user']
    email = request.data['email']
    users = User.objects.filter(email=email)

    if len(users) == 0:
        return Response({'msg': 'Account does not exist'}, status=200)
    else:
        user = users[0]
        import random
        random_password = ""
        for x in range(8):
            random_num = str(random.randint(0, 9))
            random_low_alpha = chr(random.randint(97, 122))
            random_upper_alpha = chr(random.randint(65, 90))
            random_char = random.choice([random_num, random_low_alpha, random_upper_alpha])
            random_password += random_char

        user.set_password(random_password)
        user.save()

        content_plain = "Hi, thanks for using us application, your new password is: %s" % random_password
        from django.core.mail import send_mail
        from django.conf import settings
        send_mail(
            subject='Reset password',
            message=content_plain,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[email]
        )
        return Response({'msg': 'Success'}, status=200)


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['auth'] = user.customer.role
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        refresh = self.get_token(self.user)
        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)
        #
        # Add extra responses here
        data['username'] = self.user.username
        data['auth'] = int(self.user.customer.role)
        return data


@api_view(['GET'])
@permission_classes([IsAuthenticated, ])
def auth_hello(request):
    user_name = request.user.username
    cur_user = User.objects.get(username=user_name)
    context = {'auth': False}
    return Response(context, status=status.HTTP_200_OK)


# View all customer type accounts
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def view_all_customers(request):
    if not has_access_rights(request, valid_auths=['MANAGER']):
        return Response({'error': 'Permission Denied'}, status=403)
    
    customers = Customer.objects.filter(role=0)
    serializer = CustomerProfileSerializer(customers, many=True)
    return Response(serializer.data)


# View all driver type accounts
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def view_all_drivers(request):
    if not has_access_rights(request, valid_auths=['MANAGER']):
        return Response({'error': 'Permission Denied'}, status=403)
    
    drivers = Customer.objects.filter(role__in=[1, 3])
    serializer = CustomerProfileSerializer(drivers, many=True)
    return Response(serializer.data)


# View all manager type accounts
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def view_all_managers(request):
    if not has_access_rights(request, valid_auths=['MANAGER']):
        return Response({'error': 'Permission Denied'}, status=403)
    
    managers = Customer.objects.filter(role=2)
    serializer = CustomerProfileSerializer(managers, many=True)
    return Response(serializer.data)


# Modify the role of driver type accounts
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def modify_driver_role(request):
    if not has_access_rights(request, valid_auths=['MANAGER']):
        return Response({'error': 'Permission Denied'}, status=403)
    
    username = request.data['username']
    new_role = int(request.data['new_role'])
    driver = Customer.objects.get(user__username=username)
    if driver.role in [1, 3] and new_role in [1, 3]:
        driver.role = new_role
        driver.save()
        return Response({'msg': 'Role modified successfully'}, status=200)
    else:
        return Response({'msg': 'Invalid request'}, status=400)


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
