# urls.py
from django.urls import path
from . import views

app_name = "projects"

urlpatterns = [
    path('select/', views.project_selection, name='project_selection'),
    path('create/', views.create_project, name='create_project'),
    path('delete/<int:project_id>/', views.delete_project, name='delete_project'),
    path('<int:project_id>/board/', views.board_view, name='board_view'),
    path('<int:project_id>/add_user/', views.add_user_to_project, name='add_user_to_project'),
    path('<int:project_id>/manage/', views.manage_people, name='manage_people'),
]
