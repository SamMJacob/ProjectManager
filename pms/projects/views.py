# projects/views.py
from django.shortcuts import render, redirect
from .models import Project
from django.http import JsonResponse
from django.shortcuts import get_object_or_404

def project_selection(request):
    projects = Project.objects.all()
    return render(request, 'projects/project_selection.html', {'projects': projects})

def create_project(request):
    """Handles project creation with AJAX."""
    if request.method == 'POST':
        project_name = request.POST.get('name')
        if project_name:
            project = Project.objects.create(name=project_name)
            return JsonResponse({'status': 'success', 'project_name': project.name})
        return JsonResponse({'status': 'error', 'message': 'Project name is required.'})

def delete_project(request, project_id):
    if request.method == 'POST':
        project = get_object_or_404(Project, id=project_id)
        project.delete()
        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error', 'message': 'Invalid request'})

def board_view(request, project_id):
    # Fetch the project based on the provided project_id
    project = get_object_or_404(Project, id=project_id)


    # Pass project and tasks to the template
    return render(request, 'board/board.html', {
        'project': project,
    })
