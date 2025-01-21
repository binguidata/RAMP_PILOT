from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

JWT_authenticator = JWTAuthentication()


class JWTMiddleware:

    EXCLUDED_PATHS = [
        '/',
        '/api/register',
        '/api/hello',
        '/api/forget_password',
        '/api/token',
        '/api/token/refresh',
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path in self.EXCLUDED_PATHS or request.path.startswith('/admin'):
            return self.get_response(request)

        if 'Authorization' not in request.headers:
            return JsonResponse({'error': 'Invalid Authorization header'}, status=401)

        auth_header = request.headers['Authorization']
        auth_parts = auth_header.split()

        if len(auth_parts) != 2 or auth_parts[0] != 'JWT':
            return JsonResponse({'error': 'Invalid token type'}, status=401)

        try:
            response = JWT_authenticator.authenticate(request)
            user, token = response
            if not user:
                return JsonResponse({'error': 'Unauthorized access'}, status=401)

        except InvalidToken:
            return JsonResponse({'error': 'Invalid token or expired'}, status=401)
        except TokenError:
            return JsonResponse({'error': 'Invalid token'}, status=401)

        return self.get_response(request)
