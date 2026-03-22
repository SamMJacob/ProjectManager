from datetime import date, timedelta
from django.db.models import Count, Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from board.models import Task
from projects.models import Project, ProjectMembership, Sprint
from api.permissions import IsProjectMember
from api.serializers.sprints import SprintSerializer
from api.utils import tasks_by_member


class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated, IsProjectMember]

    def get(self, request, id):
        today = date.today()

        # Task counts by status
        task_status_counts = Task.objects.filter(project_id=id).values('status').annotate(n=Count('id'))
        task_counts = {'TODO': 0, 'IN_PROGRESS': 0, 'COMPLETED': 0}
        for item in task_status_counts:
            task_counts[item['status']] = item['n']

        # Tasks by member (assignee)
        tasks_by_member_data = tasks_by_member(id)

        # Tasks by priority
        priority_counts = Task.objects.filter(project_id=id).values('priority').annotate(n=Count('id'))
        tasks_by_priority = {'LOW': 0, 'MEDIUM': 0, 'HIGH': 0}
        for item in priority_counts:
            tasks_by_priority[item['priority']] = item['n']

        # Overdue tasks
        overdue_count = Task.objects.filter(
            project_id=id,
            due_date__lt=today
        ).exclude(status='COMPLETED').count()

        # Active sprint details
        active_sprint = Sprint.objects.filter(project_id=id, status='ACTIVE').first()
        active_sprint_data = None
        if active_sprint:
            counts_qs = active_sprint.tasks.values('status').annotate(n=Count('id'))
            sprint_task_counts = {'TODO': 0, 'IN_PROGRESS': 0, 'COMPLETED': 0}
            for item in counts_qs:
                sprint_task_counts[item['status']] = item['n']

            task_count = sum(sprint_task_counts.values())
            completed_count = sprint_task_counts['COMPLETED']
            days_remaining = max(0, (active_sprint.end_date - today).days)
            progress_pct = int(completed_count / task_count * 100) if task_count else 0

            active_sprint_data = {
                'id': active_sprint.id,
                'name': active_sprint.name,
                'goal': active_sprint.goal,
                'start_date': str(active_sprint.start_date),
                'end_date': str(active_sprint.end_date),
                'status': active_sprint.status,
                'task_count': task_count,
                'completed_count': completed_count,
                'progress_pct': progress_pct,
                'days_remaining': days_remaining,
                'sprint_task_counts': sprint_task_counts,
            }

        return Response({
            'task_counts': task_counts,
            'tasks_by_member': tasks_by_member_data,
            'tasks_by_priority': tasks_by_priority,
            'overdue_count': overdue_count,
            'active_sprint': active_sprint_data,
        })
