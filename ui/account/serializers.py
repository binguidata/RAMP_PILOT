from rest_framework import serializers
from account.models import Customer
from django.contrib.auth.models import User


class CustomerProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    password = serializers.CharField(min_length=8, write_only=True)
    email = serializers.EmailField(source='user.email', required=True)

    class Meta:
        model = Customer
        fields = ['username', 'password', 'email', 'tel', 'first_name', 'last_name', 'balance', 'role']
        read_only = ['balance', 'role']

    def create(self, validated_data):
        user_data = validated_data.pop('user', {})

        password = validated_data.pop('password', None)
        user = User(**user_data)
        if password is not None:
            user.set_password(password)
        user.save()

        customer = Customer(user=user, **validated_data)
        customer.save()

        return customer

    def update(self, instance, validated_data):
        user = instance.user

        user.password = validated_data.get('password', user.password)
        user.email = validated_data.get('email', user.email)
        user.save()

        instance.tel = validated_data.get('tel', instance.tel)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.balance = validated_data.get('balance', instance.balance)
        instance.save()

        return instance
