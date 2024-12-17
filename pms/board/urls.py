from django.urls import path
from . import views  # Import views from the current app

app_name = 'board'

urlpatterns = [
    
    path('', views.board, name='board'), # URL to access the board page
    path('<int:project_id>/', views.project_board, name='project_board'),
    path('add-task/', views.add_task, name='add_task'),
    path('delete-task/<int:task_id>/', views.delete_task, name='delete_task'),
    path('update-task-status/', views.update_task_status, name='update_task_status'),
    path('task-list/', views.task_list, name='task_list'),
    path('add_task_for_list/', views.add_task_for_list, name='add_task_for_list'),
    path('get_task_data/<int:task_id>/', views.get_task_data, name='get_task_data'),
    path('update_task/<int:task_id>/', views.update_task, name='update_task'),

]