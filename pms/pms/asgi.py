"""
ASGI config for pms project.

Exposes the ASGI callable as a module-level variable named ``application``.
Handles both HTTP (Django) and WebSocket (Django Channels) traffic.
"""

import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pms.settings')

import django
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
import ws.routing
from ws.middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': JWTAuthMiddleware(
        URLRouter(ws.routing.websocket_urlpatterns)
    ),
})
