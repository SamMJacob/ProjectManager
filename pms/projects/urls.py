# urls.py
from django.urls import path
from . import views

app_name = "projects"

urlpatterns = [
    path('dashboard/', views.dashboard, name='dashboard'),
    path('select/', views.project_selection, name='project_selection'),
    path('create/', views.create_project, name='create_project'),
    path('delete/<int:project_id>/', views.delete_project, name='delete_project'),
    path('<int:project_id>/board/', views.board_view, name='board_view'),
    path('<int:project_id>/add_user/', views.add_user_to_project, name='add_user_to_project'),
    path('<int:project_id>/manage/', views.manage_people, name='manage_people'),
    path('<int:project_id>/remove-user/', views.remove_user, name='remove_user'),
    path('<int:project_id>/make-admin/', views.make_admin, name='make_admin'),
    path('<int:project_id>/invite-user/', views.invite_user, name='invite_user'),
    path('<int:project_id>/accept-invitation/', views.accept_invitation, name='accept_invitation'),
]
