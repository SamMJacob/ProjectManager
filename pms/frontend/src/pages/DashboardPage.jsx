import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader, AlertCircle } from 'lucide-react'
import { getDashboard } from '../api/dashboard'
import { getGlobalActivity } from '../api/analytics'
import { updateTaskStatus } from '../api/tasks'
import Navbar from '../components/layout/Navbar'
import MyTasksPanel from '../components/dashboard/MyTasksPanel'
import ProjectHealthCard from '../components/dashboard/ProjectHealthCard'
import ActivityFeed from '../components/dashboard/ActivityFeed'
import { toast } from 'sonner'

function StatCard({ label, value, color, icon }) {
  const borderColor = {
    red: 'border-red-400', yellow: 'border-yellow-400',
    green: 'border-green-400', blue: 'border-blue-400',
  }[color] ?? 'border-gray-300'
  const textColor = {
    red: 'text-red-600', yellow: 'text-yellow-600',
    green: 'text-green-600', blue: 'text-blue-600',
  }[color] ?? 'text-gray-800'
  return (
    <div className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${borderColor}`}>
      <p className="text-sm text-gray-500">{icon} {label}</p>
      <p className={`text-3xl font-bold mt-1 ${textColor}`}>{value}</p>
    </div>
  )
}

function ActiveSprintBanner({ sprint }) {
  if (!sprint) return null
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide">Active Sprint</p>
        <p className="font-semibold text-blue-800 mt-0.5">{sprint.name}</p>
        <p className="text-sm text-blue-600">{sprint.project_name}</p>
      </div>
      <Link
        to={`/projects/${sprint.project_id}/analytics`}
        className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        View Analytics →
      </Link>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData]         = useState(null)
  const [activity, setActivity] = useState([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))

    getGlobalActivity()
      .then((res) => setActivity(res.data))
      .finally(() => setActivityLoading(false))
  }, [])

  const handleStatusChange = async (projectId, taskId, newStatus) => {
    try {
      await updateTaskStatus(projectId, taskId, newStatus)
      const res = await getDashboard()
      setData(res.data)
      toast.success('Status updated')
    } catch (error) {
      console.error('Status update failed:', error.response?.data || error.message)
      toast.error('Failed to update status')
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-20">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">Error loading dashboard: {error}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Overdue"   value={data.overdue.length}   color="red"    icon="⚠️" />
          <StatCard label="Due Today" value={data.due_today.length}  color="yellow" icon="📅" />
          <StatCard label="Upcoming"  value={data.upcoming.length}   color="green"  icon="✅" />
          <StatCard label="Projects"  value={data.projects_health?.length ?? 0} color="blue" icon="📁" />
        </div>

        {/* Active sprint */}
        <div className="mb-6">
          <ActiveSprintBanner sprint={data.active_sprint} />
        </div>

        {/* My tasks + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <MyTasksPanel
              overdue={data.overdue}
              dueToday={data.due_today}
              upcoming={data.upcoming}
              onStatusChange={handleStatusChange}
            />
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <h2 className="font-semibold text-gray-700 mb-3">Recent Activity</h2>
            <ActivityFeed items={activity} loading={activityLoading} />
          </div>
        </div>

        {/* Project health */}
        {data.projects_health?.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-700 mb-3">Project Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {data.projects_health.map((p) => (
                <Link key={p.id} to={`/projects/${p.id}/analytics`} className="block hover:opacity-90 transition">
                  <ProjectHealthCard project={p} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
