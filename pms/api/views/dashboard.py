from datetime import date

from django.db.models import Count, Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from board.models import Task
from projects.models import ProjectMembership, Sprint
from api.serializers.tasks import TaskSerializer
from api.utils import tasks_by_member


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        tasks = Task.objects.filter(assignee=request.user).select_related(
            'assignee', 'report_to', 'project'
        )
        memberships = ProjectMembership.objects.filter(
            user=request.user, is_accepted=True
        ).select_related('project')

        def serialize(qs):
            return TaskSerializer(qs, many=True, context={'request': request}).data

        # Projects health
        projects_health = []
        for m in memberships:
            project = m.project
            total = Task.objects.filter(project=project).count()
            completed = Task.objects.filter(project=project, status='COMPLETED').count()
            overdue = Task.objects.filter(project=project, due_date__lt=today).exclude(status='COMPLETED').count()
            projects_health.append({
                'id': project.id,
                'name': project.name,
                'total': total,
                'completed': completed,
                'overdue': overdue,
            })

        # Active sprint across user's projects
        active_sprint = None
        project_ids = [m.project_id for m in memberships]
        if project_ids:
            sprint = Sprint.objects.filter(project_id__in=project_ids, status='ACTIVE').first()
            if sprint:
                active_sprint = {
                    'id': sprint.id,
                    'name': sprint.name,
                    'project_id': sprint.project_id,
                    'project_name': sprint.project.name,
                }

        # Tasks by member across all user's projects
        tasks_by_member_data = tasks_by_member(project_ids) if project_ids else []

        # Tasks by priority across all user's projects
        priority_counts = Task.objects.filter(project_id__in=project_ids).values('priority').annotate(n=Count('id'))
        tasks_by_priority = {'LOW': 0, 'MEDIUM': 0, 'HIGH': 0}
        for item in priority_counts:
            tasks_by_priority[item['priority']] = item['n']

        return Response({
            'overdue':    serialize(tasks.filter(due_date__lt=today)),
            'due_today':  serialize(tasks.filter(due_date=today)),
            'upcoming':   serialize(tasks.filter(due_date__gt=today)),
            'projects':   [{'id': m.project.id, 'name': m.project.name} for m in memberships],
            'projects_health': projects_health,
            'active_sprint': active_sprint,
            'tasks_by_member': tasks_by_member_data,
            'tasks_by_priority': tasks_by_priority,
        })
