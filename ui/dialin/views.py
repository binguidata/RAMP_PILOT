from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from dialin.models import DialinUser
from dialin.serializers import DialinUserSerializer

from jwt_handler.permission import has_access_rights


@api_view(['GET', 'POST', 'PUT', 'DELETE'])
def dialin(request, pk=0):
    if not has_access_rights(request, valid_auths=['MANAGER']):
        return Response({'error': 'Permission Denied'}, status=403)

    if request.method == 'GET':
        return list_dialin_users(request)
    elif request.method == 'POST':
        return create_dialin_user(request)
    elif request.method == 'PUT':
        return update_dialin_user(request, pk)
    elif request.method == 'DELETE':
        return delete_dialin_user(request, pk)


# Create your views here.
def list_dialin_users(request):
    users = DialinUser.objects
    serializer = DialinUserSerializer(users, many=True)
    return Response(serializer.data, status=200)


def create_dialin_user(request):
    serializer = DialinUserSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


def update_dialin_user(request, pk):
    user = DialinUser.objects.get(pk=pk)
    serializer = DialinUserSerializer(user, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


def delete_dialin_user(request, pk):
    user = get_object_or_404(DialinUser, pk=pk)
    user.delete()
    return Response({'message': 'User deleted successfully'}, status=204)
