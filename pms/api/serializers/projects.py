from rest_framework import serializers

from projects.models import Project, ProjectMembership


class ProjectSerializer(serializers.ModelSerializer):
    is_admin = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'created_at', 'is_admin']
        read_only_fields = ['id', 'created_at']

    def get_is_admin(self, obj):
        request = self.context.get('request')
        if request is None:
            return False
        membership = ProjectMembership.objects.filter(
            user=request.user, project=obj, is_accepted=True
        ).first()
        return membership.is_admin if membership else False


class ProjectMembershipSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = ProjectMembership
        fields = ['user_id', 'username', 'email', 'is_admin', 'is_accepted']
