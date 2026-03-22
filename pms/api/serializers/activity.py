from django.contrib.auth.models import User
from rest_framework import serializers
from projects.models import ActivityLog


class ActivityUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']


class ActivityLogSerializer(serializers.ModelSerializer):
    user    = ActivityUserSerializer(read_only=True)
    task_name = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'action', 'detail', 'task_name', 'task_id', 'created_at']

    def get_task_name(self, obj):
        return obj.task.name if obj.task else None
