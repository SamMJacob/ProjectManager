from rest_framework.permissions import BasePermission

from projects.models import ProjectMembership


class IsProjectMember(BasePermission):
    """Allow access only to accepted members of the project in kwargs['id']."""

    def has_permission(self, request, view):
        project_id = view.kwargs.get('id')
        if not project_id:
            return False
        return ProjectMembership.objects.filter(
            user=request.user,
            project_id=project_id,
            is_accepted=True,
        ).exists()


class IsProjectAdmin(BasePermission):
    """Allow access only to project admins (is_admin=True and is_accepted=True)."""

    def has_permission(self, request, view):
        project_id = view.kwargs.get('id')
        if not project_id:
            return False
        return ProjectMembership.objects.filter(
            user=request.user,
            project_id=project_id,
            is_admin=True,
            is_accepted=True,
        ).exists()
