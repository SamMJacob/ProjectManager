# FlowBoard — Technical Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend](#backend)
   - [Django Apps](#django-apps)
   - [Models](#models)
   - [REST API](#rest-api)
   - [Authentication](#authentication)
   - [Permissions](#permissions)
   - [WebSockets](#websockets)
3. [Frontend](#frontend)
   - [Pages](#pages)
   - [API Layer](#api-layer)
   - [State & Auth Context](#state--auth-context)
   - [WebSocket Hook](#websocket-hook)
4. [Data Flow Examples](#data-flow-examples)
5. [Environment Variables](#environment-variables)
6. [Running the Project](#running-the-project)
7. [Database Schema](#database-schema)
8. [API Reference](#api-reference)

---

## Architecture Overview

```
Browser (React + Vite)
    │
    ├── HTTP/HTTPS  ──►  Django REST Framework  ──►  SQLite
    │                       (api/ app)
    │
    └── WebSocket   ──►  Django Channels / Daphne
                           (ws/ app)
```

- The frontend runs on port **5173** (Vite dev server). In development, Vite proxies `/api/` and `/ws/` to the backend on port **8000**.
- The backend is served by **Daphne** (ASGI), which handles both HTTP (via Django's ASGI adapter) and WebSocket connections (via Django Channels).
- Auth state is carried entirely in **httpOnly cookies** — no tokens in `localStorage`.

---

## Backend

### Django Apps

| App | Responsibility |
|---|---|
| `Accounts` | `UserProfile` model (OneToOne with Django `User`, `is_admin` flag) |
| `board` | `Task` model |
| `projects` | `Project`, `ProjectMembership`, `Invitation`, `Sprint`, `Comment`, `ActivityLog` models |
| `api` | All DRF views, serializers, permissions, JWT cookie authentication |
| `ws` | Django Channels consumer, JWT WebSocket middleware, URL routing |

### Models

#### Task (`board.models`)
```
Task
├── name            CharField(255)
├── description     TextField (optional)
├── due_date        DateField (optional)
├── priority        CharField — LOW | MEDIUM | HIGH
├── status          CharField — TODO | IN_PROGRESS | COMPLETED
├── assignee        FK → User (optional)
├── report_to       FK → User (optional)
├── attachment      FileField (optional)
├── project         FK → Project
└── sprint          FK → Sprint (optional, null=True)
```

#### Project (`projects.models`)
```
Project
├── name            CharField
├── description     TextField
└── created_at      DateTimeField

ProjectMembership
├── user            FK → User
├── project         FK → Project
├── is_admin        BooleanField
└── is_accepted     BooleanField

Invitation
├── project         FK → Project
├── user            FK → User
├── invited_by      FK → User
├── accepted        BooleanField
└── created_at      DateTimeField

Sprint
├── project         FK → Project
├── name            CharField
├── goal            TextField (optional)
├── start_date      DateField
├── end_date        DateField
├── status          CharField — PLANNING | ACTIVE | COMPLETED
└── created_at      DateTimeField

Comment
├── task            FK → Task
├── author          FK → User
├── body            TextField (max 2000 chars)
└── created_at      DateTimeField

ActivityLog
├── project         FK → Project
├── user            FK → User
├── action          CharField (e.g. TASK_CREATED, SPRINT_STARTED)
├── detail          TextField
└── created_at      DateTimeField
```

### REST API

All views live in `api/views/`. The URL prefix is `/api/`.

#### Auth (`api/views/auth.py`)

| View | Method | URL | Notes |
|---|---|---|---|
| `RegisterView` | POST | `auth/register/` | Creates user + sets JWT cookies |
| `LoginView` | POST | `auth/login/` | Validates credentials + sets cookies |
| `LogoutView` | POST | `auth/logout/` | Clears cookies |
| `TokenRefreshCookieView` | POST | `auth/token/refresh/` | Rotates access token cookie silently |
| `MeView` | GET | `auth/me/` | Returns current user profile |

JWT cookies are set with `HttpOnly=True`, `SameSite=Lax`, and `Secure=True` in production (`DEBUG=False`).

#### Projects (`api/views/projects.py`)

| View | Methods | URL |
|---|---|---|
| `ProjectListCreateView` | GET, POST | `projects/` |
| `ProjectDetailView` | GET, PATCH, DELETE | `projects/<id>/` |
| `MemberListCreateView` | GET, POST | `projects/<id>/members/` |
| `MemberDetailView` | PATCH, DELETE | `projects/<id>/members/<user_id>/` |
| `InviteUserView` | POST | `projects/<id>/invite/` |
| `AcceptInvitationView` | POST | `invitations/<id>/accept/` |

`InviteUserView` sends an email with a signed link. The link target is controlled by the `FRONTEND_URL` environment variable.

#### Tasks (`api/views/tasks.py`)

| View | Methods | URL |
|---|---|---|
| `TaskListCreateView` | GET, POST | `projects/<id>/tasks/` |
| `TaskDetailView` | GET, PATCH, DELETE | `projects/<id>/tasks/<task_id>/` |
| `TaskStatusView` | PATCH | `projects/<id>/tasks/<task_id>/status/` |

`TaskStatusView` updates the status and broadcasts a `task_status_changed` WebSocket event to the project's board group.

Task creation and update also broadcast `task_created` / `task_updated` events so all board viewers stay in sync without polling.

#### Sprints (`api/views/sprints.py`)

| View | Methods | URL |
|---|---|---|
| `SprintListCreateView` | GET, POST | `projects/<id>/sprints/` |
| `SprintDetailView` | GET, PATCH, DELETE | `projects/<id>/sprints/<sid>/` |
| `SprintStatusView` | PATCH | `projects/<id>/sprints/<sid>/status/` |
| `BacklogView` | GET | `projects/<id>/backlog/` |

`SprintStatusView` enforces valid transitions: `PLANNING → ACTIVE → COMPLETED`. Only one sprint can be `ACTIVE` at a time. Transitions are logged to `ActivityLog`.

#### Comments (`api/views/comments.py`)

| View | Methods | URL |
|---|---|---|
| `CommentListCreateView` | GET, POST | `projects/<id>/tasks/<task_id>/comments/` |
| `CommentDeleteView` | DELETE | `projects/<id>/tasks/<task_id>/comments/<cid>/` |

`CommentDeleteView` checks that the requesting user is the comment author. Creating a comment broadcasts a `comment_added` WebSocket event.

#### Analytics & Activity (`api/views/analytics.py`, `activity.py`)

| View | Methods | URL |
|---|---|---|
| `AnalyticsView` | GET | `projects/<id>/analytics/` |
| `ActivityFeedView` | GET | `projects/<id>/activity/` |
| `GlobalActivityFeedView` | GET | `activity/` |

`AnalyticsView` returns in a single response:
- `task_counts` — per-status counts
- `tasks_by_priority` — per-priority counts
- `tasks_by_member` — per-assignee per-status counts (using `api/utils.py` helper)
- `overdue_count`
- `active_sprint` — progress %, days remaining, task counts

All aggregations use `values().annotate(Count(...))` ORM queries (no N+1).

#### Dashboard (`api/views/dashboard.py`)

Returns personal task lists (overdue / due today / upcoming), project health summaries, active sprint, and cross-project task distribution in a single request.

#### Notifications (`api/views/notifications.py`)

Returns the authenticated user's unread notification list.

### Authentication

**Class:** `api/authentication.py` → `CookieJWTAuthentication`

Subclasses `JWTAuthentication` from `djangorestframework-simplejwt`. Reads the `access_token` cookie instead of the `Authorization` header. The frontend axios client sends `withCredentials: true` on every request so cookies are included automatically.

Token refresh is handled transparently: if a 401 is returned, the axios response interceptor calls `POST /api/auth/token/refresh/` to get a new access token, then retries the original request.

### Permissions

**File:** `api/permissions.py`

| Class | Logic |
|---|---|
| `IsProjectMember` | `ProjectMembership.objects.filter(user, project_id, is_accepted=True).exists()` |
| `IsProjectAdmin` | Same as above but also `is_admin=True` |

Views compose these with `IsAuthenticated` from DRF.

### WebSockets

**Consumer:** `ws/consumers.py` → `BoardConsumer`

- On connect: joins channel group `board_{project_id}`. Only accepts if `scope['user']` is authenticated.
- On disconnect: leaves group.
- Receives messages from the Django layer via `group_send` (not from the browser directly).
- Relays the message as JSON to all connected clients in the group.

**Middleware:** `ws/middleware.py` → `JWTAuthMiddleware`

Reads the `access_token` cookie from the WebSocket handshake headers, validates it with `simplejwt.tokens.AccessToken`, and sets `scope['user']`. Falls back to `AnonymousUser` on failure.

**Routing:** `ws/routing.py`
```python
websocket_urlpatterns = [
    path('ws/board/<int:project_id>/', BoardConsumer.as_asgi()),
]
```

**ASGI entry point:** `pms/asgi.py`
```python
application = ProtocolTypeRouter({
    'http':      get_asgi_application(),
    'websocket': JWTAuthMiddleware(URLRouter(websocket_urlpatterns)),
})
```

---

## Frontend

### Pages

| Page | Route | Description |
|---|---|---|
| `LandingPage` | `/` | Marketing/intro page |
| `LoginPage` | `/login` | JWT login form |
| `RegisterPage` | `/register` | Registration form |
| `DashboardPage` | `/dashboard` | Personal dashboard |
| `ProjectSelectionPage` | `/projects` | List of user's projects |
| `BoardPage` | `/projects/:id/board` | Kanban board with drag-and-drop |
| `TaskListPage` | `/projects/:id/tasks` | Filterable/searchable task table |
| `SprintPage` | `/projects/:id/sprints` | Sprint management |
| `SprintBoardPage` | `/projects/:id/sprints/:sid/board` | Board scoped to one sprint |
| `BacklogPage` | `/projects/:id/backlog` | Unassigned tasks |
| `ProjectAnalyticsPage` | `/projects/:id/analytics` | Charts and sprint stats |
| `ManagePeoplePage` | `/projects/:id/people` | Members, invitations |
| `AcceptInvitationPage` | `/invitations/:id/accept` | Accept email invite link |

### API Layer

All API calls live in `frontend/src/api/`. Each file maps to a backend resource and returns the raw axios response (so callers access `.data`).

| File | Exports |
|---|---|
| `auth.js` | `login`, `register`, `logout`, `refreshToken`, `me` |
| `projects.js` | `getProjects`, `createProject`, `getProject`, `updateProject`, `deleteProject`, `getMembers`, `addMember`, `removeMember`, `inviteUser` |
| `tasks.js` | `getTasks`, `createTask`, `updateTask`, `deleteTask`, `updateTaskStatus` |
| `sprints.js` | `getSprints`, `createSprint`, `updateSprint`, `deleteSprint`, `updateSprintStatus`, `getBacklog`, `getSprintTasks` |
| `comments.js` | `getComments`, `createComment`, `deleteComment` |
| `analytics.js` | `getAnalytics`, `getProjectActivity`, `getGlobalActivity` |
| `dashboard.js` | `getDashboard` |
| `notifications.js` | `getNotifications`, `markRead` |
| `users.js` | `searchUsers` |

The axios `client` instance (`api/client.js`) is configured with `baseURL=/api/`, `withCredentials: true`, and a response interceptor that retries on 401 after attempting a silent token refresh.

### State & Auth Context

`frontend/src/context/AuthContext.jsx` provides:
- `user` — current user object (null if unauthenticated)
- `login(data)` — sets user state after successful login/register
- `logout()` — clears user state, calls logout API

Protected routes check `useAuth().user` and redirect to `/login` if null.

### WebSocket Hook

`frontend/src/hooks/useProjectWebSocket.js`

```js
useProjectWebSocket(projectId, {
  onTaskStatusChanged: ({ task_id, new_status }) => { ... },
  onTaskCreated:       ({ task })                => { ... },
  onTaskUpdated:       ({ task })                => { ... },
  onTaskDeleted:       ({ task_id })             => { ... },
  onCommentAdded:      ({ comment })             => { ... },
})
```

- Opens `ws[s]://<host>/ws/board/<projectId>/` on mount.
- On close (non-normal), reconnects with **exponential backoff**: starts at 1 s, doubles on each failure, caps at 30 s.
- Backoff resets to 1 s on a successful connection.
- Handler references are kept in a `useRef` so the WS callback always calls the latest version without reconnecting.

The `BoardPage` deduplicates incoming `task_created` events against its local state (in case the creator's own optimistic update already added the task):
```js
onTaskCreated: ({ task }) =>
  setTasks((prev) => prev.some((t) => t.id === task.id) ? prev : [...prev, task])
```

---

## Data Flow Examples

### Creating a task

```
User fills form → handleAdd() →
  POST /api/projects/:id/tasks/
  → TaskListCreateView → TaskSerializer.save()
  → ActivityLog created
  → channel_layer.group_send('board_<id>', { type: 'task_created', task: {...} })
  → BoardConsumer.task_created() → ws.send(JSON) to all group members
  → Other tabs receive WS message → onTaskCreated handler → setTasks(deduplicated)
```

### Moving a task (drag-and-drop)

```
User drops card → handleDragEnd() →
  Optimistic local state update
  PATCH /api/projects/:id/tasks/:task_id/status/
  → TaskStatusView → task.status = new_status → task.save()
  → channel_layer.group_send('board_<id>', { type: 'task_status_changed', ... })
  → All tabs update via onTaskStatusChanged handler
  (on error: local state rolled back)
```

### Silent token refresh

```
Axios request → 401 response →
  interceptor: POST /api/auth/token/refresh/
  → new access_token cookie set →
  original request retried automatically
  (if refresh also fails → user redirected to /login)
```

---

## Environment Variables

Create a `.env` file in the `pms/` directory:

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | hardcoded fallback | Django secret key — **change in production** |
| `DEBUG` | `True` | Set to `False` in production |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated list |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated list |
| `CSRF_TRUSTED_ORIGINS` | `http://localhost:5173` | Comma-separated list |
| `FRONTEND_URL` | `http://localhost:5173` | Used in invitation email links |
| `EMAIL_HOST_USER` | `` | SMTP sender address |
| `EMAIL_HOST_PASSWORD` | `` | SMTP password |

---

## Running the Project

```bash
# 1. Install backend dependencies
pip install -r requirements.txt

# 2. Run migrations
python manage.py migrate

# 3. Install frontend dependencies
cd frontend && npm install && cd ..

# 4. Start both servers (requires make)
make both

# — or manually —
# Terminal 1
daphne -b 0.0.0.0 -p 8000 pms.asgi:application
# Terminal 2
cd frontend && npm run dev
```

Open **http://localhost:5173**.

> **Important:** Use `daphne`, not `python manage.py runserver`. The development server does not support WebSockets.

---

## Database Schema

```
User (Django built-in)
 └── UserProfile         (OneToOne)

Project
 ├── ProjectMembership   (M2M through table — User ↔ Project)
 ├── Invitation          (User invited to Project)
 ├── Sprint              (belongs to Project)
 ├── Task                (belongs to Project, optional Sprint)
 │    └── Comment        (belongs to Task)
 └── ActivityLog         (belongs to Project)

Notification             (belongs to User)
```

All foreign keys use `on_delete=CASCADE` unless noted. `Task.sprint` uses `SET_NULL` so deleting a sprint does not delete tasks — they return to the backlog.

---

## API Reference (Quick Lookup)

```
POST   /api/auth/register/
POST   /api/auth/login/
POST   /api/auth/logout/
POST   /api/auth/token/refresh/
GET    /api/auth/me/

GET    /api/dashboard/
GET    /api/activity/
GET    /api/notifications/
GET    /api/users/?q=<search>

GET    /api/projects/
POST   /api/projects/
GET    /api/projects/:id/
PATCH  /api/projects/:id/
DELETE /api/projects/:id/
GET    /api/projects/:id/members/
POST   /api/projects/:id/members/
PATCH  /api/projects/:id/members/:user_id/
DELETE /api/projects/:id/members/:user_id/
POST   /api/projects/:id/invite/
POST   /api/invitations/:id/accept/

GET    /api/projects/:id/tasks/
POST   /api/projects/:id/tasks/
GET    /api/projects/:id/tasks/:task_id/
PATCH  /api/projects/:id/tasks/:task_id/
DELETE /api/projects/:id/tasks/:task_id/
PATCH  /api/projects/:id/tasks/:task_id/status/

GET    /api/projects/:id/tasks/:task_id/comments/
POST   /api/projects/:id/tasks/:task_id/comments/
DELETE /api/projects/:id/tasks/:task_id/comments/:cid/

GET    /api/projects/:id/sprints/
POST   /api/projects/:id/sprints/
GET    /api/projects/:id/sprints/:sid/
PATCH  /api/projects/:id/sprints/:sid/
DELETE /api/projects/:id/sprints/:sid/
PATCH  /api/projects/:id/sprints/:sid/status/
GET    /api/projects/:id/backlog/

GET    /api/projects/:id/analytics/
GET    /api/projects/:id/activity/

WS     ws://localhost:8000/ws/board/:id/
```
