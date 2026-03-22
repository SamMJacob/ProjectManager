from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class NotificationListView(APIView):
    """Returns unread notifications for the current user. Phase 8b will fully implement."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Stub — Phase 8b adds Notification model and replaces this
        return Response([])

    def post(self, request):
        """Mark all as read — stub."""
        return Response({'marked_read': 0})
