import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'

import LandingPage           from './pages/LandingPage'
import LoginPage             from './pages/LoginPage'
import RegisterPage          from './pages/RegisterPage'
import AcceptInvitationPage  from './pages/AcceptInvitationPage'
import ProjectSelectionPage  from './pages/ProjectSelectionPage'
import DashboardPage         from './pages/DashboardPage'
import BoardPage             from './pages/BoardPage'
import TaskListPage          from './pages/TaskListPage'
import ManagePeoplePage      from './pages/ManagePeoplePage'
import SprintPage            from './pages/SprintPage'
import SprintBoardPage       from './pages/SprintBoardPage'
import BacklogPage           from './pages/BacklogPage'
import ProjectAnalyticsPage  from './pages/ProjectAnalyticsPage'

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/"        element={<LandingPage />} />
          <Route path="/login"   element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/invitations/:invitationId/accept" element={<AcceptInvitationPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/projects"               element={<ProjectSelectionPage />} />
            <Route path="/dashboard"              element={<DashboardPage />} />
            <Route path="/projects/:id/board"     element={<BoardPage />} />
            <Route path="/projects/:id/tasks"     element={<TaskListPage />} />
            <Route path="/projects/:id/manage"    element={<ManagePeoplePage />} />
            <Route path="/projects/:id/sprints"   element={<SprintPage />} />
            <Route path="/projects/:id/sprints/:sprintId/board" element={<SprintBoardPage />} />
            <Route path="/projects/:id/backlog"   element={<BacklogPage />} />
            <Route path="/projects/:id/analytics" element={<ProjectAnalyticsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
