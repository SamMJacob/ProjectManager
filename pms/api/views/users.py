from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.serializers.users import UserSearchSerializer


class UserSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if len(q) < 2:
            return Response([])
        users = (
            User.objects.filter(username__icontains=q)
            .exclude(pk=request.user.pk)[:10]
        )
        return Response(UserSearchSerializer(users, many=True).data)
