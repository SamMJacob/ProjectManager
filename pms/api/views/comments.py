import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from board.models import Task
from projects.models import Comment, ActivityLog, ProjectMembership
from api.permissions import IsProjectMember
from api.serializers.comments import CommentSerializer

logger = logging.getLogger(__name__)


class CommentListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsProjectMember]

    def get(self, request, id, task_id):
        try:
            task = Task.objects.get(id=task_id, project_id=id)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

        comments = task.comments.all()
        return Response(CommentSerializer(comments, many=True).data)

    def post(self, request, id, task_id):
        try:
            task = Task.objects.get(id=task_id, project_id=id)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

        body = request.data.get('body', '').strip()
        if not body:
            return Response({'error': 'body is required'}, status=status.HTTP_400_BAD_REQUEST)

        comment = Comment.objects.create(
            task=task,
            author=request.user,
            body=body
        )

        # Log activity
        ActivityLog.objects.create(
            project_id=id,
            task=task,
            user=request.user,
            action='COMMENT_ADDED',
            detail=f'commented on "{task.name}"'
        )

        # Broadcast to WebSocket group
        try:
            async_to_sync(get_channel_layer().group_send)(
                f'board_{id}',
                {'type': 'comment_added', 'task_id': task.id, 'comment': CommentSerializer(comment).data}
            )
        except Exception as e:
            logger.error('Failed to broadcast comment_added: %s', e)

        return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)


class CommentDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsProjectMember]

    def delete(self, request, id, task_id, cid):
        try:
            comment = Comment.objects.get(id=cid, task_id=task_id, task__project_id=id)
        except Comment.DoesNotExist:
            return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)

        if comment.author != request.user:
            return Response({'error': 'Cannot delete another user\'s comment'}, status=status.HTTP_403_FORBIDDEN)

        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
