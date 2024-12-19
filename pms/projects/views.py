# projects/views.py
from django.shortcuts import render, redirect
from board.models import Task;
from .models import Project, ProjectMembership,Invitation
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.contrib import messages
from django.core.mail import send_mail
from django.utils import timezone
import datetime

def dashboard(request):
    user = request.user

    # Fetch the user's projects
    user_projects = Project.objects.filter(projectmembership__user=request.user)

    # Fetch tasks assigned to the user
    user_tasks = Task.objects.filter(assignee=user)
    

    # Categorize tasks
    today = timezone.now().date() 
    overdue_tasks = user_tasks.filter(due_date__lt=today, status__in=['To Do', 'In Progress'])
    due_today_tasks = user_tasks.filter(due_date=today, status__in=['To Do', 'In Progress'])
    upcoming_tasks = user_tasks.filter(due_date__gt=today, status__in=['To Do', 'In Progress']) 

    # Recent notifications (if implemented)
    #notifications = Notification.objects.filter(user=user).order_by('-timestamp')[:5]
    print(today)  # This should print the correct date in the expected format
    print(user_tasks.values('due_date'))  # This prints the due_date of your tasks for debugging

    context = {
        'projects': user_projects,
        'tasks': {
            'overdue': overdue_tasks,
            'due_today': due_today_tasks,
            'upcoming': upcoming_tasks,
        },
        #'notifications': notifications,
    }
    return render(request, 'projects/dashboard.html', context)

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

    current_user_membership = ProjectMembership.objects.filter(project=project, user=request.user, is_admin=True).exists()
    members = ProjectMembership.objects.filter(project=project)
    non_members = User.objects.exclude(projectmembership__project=project)
    
    return render(request, 'projects/manageppl.html', {
        'project': project,
        'members': members,
        'non_members': non_members,
        'is_admin': current_user_membership, 
    })
def remove_user(request, project_id):
    project = get_object_or_404(Project, id=project_id)
    current_user_membership = ProjectMembership.objects.filter(project=project, user=request.user).first()

    if not current_user_membership :
        # Prevent repeated messages
        if not messages.get_messages(request):
            messages.error(request, "You must be an admin to manage project members.")
        return redirect('projects:manage_people', project_id=project_id)

    if request.method == "POST":
        username = request.POST.get("username")
        user_to_remove = User.objects.filter(username=username).first()

        if user_to_remove and user_to_remove == request.user:
            messages.error(request, "You cannot remove yourself from the project.")
        elif user_to_remove:
            membership_to_remove = ProjectMembership.objects.filter(project=project, user=user_to_remove).first()
            if membership_to_remove:
                membership_to_remove.delete()
                messages.success(request, f"User {username} removed from the project.")
        else:
            messages.error(request, f"User {username} does not exist or is not in the project.")

    return redirect('projects:manage_people', project_id=project_id)

def make_admin(request, project_id):
    project = get_object_or_404(Project, id=project_id)
    
    current_user_membership = ProjectMembership.objects.filter(project=project, user=request.user, is_admin=True).first()
    if not current_user_membership:
        messages.error(request, "You must be an admin to promote members.")
        return redirect('projects:manage_people', project_id=project_id)
    
    if request.method == 'POST':
        username = request.POST.get('username')
        try:
            user = User.objects.get(username=username)
            membership = ProjectMembership.objects.filter(project=project, user=user).first()
            if membership:
                membership.is_admin = True
                membership.save()
                messages.success(request, f"{username} has been promoted to Admin.")
            else:
                messages.error(request, f"User {username} is not part of the project.")
        except User.DoesNotExist:
            messages.error(request, "User not found.")
    
    return redirect('projects:manage_people', project_id=project_id)

def invite_user(request, project_id):
    project = get_object_or_404(Project, id=project_id)


    if request.method == 'POST':
        username = request.POST.get('username')
        try:
            user = User.objects.get(username=username)
            if ProjectMembership.objects.filter(project=project, user=user).exists():
                messages.error(request, f"User {username} is already a member.")
            elif Invitation.objects.filter(project=project, user=user, accepted=False).exists():
                messages.error(request, f"{username} has already been invited.")
            else:
                # Send invite logic here (e.g., email notification)
                Invitation.objects.create(project=project, user=user, accepted=False, invited_by=request.user)
                subject = f"Invitation to join project: {project.name}"
                message = f"Hi {user.username},\n\nYou have been invited to join the project '{project.name}'. Click the link below to accept the invitation:\n\nhttp://yourdomain.com/projects/{project.id}/accept-invitation/\n\nBest regards,\n{request.user.username}"
                from_email = 'sammanu.cs23@bmsce.ac.in'  # Change to your project's email
                recipient_list = [user.email]
                
                send_mail(subject, message, from_email, recipient_list)
                messages.success(request, f"User {username} has been invited to the project.")
        except User.DoesNotExist:
            messages.error(request, f"User {username} does not exist.")

    return redirect('projects:manage_people', project_id=project_id)

def accept_invitation(request, project_id):
    project = get_object_or_404(Project, id=project_id)
    invitation = Invitation.objects.filter(project=project, user=request.user, accepted=False).first()

    if invitation:
        # Add the user to the project as a member
        ProjectMembership.objects.create(project=project, user=request.user, is_admin=False)
        # Mark the invitation as accepted
        invitation.accepted = True
        invitation.save()
        messages.success(request, "You have successfully joined the project.")
    else:
        messages.error(request, "No pending invitation found.")



    # Pass project and tasks to the template
    return render(request, 'board/board.html', {
        'project': project,
    })
