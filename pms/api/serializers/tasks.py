from django.contrib.auth.models import User
from rest_framework import serializers

from board.models import Task
from projects.models import ProjectMembership, Sprint


class TaskUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']


class TaskSerializer(serializers.ModelSerializer):
    assignee = TaskUserSerializer(read_only=True)
    report_to = TaskUserSerializer(read_only=True)
    project_name = serializers.SerializerMethodField(read_only=True)
    assignee_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='assignee',
        write_only=True,
        required=False,
        allow_null=True,
    )
    report_to_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='report_to',
        write_only=True,
        required=False,
        allow_null=True,
    )
    sprint_id = serializers.PrimaryKeyRelatedField(
        source='sprint',
        write_only=True,
        required=False,
        allow_null=True,
        queryset=Sprint.objects.all(),
    )
    sprint = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'name', 'due_date', 'description', 'priority', 'status',
            'assignee', 'assignee_id', 'report_to', 'report_to_id',
            'attachment', 'project', 'project_name', 'sprint', 'sprint_id',
        ]
        read_only_fields = ['id', 'project', 'project_name', 'sprint']

    def get_project_name(self, obj):
        return obj.project.name if obj.project_id else None

    def get_sprint(self, obj):
        if obj.sprint:
            return obj.sprint.id
        return None

    def _check_member(self, user, project_id, field_name):
        if user is None:
            return
        if not ProjectMembership.objects.filter(
            user=user, project_id=project_id, is_accepted=True
        ).exists():
            raise serializers.ValidationError(
                {field_name: 'User must be an accepted project member.'}
            )

    def validate(self, data):
        project_id = self.context.get('project_id')
        self._check_member(data.get('assignee'), project_id, 'assignee_id')
        self._check_member(data.get('report_to'), project_id, 'report_to_id')
        return data
