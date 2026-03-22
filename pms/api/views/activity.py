from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from projects.models import ActivityLog, ProjectMembership
from api.permissions import IsProjectMember
from api.serializers.activity import ActivityLogSerializer


class ActivityFeedView(APIView):
    permission_classes = [IsAuthenticated, IsProjectMember]

    def get(self, request, id):
        limit = min(int(request.query_params.get('limit', 50)), 100)
        qs = ActivityLog.objects.filter(project_id=id).order_by('-created_at')[:limit]
        return Response(ActivityLogSerializer(qs, many=True).data)


class GlobalActivityFeedView(APIView):
    """Returns recent activity across all of the user's projects."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        project_ids = ProjectMembership.objects.filter(
            user=request.user, is_accepted=True
        ).values_list('project_id', flat=True)
        qs = ActivityLog.objects.filter(project_id__in=project_ids).order_by('-created_at')[:30]
        return Response(ActivityLogSerializer(qs, many=True).data)
