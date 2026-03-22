from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from board.models import Task
from projects.models import Project, ActivityLog
from api.permissions import IsProjectMember
from api.serializers.tasks import TaskSerializer


def log_activity(project_id, user, action, detail='', task=None):
    ActivityLog.objects.create(
        project_id=project_id, user=user, action=action, detail=detail, task=task
    )


def _broadcast(project_id, event_type, **kwargs):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'board_{project_id}',
        {'type': event_type, **kwargs},
    )


class TaskListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsProjectMember]

    def get(self, request, id):
        tasks = Task.objects.filter(project_id=id).select_related('assignee', 'report_to')
        return Response(
            TaskSerializer(
                tasks, many=True, context={'request': request, 'project_id': id}
            ).data
        )

    def post(self, request, id):
        try:
            project = Project.objects.get(pk=id)
        except Project.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = TaskSerializer(
            data=request.data,
            context={'request': request, 'project_id': id},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        task = serializer.save(project=project)
        log_activity(id, request.user, 'TASK_CREATED', task.name, task)
        task_data = TaskSerializer(
            task, context={'request': request, 'project_id': id}
        ).data
        _broadcast(id, 'task_created', task=task_data)
        return Response(task_data, status=status.HTTP_201_CREATED)


class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated, IsProjectMember]

    def _get_task(self, id, task_id):
        try:
            return Task.objects.select_related('assignee', 'report_to').get(
                pk=task_id, project_id=id
            )
        except Task.DoesNotExist:
            return None

    def get(self, request, id, task_id):
        task = self._get_task(id, task_id)
        if task is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(
            TaskSerializer(task, context={'request': request, 'project_id': id}).data
        )

    def patch(self, request, id, task_id):
        task = self._get_task(id, task_id)
        if task is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = TaskSerializer(
            task, data=request.data, partial=True,
            context={'request': request, 'project_id': id},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        task = serializer.save()
        log_activity(id, request.user, 'TASK_UPDATED', f'updated task "{task.name}"', task)
        task_data = TaskSerializer(
            task, context={'request': request, 'project_id': id}
        ).data
        _broadcast(id, 'task_updated', task=task_data)
        return Response(task_data)

    def delete(self, request, id, task_id):
        task = self._get_task(id, task_id)
        if task is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        task_name = task.name
        task.delete()
        log_activity(id, request.user, 'TASK_DELETED', task_name)
        _broadcast(id, 'task_deleted', task_id=task_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class TaskStatusView(APIView):
    permission_classes = [IsAuthenticated, IsProjectMember]

    def patch(self, request, id, task_id):
        try:
            task = Task.objects.get(pk=task_id, project_id=id)
        except Task.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        new_status = request.data.get('status')
        if new_status not in ('TODO', 'IN_PROGRESS', 'COMPLETED'):
            return Response(
                {'error': 'status must be TODO, IN_PROGRESS, or COMPLETED'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        old_status = task.status
        task.status = new_status
        task.save()
        log_activity(id, request.user, 'TASK_STATUS_CHANGED', f'{old_status} → {new_status}', task)
        _broadcast(
            id, 'task_status_changed',
            task_id=task.id, new_status=task.status, task_name=task.name,
        )
        return Response({'id': task.id, 'status': task.status})
