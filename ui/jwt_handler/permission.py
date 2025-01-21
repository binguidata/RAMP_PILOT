from enum import Enum
from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication


JWT_authenticator = JWTAuthentication()


class Auth(Enum):
    CUSTOMER = 0
    SHUTTLE_DRIVER = 1
    MANAGER = 2
    BUS_DRIVER = 3


def has_access_rights(request, valid_auths):
    token_response = JWT_authenticator.authenticate(request)
    user, token = token_response
    if token.payload['auth'] not in [Auth[auth].value for auth in valid_auths]:
        return False
    return True
