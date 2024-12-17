# projects/views.py
from django.shortcuts import render, redirect
from .models import Project, ProjectMembership
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.contrib import messages


def project_selection(request):
    projects = Project.objects.filter(projectmembership__user=request.user)
    return render(request, 'projects/project_selection.html', {'projects': projects})

def create_project(request):
    """Handles project creation with AJAX."""
    if request.method == 'POST':
        project_name = request.POST.get('name')
        if project_name:
            project = Project.objects.create(name=project_name)
            ProjectMembership.objects.create(user=request.user, project=project, is_admin=True)
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

def add_user_to_project(request, project_id):
    project = Project.objects.get(id=project_id)
    if request.method == 'POST':
        user_id = request.POST['user_id']
        is_admin = 'is_admin' in request.POST
        user = User.objects.get(id=user_id)

        # Add user to the project with a specified role
        ProjectMembership.objects.create(user=user, project=project, is_admin=is_admin)

        return redirect('project_detail', project_id=project.id)
    
    # Fetch users not already part of the project
    existing_users = project.projectmembership_set.all().values_list('user', flat=True)
    available_users = User.objects.exclude(id__in=existing_users)
    
    return render(request, 'add_user_to_project.html', {'project': project, 'available_users': available_users})

def is_user_in_project(user, project):
    try:
        membership = ProjectMembership.objects.get(user=user, project=project)
        return membership.is_admin
    except ProjectMembership.DoesNotExist:
        return False
    
def manage_people(request, project_id):
    project = get_object_or_404(Project, id=project_id)
    
    # Ensure the user is an admin of the project
    if not ProjectMembership.objects.filter(project=project, user=request.user, is_admin=True).exists():
        messages.error(request, "You must be an admin to manage project members.")
        return redirect('project_dashboard', project_id=project_id)

    members = ProjectMembership.objects.filter(project=project)
    non_members = User.objects.exclude(projectmembership__project=project)

    if request.method == 'POST':
        # Check if the username is provided to invite or remove a user
        username = request.POST.get('username')
        if username:
            try:
                user_to_remove = User.objects.get(username=username)
                membership = ProjectMembership.objects.filter(project=project, user=user_to_remove).first()
                
                if membership:
                    membership.delete()
                    messages.success(request, f"User {username} removed from the project.")
                else:
                    messages.error(request, f"User {username} is not part of the project.")
            except User.DoesNotExist:
                messages.error(request, "User not found.")
        
        return redirect('manage_people', project_id=project_id)
    
    return render(request, 'projects/manageppl.html', {
        'project': project,
        'members': members,
        'non_members': non_members,
    })