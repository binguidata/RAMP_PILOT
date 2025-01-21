from rest_framework import serializers
from dialin.models import DialinUser


class DialinUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = DialinUser
        fields = ['id', 'first_name', 'last_name', 'username', 'cellphone_number', 'email_address', 'signed_consent']
