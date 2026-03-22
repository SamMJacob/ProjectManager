import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getTasks, createTask, updateTask, deleteTask } from '../api/tasks'
import { getProject, getMembers } from '../api/projects'
import Navbar from '../components/layout/Navbar'
import { formatDueDate } from '../utils/dateUtils'
import { toast } from 'sonner'

const PRI = { LOW: 'text-green-600', MEDIUM: 'text-yellow-600', HIGH: 'text-red-600' }
const STA = { TODO: 'To Do', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed' }
const BLANK = { name: '', due_date: '', description: '', priority: 'LOW', status: 'TODO', assignee_id: '', report_to_id: '' }

export default function TaskListPage() {
  const { id } = useParams()
  const [tasks,   setTasks]   = useState([])
  const [members, setMembers] = useState([])
  const [project, setProject] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [form, setForm] = useState(BLANK)

  useEffect(() => {
    getTasks(id).then((r) => setTasks(r.data))
    getProject(id).then((r) => setProject(r.data))
    getMembers(id).then((r) => setMembers(r.data))
  }, [id])

  const memberOpts = members.map((m) => (
    <option key={m.user_id} value={m.user_id}>{m.username}</option>
  ))

  const fields = (data, onChange) => (
    <>
      <input className="border rounded-lg px-3 py-2" placeholder="Name" required
        value={data.name} onChange={(e) => onChange({ ...data, name: e.target.value })} />
      <input type="date" className="border rounded-lg px-3 py-2" required
        value={data.due_date} onChange={(e) => onChange({ ...data, due_date: e.target.value })} />
      <textarea className="border rounded-lg px-3 py-2" placeholder="Description" rows={2}
        value={data.description} onChange={(e) => onChange({ ...data, description: e.target.value })} />
      <div className="flex gap-2">
        <select className="border rounded-lg px-3 py-2 flex-1"
          value={data.priority} onChange={(e) => onChange({ ...data, priority: e.target.value })}>
          <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
        </select>
        <select className="border rounded-lg px-3 py-2 flex-1"
          value={data.status} onChange={(e) => onChange({ ...data, status: e.target.value })}>
          <option value="TODO">To Do</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option>
        </select>
      </div>
      <div className="flex gap-2">
        <select className="border rounded-lg px-3 py-2 flex-1"
          value={data.assignee_id ?? ''} onChange={(e) => onChange({ ...data, assignee_id: e.target.value })}>
          <option value="">Assignee</option>{memberOpts}
        </select>
        <select className="border rounded-lg px-3 py-2 flex-1"
          value={data.report_to_id ?? ''} onChange={(e) => onChange({ ...data, report_to_id: e.target.value })}>
          <option value="">Report To</option>{memberOpts}
        </select>
      </div>
    </>
  )

  const handleCreate = async (e) => {
    e.preventDefault()
    const payload = { ...form }
    if (!payload.assignee_id)  delete payload.assignee_id
    if (!payload.report_to_id) delete payload.report_to_id
    try {
      const res = await createTask(id, payload)
      setTasks((p) => [...p, res.data])
      setShowAdd(false); setForm(BLANK)
      toast.success('Task created')
    } catch { toast.error('Failed to create task') }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    const payload = { ...editTask, assignee_id: editTask.assignee_id || null, report_to_id: editTask.report_to_id || null }
    try {
      const res = await updateTask(id, editTask.id, payload)
      setTasks((p) => p.map((t) => t.id === res.data.id ? res.data : t))
      setEditTask(null); toast.success('Task updated')
    } catch { toast.error('Failed to update task') }
  }

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return
    try {
      await deleteTask(id, taskId)
      setTasks((p) => p.filter((t) => t.id !== taskId))
      setEditTask(null); toast.success('Task deleted')
    } catch { toast.error('Failed to delete task') }
  }

  const Modal = ({ title, data, onChange, onSubmit, onClose, taskId }) => (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-bold mb-4">{title}</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          {fields(data, onChange)}
          <div className="flex justify-between mt-2">
            {taskId
              ? <button type="button" onClick={() => handleDelete(taskId)} className="text-red-500 text-sm">Delete</button>
              : <span />}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600">Cancel</button>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Save</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">{project?.name} — Tasks</h1>
            <Link to={`/projects/${id}/board`} className="text-sm text-blue-600 hover:underline">← Board</Link>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Add Task</button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>{['Name','Due','Priority','Status','Assignee','Actions'].map((h) =>
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
                    <button onClick={() => setEditTask({
                        ...t, assignee_id: String(t.assignee?.id ?? ''), report_to_id: String(t.report_to?.id ?? '')
                      })} className="text-blue-500 hover:text-blue-700 mr-3">Edit</button>
                    <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!tasks.length && <p className="text-center text-gray-400 py-10">No tasks yet.</p>}
        </div>
      </div>

      {showAdd && <Modal title="New Task" data={form} onChange={setForm}
        onSubmit={handleCreate} onClose={() => setShowAdd(false)} />}
      {editTask && <Modal title="Edit Task" data={editTask} onChange={setEditTask}
        onSubmit={handleUpdate} onClose={() => setEditTask(null)} taskId={editTask.id} />}
    </div>
  )
}
