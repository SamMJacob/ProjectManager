from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from api.serializers.auth import RegisterSerializer, UserSerializer

_SECURE_COOKIE = not settings.DEBUG
# Use SameSite=None in production (HTTPS) so cookies are sent on all requests
# regardless of how the frontend/backend are deployed. Requires Secure=True.
# In dev (DEBUG=True) fall back to Lax so HTTP localhost still works.
_SAMESITE = 'None' if _SECURE_COOKIE else 'Lax'


def _set_jwt_cookies(response, user):
    refresh = RefreshToken.for_user(user)
    response.set_cookie(
        'access_token', str(refresh.access_token),
        max_age=900, httponly=True, samesite=_SAMESITE, secure=_SECURE_COOKIE,
    )
    response.set_cookie(
        'refresh_token', str(refresh),
        max_age=604800, httponly=True, samesite=_SAMESITE, secure=_SECURE_COOKIE,
    )
    return response


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        response = Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return _set_jwt_cookies(response, user)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user = authenticate(
            username=request.data.get('username', ''),
            password=request.data.get('password', ''),
        )
        if user is None:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        response = Response(UserSerializer(user).data)
        return _set_jwt_cookies(response, user)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        response = Response({'message': 'Logged out'})
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        return response


class TokenRefreshCookieView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        raw_refresh = request.COOKIES.get('refresh_token')
        if not raw_refresh:
            return Response(
                {'error': 'No refresh token'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            refresh = RefreshToken(raw_refresh)
            User.objects.get(id=refresh['user_id'])
        except (InvalidToken, TokenError, User.DoesNotExist):
            return Response(
                {'error': 'Invalid or expired refresh token'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        response = Response({'message': 'Token refreshed'})
        response.set_cookie(
            'access_token', str(refresh.access_token),
            max_age=900, httponly=True, samesite=_SAMESITE, secure=_SECURE_COOKIE,
        )
        return response


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
