"""
URL configuration for pms project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    # existing Django app URLs (untouched)
    path('projects/<int:project_id>/board/', include('board.urls')),
    path('projects/', include('projects.urls', namespace='projects')),
    path('accounts/', include('django.contrib.auth.urls')),
    path('acc/', include('Accounts.urls')),
    # new DRF API
    path('api/', include('api.urls')),
]

# Serve uploaded media files in development
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Note: WebSocket routing (ws/board/<id>/) is handled by pms/asgi.py via
# ProtocolTypeRouter → AuthMiddlewareStack → ws.routing, NOT here.
