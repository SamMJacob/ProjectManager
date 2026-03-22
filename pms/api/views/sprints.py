from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from projects.models import Sprint, ActivityLog
from api.permissions import IsProjectAdmin, IsProjectMember
from api.serializers.sprints import SprintSerializer
from board.models import Task
from api.serializers.tasks import TaskSerializer


class SprintListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsProjectAdmin()]
        return [IsAuthenticated(), IsProjectMember()]

    def get(self, request, id):
        sprints = Sprint.objects.filter(project_id=id).prefetch_related('tasks').order_by('-created_at')
        return Response(SprintSerializer(sprints, many=True).data)

    def post(self, request, id):
        serializer = SprintSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(project_id=id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SprintDetailView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated(), IsProjectMember()]
        return [IsAuthenticated(), IsProjectAdmin()]

    def _get_sprint(self, id, sid):
        try:
            return Sprint.objects.get(pk=sid, project_id=id)
        except Sprint.DoesNotExist:
            return None

    def get(self, request, id, sid):
        sprint = self._get_sprint(id, sid)
        if sprint is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(SprintSerializer(sprint).data)

    def patch(self, request, id, sid):
        sprint = self._get_sprint(id, sid)
        if sprint is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = SprintSerializer(sprint, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, id, sid):
        sprint = self._get_sprint(id, sid)
        if sprint is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        sprint.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SprintStatusView(APIView):
    permission_classes = [IsAuthenticated, IsProjectAdmin]

    def patch(self, request, id, sid):
        try:
            sprint = Sprint.objects.get(pk=sid, project_id=id)
        except Sprint.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        current_status = sprint.status

        # Validate transitions
        valid_transitions = {
            'PLANNING': ['ACTIVE'],
            'ACTIVE': ['COMPLETED'],
            'COMPLETED': []
        }

        if new_status not in valid_transitions.get(current_status, []):
            return Response(
                {'error': 'Invalid status transition'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if setting ACTIVE and another sprint is already active
        if new_status == 'ACTIVE':
            active_sprint = Sprint.objects.filter(
                project_id=id, status='ACTIVE'
            ).exclude(pk=sid).exists()
            if active_sprint:
                return Response(
                    {'error': 'Another sprint is already active'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        sprint.status = new_status
        sprint.save()

        # Log activity
        action = 'SPRINT_STARTED' if new_status == 'ACTIVE' else 'SPRINT_COMPLETED'
        ActivityLog.objects.create(
            project_id=id,
            user=request.user,
            action=action,
            detail=f'sprint "{sprint.name}" {new_status.lower()}'
        )

        return Response(SprintSerializer(sprint).data)


class BacklogView(APIView):
    permission_classes = [IsAuthenticated, IsProjectMember]

    def get(self, request, id):
        tasks = Task.objects.filter(project_id=id, sprint__isnull=True).select_related(
            'assignee', 'report_to'
        )
        return Response(
            TaskSerializer(
                tasks, many=True, context={'request': request, 'project_id': id}
            ).data
        )
