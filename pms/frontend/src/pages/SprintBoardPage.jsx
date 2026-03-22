import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, useSensor, useSensors, useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { getTasks, createTask, updateTask, deleteTask, updateTaskStatus } from '../api/tasks'
import { getProject, getMembers } from '../api/projects'
import { getSprints } from '../api/sprints'
import { useProjectWebSocket } from '../hooks/useProjectWebSocket'
import Navbar from '../components/layout/Navbar'
import SprintStatusBadge from '../components/sprints/SprintStatusBadge'
import { formatDueDate } from '../utils/dateUtils'
import { toast } from 'sonner'

const STATUSES = ['TODO', 'IN_PROGRESS', 'COMPLETED']
const STATUS_LABEL = { TODO: 'To Do', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed' }
const COL_COLOR = { TODO: 'bg-gray-100', IN_PROGRESS: 'bg-blue-50', COMPLETED: 'bg-green-50' }
const PRI_COLOR = { LOW: 'bg-green-100 text-green-700', MEDIUM: 'bg-yellow-100 text-yellow-700', HIGH: 'bg-red-100 text-red-700' }

function TaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      onClick={() => onClick(task)}
      className="bg-white rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition select-none">
      <p className="font-medium text-gray-800 text-sm">{task.name}</p>
      <p className="text-xs text-gray-400 mt-1">{formatDueDate(task.due_date)}</p>
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-xs px-2 py-0.5 rounded ${PRI_COLOR[task.priority]}`}>{task.priority}</span>
        {task.assignee && <span className="text-xs text-gray-500">@{task.assignee.username}</span>}
      </div>
    </div>
  )
}

function KanbanColumn({ status, tasks, onTaskClick, onAdd }) {
  const { setNodeRef } = useDroppable({ id: status })
  return (
    <div ref={setNodeRef} className={`flex-1 rounded-xl p-4 ${COL_COLOR[status]} min-h-96`}>
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-gray-700">{STATUS_LABEL[status]}</h2>
        <span className="text-xs text-gray-400 bg-white rounded-full px-2 py-0.5">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {tasks.map((t) => <TaskCard key={t.id} task={t} onClick={onTaskClick} />)}
        </div>
      </SortableContext>
      <button onClick={() => onAdd(status)}
        className="mt-3 w-full text-sm text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 rounded-lg py-2 hover:border-gray-400 transition">
        + Add task
      </button>
    </div>
  )
}

function TaskFormModal({ title, initial, members, onSubmit, onClose, onDelete }) {
  const [form, setForm] = useState(initial)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try { await onSubmit(form) } finally { setBusy(false) }
  }

  const sel = (key, label, options) => (
    <select className="border rounded-lg px-3 py-2"
      value={form[key] ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })}>
      <option value="">{label}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-bold mb-4">{title}</h2>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input className="border rounded-lg px-3 py-2" placeholder="Task name"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength="255" />
          <input type="date" className="border rounded-lg px-3 py-2"
            value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
          <textarea className="border rounded-lg px-3 py-2" placeholder="Description" rows={3}
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {sel('priority', 'Priority', [
            { value: 'LOW', label: 'Low' }, { value: 'MEDIUM', label: 'Medium' }, { value: 'HIGH', label: 'High' },
          ])}
          {sel('status', 'Status', [
            { value: 'TODO', label: 'To Do' }, { value: 'IN_PROGRESS', label: 'In Progress' }, { value: 'COMPLETED', label: 'Completed' },
          ])}
          {sel('assignee_id', 'Assignee (optional)', members.map((m) => ({ value: String(m.user_id), label: m.username })))}
          {sel('report_to_id', 'Report To (optional)', members.map((m) => ({ value: String(m.user_id), label: m.username })))}
          <div className="flex justify-between mt-2">
            {onDelete
              ? <button type="button" onClick={onDelete} className="text-red-500 hover:text-red-700 text-sm">Delete task</button>
              : <span />}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600">Cancel</button>
              <button type="submit" disabled={busy}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

const BLANK = { name: '', due_date: '', description: '', priority: 'LOW', status: 'TODO', assignee_id: '', report_to_id: '' }

export default function SprintBoardPage() {
  const { id, sprintId } = useParams()
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [sprint, setSprint] = useState(null)
  const [project, setProject] = useState(null)
  const [active, setActive] = useState(null)
  const [addStatus, setAddStatus] = useState(null)
  const [editTask, setEditTask] = useState(null)

  useEffect(() => {
    getTasks(id).then((res) => {
      const sprintTasks = res.data.filter((t) => t.sprint === parseInt(sprintId))
      setTasks(sprintTasks)
    })
    getSprints(id).then((res) => {
      const s = res.data.find((s) => s.id === parseInt(sprintId))
      setSprint(s)
    })
    getProject(id).then((res) => setProject(res.data))
    getMembers(id).then((res) => setMembers(res.data))
  }, [id, sprintId])

  useProjectWebSocket(id, {
    onTaskStatusChanged: ({ task_id, new_status }) =>
      setTasks((prev) => prev.map((t) => t.id === task_id ? { ...t, status: new_status } : t)),
    onTaskCreated: ({ task }) => {
      if (task.sprint === parseInt(sprintId)) {
        setTasks((prev) => [...prev, task])
      }
    },
    onTaskUpdated: ({ task }) => {
      if (task.sprint === parseInt(sprintId)) {
        setTasks((prev) => prev.map((t) => t.id === task.id ? task : t))
      }
    },
    onTaskDeleted: ({ task_id }) => setTasks((prev) => prev.filter((t) => t.id !== task_id)),
  })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragStart = ({ active: a }) => setActive(tasks.find((t) => t.id === a.id) ?? null)

  const handleDragEnd = async ({ active: a, over }) => {
    setActive(null)
    if (!over) return
    const dragged = tasks.find((t) => t.id === a.id)
    if (!dragged) return
    let targetStatus = null
    for (const s of STATUSES) {
      if (over.id === s || tasks.filter((t) => t.status === s).some((t) => t.id === over.id)) {
        targetStatus = s
        break
      }
    }
    if (!targetStatus || targetStatus === dragged.status) return
    setTasks((prev) => prev.map((t) => t.id === dragged.id ? { ...t, status: targetStatus } : t))
    try {
      await updateTaskStatus(id, dragged.id, targetStatus)
    } catch {
      setTasks((prev) => prev.map((t) => t.id === dragged.id ? { ...t, status: dragged.status } : t))
      toast.error('Failed to update status')
    }
  }

  const handleAdd = async (form) => {
    const payload = { ...form, sprint_id: parseInt(sprintId) }
    if (!payload.assignee_id) delete payload.assignee_id
    if (!payload.report_to_id) delete payload.report_to_id
    try {
      const res = await createTask(id, payload)
      setTasks((prev) => [...prev, res.data])
      setAddStatus(null)
      toast.success('Task created')
    } catch (error) {
      console.error('Task creation failed:', error.response?.data || error.message)
      toast.error(`Failed to create task: ${error.response?.data?.detail || error.message}`)
    }
  }

  const handleEdit = async (form) => {
    const payload = { ...form, assignee_id: form.assignee_id || null, report_to_id: form.report_to_id || null }
    try {
      const res = await updateTask(id, editTask.id, payload)
      setTasks((prev) => prev.map((t) => t.id === res.data.id ? res.data : t))
      setEditTask(null)
      toast.success('Task updated')
    } catch (error) {
      console.error('Task update failed:', error.response?.data || error.message)
      toast.error(`Failed to update task: ${error.response?.data?.detail || error.message}`)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return
    try {
      await deleteTask(id, editTask.id)
      setTasks((prev) => prev.filter((t) => t.id !== editTask.id))
      setEditTask(null)
      toast.success('Task deleted')
    } catch (error) {
      console.error('Task delete failed:', error.response?.data || error.message)
      toast.error(`Failed to delete task: ${error.response?.data?.detail || error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-6">
        {sprint && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{sprint.name}</h2>
                {sprint.goal && <p className="text-gray-600 text-sm">{sprint.goal}</p>}
              </div>
              <SprintStatusBadge status={sprint.status} />
            </div>
            <div className="text-sm text-gray-600 mb-3">
              {sprint.start_date} to {sprint.end_date}
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-700">Progress</span>
                <span className="text-xs text-gray-600">{sprint.completed_count}/{sprint.task_count}</span>
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
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <Link to={`/projects/${id}/sprints`} className="text-blue-600 hover:underline">← Back to Sprints</Link>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCorners}
          onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4">
            {STATUSES.map((s) => (
              <KanbanColumn key={s} status={s}
                tasks={tasks.filter((t) => t.status === s)}
                onTaskClick={setEditTask}
                onAdd={setAddStatus} />
            ))}
          </div>
          <DragOverlay>
            {active && (
              <div className="bg-white rounded-lg p-3 shadow-lg border border-blue-300 w-64 opacity-90">
                <p className="font-medium text-sm">{active.name}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {addStatus && (
        <TaskFormModal
          title="New Task"
          initial={{ ...BLANK, status: addStatus }}
          members={members}
          onSubmit={handleAdd}
          onClose={() => setAddStatus(null)}
        />
      )}

      {editTask && (
        <TaskFormModal
          title="Edit Task"
          initial={{
            name: editTask.name, due_date: editTask.due_date,
            description: editTask.description, priority: editTask.priority,
            status: editTask.status,
            assignee_id: String(editTask.assignee?.id ?? ''),
            report_to_id: String(editTask.report_to?.id ?? ''),
          }}
          members={members}
          onSubmit={handleEdit}
          onClose={() => setEditTask(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
