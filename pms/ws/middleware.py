from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        cookie_header = dict(scope.get('headers', [])).get(b'cookie', b'').decode()
        cookies = dict(c.strip().split('=', 1) for c in cookie_header.split(';') if '=' in c)
        token_str = cookies.get('access_token')
        scope['user'] = AnonymousUser()
        if token_str:
            try:
                token = AccessToken(token_str)
                scope['user'] = await get_user_model().objects.aget(id=token['user_id'])
            except (InvalidToken, TokenError, get_user_model().DoesNotExist):
                pass
        return await super().__call__(scope, receive, send)
