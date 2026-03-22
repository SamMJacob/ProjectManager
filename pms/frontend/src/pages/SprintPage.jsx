import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getSprints, createSprint, deleteSprint, setSprintStatus } from '../api/sprints'
import { getProject } from '../api/projects'
import Navbar from '../components/layout/Navbar'
import SprintStatusBadge from '../components/sprints/SprintStatusBadge'
import { toast } from 'sonner'

export default function SprintPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [sprints, setSprints] = useState([])
  const [project, setProject] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', goal: '', start_date: '', end_date: '' })

  useEffect(() => {
    getSprints(id).then((res) => setSprints(res.data))
    getProject(id).then((res) => setProject(res.data))
  }, [id])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createSprint(id, form)
      setSprints((prev) => [])
      getSprints(id).then((res) => setSprints(res.data))
      setShowForm(false)
      setForm({ name: '', goal: '', start_date: '', end_date: '' })
      toast.success('Sprint created')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create sprint')
    }
  }

  const handleStartSprint = async (sprint) => {
    try {
      await setSprintStatus(id, sprint.id, 'ACTIVE')
      setSprints((prev) => prev.map((s) => s.id === sprint.id ? { ...s, status: 'ACTIVE' } : s))
      toast.success('Sprint started')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start sprint')
    }
  }

  const handleCompleteSprint = async (sprint) => {
    try {
      await setSprintStatus(id, sprint.id, 'COMPLETED')
      setSprints((prev) => prev.map((s) => s.id === sprint.id ? { ...s, status: 'COMPLETED' } : s))
      toast.success('Sprint completed')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to complete sprint')
    }
  }

  const handleDeleteSprint = async (sprint) => {
    if (!confirm(`Delete sprint "${sprint.name}"?`)) return
    try {
      await deleteSprint(id, sprint.id)
      setSprints((prev) => prev.filter((s) => s.id !== sprint.id))
      toast.success('Sprint deleted')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete sprint')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{project?.name} — Sprints</h1>
            <Link to={`/projects/${id}/board`} className="text-sm text-blue-600 hover:underline">← Back to Board</Link>
          </div>
          {project?.is_admin && (
            <button onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              + New Sprint
            </button>
          )}
        </div>

        <div className="flex gap-4 mb-6">
          <Link to={`/projects/${id}/backlog`}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">
            View Backlog
          </Link>
        </div>

        <div className="space-y-4">
          {sprints.map((sprint) => (
            <div key={sprint.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 cursor-pointer" onClick={() => navigate(`/projects/${id}/sprints/${sprint.id}/board`)}>
                  <h2 className="text-lg font-semibold text-gray-800 hover:text-blue-600">{sprint.name}</h2>
                  {sprint.goal && <p className="text-gray-600 text-sm mt-1">{sprint.goal}</p>}
                </div>
                <SprintStatusBadge status={sprint.status} />
              </div>

              <div className="text-sm text-gray-600 mb-4">
                {sprint.start_date} to {sprint.end_date}
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm text-gray-600">{sprint.completed_count}/{sprint.task_count}</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: sprint.task_count > 0 ? `${(sprint.completed_count / sprint.task_count) * 100}%` : '0%'
                    }}
                  />
                </div>
              </div>

              {project?.is_admin && (
                <div className="flex gap-2">
                  {sprint.status === 'PLANNING' && (
                    <button onClick={() => handleStartSprint(sprint)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200">
                      Start Sprint
                    </button>
                  )}
                  {sprint.status === 'ACTIVE' && (
                    <button onClick={() => handleCompleteSprint(sprint)}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200">
                      Complete Sprint
                    </button>
                  )}
                  <button onClick={() => handleDeleteSprint(sprint)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {sprints.length === 0 && (
          <p className="text-center text-gray-400 py-10">No sprints yet. Create one to get started!</p>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold mb-4">New Sprint</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <input className="border rounded-lg px-3 py-2" placeholder="Sprint name"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <textarea className="border rounded-lg px-3 py-2" placeholder="Goal (optional)" rows={2}
                value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} />
              <input type="date" className="border rounded-lg px-3 py-2"
                value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
              <input type="date" className="border rounded-lg px-3 py-2"
                value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
