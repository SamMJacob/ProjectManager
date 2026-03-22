from rest_framework import serializers
from projects.models import Sprint


class SprintSerializer(serializers.ModelSerializer):
    task_count = serializers.SerializerMethodField()
    completed_count = serializers.SerializerMethodField()

    class Meta:
        model = Sprint
        fields = ['id', 'name', 'goal', 'start_date', 'end_date', 'status', 'created_at',
                  'task_count', 'completed_count']
        read_only_fields = ['id', 'created_at', 'task_count', 'completed_count']

    def get_task_count(self, obj):
        cache = obj._prefetched_objects_cache if hasattr(obj, '_prefetched_objects_cache') else {}
        if 'tasks' in cache:
            return len(cache['tasks'])
        return obj.tasks.count()

    def get_completed_count(self, obj):
        cache = obj._prefetched_objects_cache if hasattr(obj, '_prefetched_objects_cache') else {}
        if 'tasks' in cache:
            return sum(1 for t in cache['tasks'] if t.status == 'COMPLETED')
        return obj.tasks.filter(status='COMPLETED').count()
