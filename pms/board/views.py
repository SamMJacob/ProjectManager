from django.http import JsonResponse, HttpResponseNotAllowed
from django.shortcuts import render
from .models import Task
from django.http import JsonResponse
import json
from django.shortcuts import render, get_object_or_404
from projects.models import Project


def board(request, project_id):
    projects = Project.objects.all()
    # Fetch tasks and filter by status
    project = get_object_or_404(Project, id=project_id)
    todo_tasks = Task.objects.filter(status='TODO', project=project)
    in_progress_tasks = Task.objects.filter(status='IN_PROGRESS', project=project)
    completed_tasks = Task.objects.filter(status='COMPLETED', project=project)
    
    # Pass the tasks to the board template
    return render(request, 'board/board.html', {
        'project': project,
        'todo_tasks': todo_tasks,
        'in_progress_tasks': in_progress_tasks,
        'completed_tasks': completed_tasks,
        'projects':projects,
    })

def add_task(request,project_id):
    if request.method == 'POST':
        # Get the task details from the POST request
        task_name = request.POST.get('task_name')
        task_due_date = request.POST.get('task_due_date')
        task_priority = request.POST.get('task_priority')
        task_description = request.POST.get('task_description')
        task_assignee = request.POST.get('task_assignee')
        task_report_to = request.POST.get('task_report_to')
        task_attachment = request.FILES.get('task_attachment')

        project = get_object_or_404(Project, id=project_id)

        # Create the task instance and save to the database
        task = Task.objects.create(
            name=task_name,
            due_date=task_due_date,
            priority=task_priority,
            description=task_description,
            assignee=task_assignee,
            report_to=task_report_to,
            attachment=task_attachment,
            project=project,
        )

        # Return a JSON response with the task name only
        return JsonResponse({
            'task_name': task.name,
            'task_id': task.id,  # You can also send the task ID for future references (e.g., for deletion)
        })

    return render(request, 'board/board.html')

def delete_task(request,project_id, task_id):
    if request.method == 'DELETE':
        try:
            # Find the task by its ID and delete it
            task = Task.objects.get(id=task_id)
            task.delete()
            return JsonResponse({'message': 'Task deleted successfully'})
        except Task.DoesNotExist:
            return JsonResponse({'error': 'Task not found'}, status=404)
    else:
        return HttpResponseNotAllowed(['DELETE'])
    
def update_task_status(request,project_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            task_id = data.get('task_id')
            new_status = data.get('new_status')

            task = Task.objects.get(id=task_id)
            
            # Ensure a valid status is set
            if new_status in ['TODO', 'IN_PROGRESS', 'COMPLETED']:
                task.status = new_status
                task.save()
                return JsonResponse({'status': 'success'})
            else:
                return JsonResponse({'status': 'error', 'message': 'Invalid status'}, status=400)
        
        except Task.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Task not found'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)

def task_list(request,project_id):
    projects = Project.objects.all()
    project = get_object_or_404(Project, id=project_id)

    tasks = Task.objects.filter( project=project)  # Fetch all tasks from the database
    return render(request, 'board/task_list.html', {
        'project': project,
        'tasks': tasks,
        'projects':projects,
    })

def add_task_for_list(request,project_id):
    if request.method == 'POST':
        # Get the task details from the POST request
        task_name = request.POST.get('task_name')
        task_due_date = request.POST.get('task_due_date')
        task_priority = request.POST.get('task_priority')
        task_description = request.POST.get('task_description')
        task_assignee = request.POST.get('task_assignee')
        task_report_to = request.POST.get('task_report_to')
        task_attachment = request.FILES.get('task_attachment')  # For file upload

        project = get_object_or_404(Project, id=project_id)
        # Create the task instance and save to the database
        task = Task.objects.create(
            name=task_name,
            due_date=task_due_date,
            priority=task_priority,
            description=task_description,
            assignee=task_assignee,
            report_to=task_report_to,
            attachment=task_attachment,
            project=project,
        )

        # Return a JSON response with full task details
        return JsonResponse({
            'task_id': task.id,
            'task_name': task.name,
            'task_due_date': task.due_date,
            'task_priority': task.priority,
            'task_description': task.description,
            'task_assignee': task.assignee,
            'task_report_to': task.report_to,
            'task_attachment_url': task.attachment.url if task.attachment else None,
        })
    
    return render(request, 'board/task_list.html')

def get_task_data(request, project_id, task_id):
    task = Task.objects.get(id=task_id)
    return JsonResponse({
        'task_name': task.name,
        'due_date': task.due_date,
        'description': task.description,
        'priority': task.priority,
        'assignee': task.assignee,
        'report_to': task.report_to,
    })

def update_task(request,project_id,task_id):
    if request.method == 'POST':
        task = Task.objects.get(id=task_id)
        task.name = request.POST.get('task_name')
        task.due_date = request.POST.get('due_date')
        task.description = request.POST.get('description')
        task.priority = request.POST.get('priority')
        task.assignee = request.POST.get('assignee')
        task.report_to = request.POST.get('report_to')
        task.save()

        return JsonResponse({
            'success': True,
            'task_name': task.name,
            'due_date': task.due_date,
            'description': task.description,
            'priority': task.priority,
            'assignee': task.assignee,
            'report_to': task.report_to,
        })
    
    # board/views.py


def project_board(request, project_id):
    # Fetch the specific project
    project = get_object_or_404(Project, id=project_id)

    # Fetch tasks only related to this project
    tasks = Task.objects.filter(project=project)

    context = {
        'project': project,
        'tasks': tasks,
    }
    return render(request, 'board/project_board.html', context)
