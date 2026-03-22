from rest_framework import serializers


class TaskCountsByStatusSerializer(serializers.Serializer):
    TODO = serializers.IntegerField(default=0)
    IN_PROGRESS = serializers.IntegerField(default=0)
    COMPLETED = serializers.IntegerField(default=0)


class MemberWorkloadSerializer(serializers.Serializer):
    username = serializers.CharField()
    user_id = serializers.IntegerField()
    TODO = serializers.IntegerField(default=0)
    IN_PROGRESS = serializers.IntegerField(default=0)
    COMPLETED = serializers.IntegerField(default=0)
    total = serializers.IntegerField(default=0)


class ProjectHealthSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    total = serializers.IntegerField()
    completed = serializers.IntegerField()
    overdue = serializers.IntegerField()
    pct_done = serializers.SerializerMethodField()

    def get_pct_done(self, obj):
        return int(obj['completed'] / obj['total'] * 100) if obj['total'] else 0
