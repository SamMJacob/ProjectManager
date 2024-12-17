from django.shortcuts import render
import os
from django.conf import settings


def landing_page(request):
    return render(request, os.path.join(settings.BASE_DIR, 'pms', 'templates', 'landing_page.html'))