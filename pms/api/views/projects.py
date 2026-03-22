from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.models import Project, ProjectMembership, Invitation, ActivityLog
from api.permissions import IsProjectMember, IsProjectAdmin
from api.serializers.projects import ProjectSerializer, ProjectMembershipSerializer


class ProjectListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        memberships = ProjectMembership.objects.filter(
            user=request.user, is_accepted=True
        ).select_related('project')
        projects = [m.project for m in memberships]
        return Response(
            ProjectSerializer(projects, many=True, context={'request': request}).data
        )

    def post(self, request):
        serializer = ProjectSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        project = serializer.save()
        ProjectMembership.objects.create(
            user=request.user, project=project, is_admin=True, is_accepted=True,
        )
        return Response(
            ProjectSerializer(project, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class ProjectDetailView(APIView):

    def get_permissions(self):
        if self.request.method == 'DELETE':
            return [IsAuthenticated(), IsProjectAdmin()]
        return [IsAuthenticated(), IsProjectMember()]

    def _get_project(self, id):
        try:
            return Project.objects.get(pk=id)
        except Project.DoesNotExist:
            return None

    def get(self, request, id):
        project = self._get_project(id)
        if project is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(ProjectSerializer(project, context={'request': request}).data)

    def delete(self, request, id):
        project = self._get_project(id)
        if project is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MemberListCreateView(APIView):

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsProjectAdmin()]
        return [IsAuthenticated(), IsProjectMember()]

    def get(self, request, id):
        memberships = ProjectMembership.objects.filter(
            project_id=id
        ).select_related('user')
        return Response(ProjectMembershipSerializer(memberships, many=True).data)

    def post(self, request, id):
        username = request.data.get('username', '').strip()
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_400_BAD_REQUEST)
        if ProjectMembership.objects.filter(user=user, project_id=id).exists():
            return Response({'error': 'User already a member'}, status=status.HTTP_400_BAD_REQUEST)
        membership = ProjectMembership.objects.create(
            user=user, project_id=id, is_admin=False, is_accepted=True,
        )
        ActivityLog.objects.create(
            project_id=id,
            user=request.user,
            action='MEMBER_ADDED',
            detail=f'added {user.username} to project'
        )
        return Response(
            ProjectMembershipSerializer(membership).data,
            status=status.HTTP_201_CREATED,
        )


class MemberDetailView(APIView):
    permission_classes = [IsAuthenticated, IsProjectAdmin]

    def delete(self, request, id, user_id):
        try:
            membership = ProjectMembership.objects.get(user_id=user_id, project_id=id)
        except ProjectMembership.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if membership.is_admin:
            admin_count = ProjectMembership.objects.filter(
                project_id=id, is_admin=True, is_accepted=True
            ).count()
            if admin_count <= 1:
                return Response(
                    {'error': 'Cannot remove the only admin'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, id, user_id):
        try:
            membership = ProjectMembership.objects.get(user_id=user_id, project_id=id)
        except ProjectMembership.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        is_admin = request.data.get('is_admin')
        if is_admin is None:
            return Response(
                {'error': 'is_admin field required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        membership.is_admin = bool(is_admin)
        membership.save()
        return Response(ProjectMembershipSerializer(membership).data)


class InviteUserView(APIView):
    permission_classes = [IsAuthenticated, IsProjectAdmin]

    def post(self, request, id):
        username = request.data.get('username', '').strip()
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_400_BAD_REQUEST)
        if ProjectMembership.objects.filter(user=user, project_id=id).exists():
            return Response({'error': 'User already a member'}, status=status.HTTP_400_BAD_REQUEST)
        if Invitation.objects.filter(user=user, project_id=id, accepted=False).exists():
            return Response(
                {'error': 'Invitation already pending'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        invitation = Invitation.objects.create(
            project_id=id, user=user, invited_by=request.user, accepted=False,
        )
        import os
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        accept_url = f'{frontend_url}/invitations/{invitation.id}/accept'
        send_mail(
            subject='Invitation to join a project',
            message=f'You have been invited to join a project. Accept here: {accept_url}',
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[user.email],
            fail_silently=True,
        )
        return Response(
            {'message': f'Invitation sent to {username}'},
            status=status.HTTP_201_CREATED,
        )


class AcceptInvitationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, invitation_id):
        try:
            invitation = Invitation.objects.get(pk=invitation_id, accepted=False)
        except Invitation.DoesNotExist:
            return Response(
                {'error': 'Invalid or already accepted invitation'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if invitation.user != request.user:
            return Response(
                {'error': 'This invitation is not for you'},
                status=status.HTTP_403_FORBIDDEN,
            )
        membership, created = ProjectMembership.objects.get_or_create(
            user=request.user,
            project=invitation.project,
            defaults={'is_admin': False, 'is_accepted': True},
        )
        if created:
            ActivityLog.objects.create(
                project_id=invitation.project_id,
                user=request.user,
                action='MEMBER_ADDED',
                detail=f'{request.user.username} joined project'
            )
        invitation.accepted = True
        invitation.save()
        return Response({
            'message': 'Joined project',
            'project_id': invitation.project.id,
            'project_name': invitation.project.name,
        })
