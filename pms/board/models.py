from django.db import models
from projects.models import Project

class Task(models.Model):
    STATUS_CHOICES = [
        ('TODO', 'To-Do'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
    ]

    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
    ]
    def get_default_project():
        return Project.objects.first().id
    
    name = models.CharField(max_length=255)
    due_date = models.DateField()  # Use DateField if only the date is needed
    description = models.TextField()
    priority = models.CharField(max_length=6, choices=PRIORITY_CHOICES, default='LOW')
    assignee = models.CharField(max_length=255,null=True)
    report_to = models.CharField(max_length=200,null=True)  # ForeignKey to User model
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='TODO')
    attachment = models.FileField(upload_to='tasks/', null=True, blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')

    class Meta:
        ordering = ['due_date']  # This goes inside the Task class

    def __str__(self):
        return self.name
