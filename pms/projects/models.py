from django.db import models
from django.contrib.auth.models import User

class Project(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class ProjectMembership(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    is_admin = models.BooleanField(default=False)
    is_accepted = models.BooleanField(default=False)


    class Meta:
        unique_together = ('user', 'project')

    def __str__(self):
        return f"{self.user.username} - {self.project.name} ({'Admin' if self.is_admin else 'Member'})"
    
class Invitation(models.Model):
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    invited_by = models.ForeignKey(User, related_name='sent_invitations', on_delete=models.CASCADE)
    accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class Sprint(models.Model):
    STATUS_CHOICES = [('PLANNING', 'Planning'), ('ACTIVE', 'Active'), ('COMPLETED', 'Completed')]
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='sprints')
    name = models.CharField(max_length=200)
    goal = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANNING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.project.name} — {self.name}"


class Comment(models.Model):
    task       = models.ForeignKey('board.Task', on_delete=models.CASCADE, related_name='comments')
    author     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    body       = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.author.username} on {self.task.name}"


class ActivityLog(models.Model):
    ACTION_CHOICES = [
        ('TASK_CREATED',        'Task Created'),
        ('TASK_UPDATED',        'Task Updated'),
        ('TASK_STATUS_CHANGED', 'Status Changed'),
        ('TASK_DELETED',        'Task Deleted'),
        ('COMMENT_ADDED',       'Comment Added'),
        ('MEMBER_ADDED',        'Member Added'),
        ('SPRINT_STARTED',      'Sprint Started'),
        ('SPRINT_COMPLETED',    'Sprint Completed'),
    ]
    project    = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='activities')
    task       = models.ForeignKey('board.Task', on_delete=models.SET_NULL, null=True, blank=True, related_name='activities')
    user       = models.ForeignKey(User, on_delete=models.CASCADE)
    action     = models.CharField(max_length=30, choices=ACTION_CHOICES)
    detail     = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']