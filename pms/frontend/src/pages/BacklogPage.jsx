import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getBacklog, getSprints, assignTaskSprint } from '../api/sprints'
import { getProject } from '../api/projects'
import Navbar from '../components/layout/Navbar'
import { formatDueDate } from '../utils/dateUtils'
import { toast } from 'sonner'

const PRI = { LOW: 'text-green-600', MEDIUM: 'text-yellow-600', HIGH: 'text-red-600' }
const STA = { TODO: 'To Do', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed' }

export default function BacklogPage() {
  const { id } = useParams()
  const [tasks, setTasks] = useState([])
  const [sprints, setSprints] = useState([])
  const [project, setProject] = useState(null)

  useEffect(() => {
    getBacklog(id).then((res) => setTasks(res.data))
    getSprints(id).then((res) => setSprints(res.data.filter((s) => s.status !== 'COMPLETED')))
    getProject(id).then((res) => setProject(res.data))
  }, [id])

  const handleAssignSprint = async (task, sprintId) => {
    if (!sprintId) return
    try {
      await assignTaskSprint(id, task.id, parseInt(sprintId))
      setTasks((prev) => prev.filter((t) => t.id !== task.id))
      toast.success('Task added to sprint')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign task')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Backlog — {project?.name}</h1>
          <Link to={`/projects/${id}/board`} className="text-sm text-blue-600 hover:underline">← Board</Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>{['Task Name', 'Due Date', 'Priority', 'Status', 'Assignee', 'Add to Sprint'].map((h) =>
                <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDueDate(t.due_date)}</td>
                  <td className={`px-4 py-3 font-medium ${PRI[t.priority]}`}>{t.priority}</td>
                  <td className="px-4 py-3 text-gray-600">{STA[t.status]}</td>
                  <td className="px-4 py-3 text-gray-500">{t.assignee?.username ?? '—'}</td>
                  <td className="px-4 py-3">
                    <select className="border rounded-lg px-2 py-1 text-sm"
                      onChange={(e) => handleAssignSprint(t, e.target.value)}>
                      <option value="">Select sprint</option>
                      {sprints.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && (
            <p className="text-center text-gray-400 py-10">No backlog tasks. All tasks are assigned to sprints.</p>
          )}
        </div>
      </div>
    </div>
  )
}
