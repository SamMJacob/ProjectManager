from django.urls import path

from api.views.auth import (
    RegisterView, LoginView, LogoutView, TokenRefreshCookieView, MeView,
)
from api.views.projects import (
    ProjectListCreateView, ProjectDetailView,
    MemberListCreateView, MemberDetailView,
    InviteUserView, AcceptInvitationView,
)
from api.views.tasks import TaskListCreateView, TaskDetailView, TaskStatusView
from api.views.users import UserSearchView
from api.views.dashboard import DashboardView
from api.views.sprints import SprintListCreateView, SprintDetailView, SprintStatusView, BacklogView
from api.views.analytics import AnalyticsView
from api.views.activity import ActivityFeedView, GlobalActivityFeedView
from api.views.comments import CommentListCreateView, CommentDeleteView
from api.views.notifications import NotificationListView

urlpatterns = [
    # Auth
    path('auth/register/',       RegisterView.as_view()),
    path('auth/login/',          LoginView.as_view()),
    path('auth/logout/',         LogoutView.as_view()),
    path('auth/token/refresh/',  TokenRefreshCookieView.as_view()),
    path('auth/me/',             MeView.as_view()),
    # Projects
    path('projects/',                                   ProjectListCreateView.as_view()),
    path('projects/<int:id>/',                          ProjectDetailView.as_view()),
    path('projects/<int:id>/members/',                  MemberListCreateView.as_view()),
    path('projects/<int:id>/members/<int:user_id>/',    MemberDetailView.as_view()),
    path('projects/<int:id>/invite/',                   InviteUserView.as_view()),
    # Tasks
    path('projects/<int:id>/tasks/',                            TaskListCreateView.as_view()),
    path('projects/<int:id>/tasks/<int:task_id>/',              TaskDetailView.as_view()),
    path('projects/<int:id>/tasks/<int:task_id>/status/',       TaskStatusView.as_view()),
    # Comments
    path('projects/<int:id>/tasks/<int:task_id>/comments/',     CommentListCreateView.as_view()),
    path('projects/<int:id>/tasks/<int:task_id>/comments/<int:cid>/', CommentDeleteView.as_view()),
    # Sprints
    path('projects/<int:id>/sprints/',                          SprintListCreateView.as_view()),
    path('projects/<int:id>/sprints/<int:sid>/',                SprintDetailView.as_view()),
    path('projects/<int:id>/sprints/<int:sid>/status/',         SprintStatusView.as_view()),
    path('projects/<int:id>/backlog/',                          BacklogView.as_view()),
    # Analytics & Activity
    path('projects/<int:id>/analytics/',                        AnalyticsView.as_view()),
    path('projects/<int:id>/activity/',                         ActivityFeedView.as_view()),
    path('activity/',                                           GlobalActivityFeedView.as_view()),
    # Invitations
    path('invitations/<int:invitation_id>/accept/',  AcceptInvitationView.as_view()),
    # Users & Dashboard
    path('users/',      UserSearchView.as_view()),
    path('dashboard/',  DashboardView.as_view()),
    # Notifications
    path('notifications/', NotificationListView.as_view()),
]
