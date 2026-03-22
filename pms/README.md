# FlowBoard

A full-stack project management application built with Django REST Framework and React. FlowBoard gives teams a Kanban board, sprint tracking, task analytics, real-time collaboration, and a personal dashboard — all in one place.

---

## Features

### Core
- **Kanban Board** — drag-and-drop tasks across To Do / In Progress / Completed columns with real-time updates across all open browser tabs via WebSockets
- **Task Management** — create, edit, and delete tasks with name, description, priority (Low / Medium / High), due date, assignee, and file attachment support
- **Comments** — threaded comments on each task; users can delete their own comments
- **Sprint Tracking** — create sprints, move them through Planning → Active → Completed, assign backlog tasks to a sprint, and view a dedicated sprint board
- **Backlog** — tasks not yet assigned to a sprint live in the backlog and can be dragged into any sprint

### People & Access
- **Project membership** — invite users by email, accept via link; project admins can promote/remove members
- **Role-based permissions** — admins manage sprints and member roster; members can work on tasks

### Analytics & Observability
- **Project Analytics page** — task status distribution (bar chart), priority breakdown (pie chart), per-member workload (stacked bar chart), active sprint progress bar, overdue count
- **Activity Log** — every significant action (task created/updated/deleted, sprint started/completed, comments) is recorded and viewable per-project or globally
- **Notifications** — bell icon in the navbar; in-app notifications for task assignment and sprint events

### Personal Dashboard
- Tasks grouped into Overdue / Due Today / Upcoming across all your projects
- Project health cards showing total / completed / overdue counts with a link to each project's analytics page
- Active sprint banner
- Global activity feed

### Real-time
- WebSocket connection per board (`/ws/board/<project_id>/`) broadcasts task status changes, creations, updates, deletions, and new comments to all connected clients instantly

---

## Tech Stack

### Backend
| Package | Purpose |
|---|---|
| Django 5.1 | Core framework, ORM, email |
| Django REST Framework 3.17 | API views, serializers, permissions |
| djangorestframework-simplejwt 5.5 | JWT auth (httpOnly cookies) |
| Django Channels 4.3 | WebSocket consumer |
| Daphne 4.2 | ASGI server (required for WebSocket support) |
| django-cors-headers 4.9 | CORS for local dev |

### Frontend
| Package | Purpose |
|---|---|
| React 19 + Vite 8 | UI framework and dev server |
| Tailwind CSS 3 | Utility-first styling |
| React Router 7 | Client-side routing |
| axios | HTTP client |
| @dnd-kit/core + sortable | Drag-and-drop on the board |
| recharts | Analytics charts |
| lucide-react | Icons |
| date-fns | Date formatting |
| sonner | Toast notifications |

---

## Project Structure

```
pms/
├── Accounts/          # Django app — UserProfile model
├── board/             # Django app — Task model
├── projects/          # Django app — Project, ProjectMembership, Invitation, Sprint, Comment, ActivityLog
├── api/               # DRF app — all REST views, serializers, permissions, JWT auth
│   ├── views/
│   │   ├── auth.py       register, login, logout, token refresh, me
│   │   ├── projects.py   project CRUD, member management, email invite
│   │   ├── tasks.py      task CRUD, status change
│   │   ├── sprints.py    sprint CRUD, status transitions, backlog
│   │   ├── comments.py   task comments
│   │   ├── analytics.py  project analytics endpoint
│   │   ├── activity.py   per-project and global activity feed
│   │   ├── dashboard.py  personal dashboard data
│   │   ├── notifications.py  in-app notifications
│   │   └── users.py      user search
│   ├── serializers/
│   ├── permissions.py    IsProjectMember, IsProjectAdmin
│   ├── authentication.py CookieJWTAuthentication
│   └── utils.py          shared task aggregation helpers
├── ws/                # Django Channels app
│   ├── consumers.py   BoardConsumer — handles WS connections and broadcasts
│   ├── middleware.py  JWTAuthMiddleware — authenticates WS via access_token cookie
│   └── routing.py     ws/board/<project_id>/
├── pms/
│   ├── settings.py
│   ├── urls.py
│   └── asgi.py        ProtocolTypeRouter — HTTP via Django, WS via Channels
└── frontend/
    └── src/
        ├── pages/
        │   ├── DashboardPage.jsx
        │   ├── BoardPage.jsx
        │   ├── TaskListPage.jsx
        │   ├── SprintPage.jsx
        │   ├── SprintBoardPage.jsx
        │   ├── BacklogPage.jsx
        │   ├── ProjectAnalyticsPage.jsx
        │   ├── ManagePeoplePage.jsx
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   └── AcceptInvitationPage.jsx
        ├── components/
        │   ├── layout/    Navbar, NotificationBell
        │   ├── dashboard/ ActivityFeed, MyTasksPanel
        │   ├── tasks/     CommentThread
        │   └── sprints/   SprintCard
        ├── api/           axios wrappers for every endpoint
        ├── hooks/
        │   └── useProjectWebSocket.js  WS connection with exponential backoff
        └── context/
            └── AuthContext.jsx
```

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- pip

### 1. Clone and install backend dependencies

```bash
cd pms
pip install -r requirements.txt
```

### 2. Apply migrations

```bash
python manage.py migrate
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
```

### 4. Environment variables (optional)

Create a `.env` file in `pms/` to override defaults:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173
FRONTEND_URL=http://localhost:5173
EMAIL_HOST_USER=your@email.com
EMAIL_HOST_PASSWORD=yourpassword
```

### 5. Run the servers

**Option A — using Make (recommended):**
```bash
make both        # starts backend + frontend in parallel
```

**Option B — manually:**
```bash
# Terminal 1 — backend (must be Daphne, not runserver, for WebSocket support)
daphne -b 0.0.0.0 -p 8000 pms.asgi:application

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open **http://localhost:5173** in your browser.

---

## API Reference

All endpoints are prefixed with `/api/`.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `auth/register/` | Register a new user |
| POST | `auth/login/` | Log in, sets httpOnly JWT cookies |
| POST | `auth/logout/` | Clear JWT cookies |
| POST | `auth/token/refresh/` | Silently refresh access token |
| GET | `auth/me/` | Current authenticated user |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET / POST | `projects/` | List or create projects |
| GET / PATCH / DELETE | `projects/<id>/` | Project detail |
| GET / POST | `projects/<id>/members/` | List or add members |
| DELETE / PATCH | `projects/<id>/members/<user_id>/` | Remove or update member |
| POST | `projects/<id>/invite/` | Send email invitation |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET / POST | `projects/<id>/tasks/` | List or create tasks |
| GET / PATCH / DELETE | `projects/<id>/tasks/<task_id>/` | Task detail |
| PATCH | `projects/<id>/tasks/<task_id>/status/` | Update task status |

### Comments
| Method | Endpoint | Description |
|---|---|---|
| GET / POST | `projects/<id>/tasks/<task_id>/comments/` | List or add comments |
| DELETE | `projects/<id>/tasks/<task_id>/comments/<cid>/` | Delete own comment |

### Sprints & Backlog
| Method | Endpoint | Description |
|---|---|---|
| GET / POST | `projects/<id>/sprints/` | List or create sprints |
| GET / PATCH / DELETE | `projects/<id>/sprints/<sid>/` | Sprint detail |
| PATCH | `projects/<id>/sprints/<sid>/status/` | Transition sprint status |
| GET | `projects/<id>/backlog/` | Tasks not assigned to any sprint |

### Analytics & Activity
| Method | Endpoint | Description |
|---|---|---|
| GET | `projects/<id>/analytics/` | Project analytics data |
| GET | `projects/<id>/activity/` | Project activity log |
| GET | `activity/` | Global activity feed (all user's projects) |
| GET | `dashboard/` | Personal dashboard data |
| GET | `notifications/` | User notifications |

### WebSocket
```
ws://localhost:8000/ws/board/<project_id>/
```
Authenticates via the `access_token` httpOnly cookie. Broadcasts:
- `task_status_changed` — task moved between columns
- `task_created` — new task added
- `task_updated` — task edited
- `task_deleted` — task removed
- `comment_added` — new comment posted

---

## Authentication

JWT tokens are stored in **httpOnly cookies** (`access_token`, `refresh_token`) — never in `localStorage`. The frontend axios client automatically includes credentials on every request. Silent token refresh is handled transparently via a response interceptor.

WebSocket connections are authenticated by the same `access_token` cookie, read by `JWTAuthMiddleware` in `ws/middleware.py`.

---

## Make Commands

```bash
make backend    # start Daphne on port 8000
make frontend   # start Vite dev server
make both       # start both in parallel
make migrate    # run django migrations
make check      # run django system check
```
