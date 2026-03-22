import json

from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async

from projects.models import ProjectMembership


class BoardConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.project_id = self.scope['url_route']['kwargs']['project_id']
        self.group_name = f'board_{self.project_id}'
        user = self.scope['user']

        if not user.is_authenticated:
            await self.close(code=4001)
            return

        is_member = await sync_to_async(
            ProjectMembership.objects.filter(
                user=user,
                project_id=self.project_id,
                is_accepted=True,
            ).exists
        )()

        if not is_member:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        # Board is server-push only — ignore any client messages.
        pass

    async def task_status_changed(self, event):
        await self.send(text_data=json.dumps({
            'type': 'task_status_changed',
            'task_id': event['task_id'],
            'new_status': event['new_status'],
            'task_name': event['task_name'],
        }))

    async def task_created(self, event):
        await self.send(text_data=json.dumps({
            'type': 'task_created',
            'task': event['task'],
        }))

    async def task_updated(self, event):
        await self.send(text_data=json.dumps({
            'type': 'task_updated',
            'task': event['task'],
        }))

    async def task_deleted(self, event):
        await self.send(text_data=json.dumps({
            'type': 'task_deleted',
            'task_id': event['task_id'],
        }))

    async def comment_added(self, event):
        await self.send(text_data=json.dumps({
            'type': 'comment_added',
            'task_id': event['task_id'],
            'comment': event['comment'],
        }))
