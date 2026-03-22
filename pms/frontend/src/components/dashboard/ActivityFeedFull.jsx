import { useState, useEffect } from 'react'
import { Loader } from 'lucide-react'
import { getProjectActivity, getGlobalActivity } from '../../api/analytics'

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(dateStr).toLocaleDateString()
}

const ACTION_ICONS = {
  TASK_CREATED: '✅',
  TASK_STATUS_CHANGED: '🔄',
  COMMENT_ADDED: '💬',
  MEMBER_ADDED: '👤',
  SPRINT_STARTED: '🚀',
  SPRINT_COMPLETED: '🏁',
  TASK_DELETED: '🗑️',
  TASK_UPDATED: '✏️',
}

const ACTION_LABELS = {
  TASK_CREATED: 'created task',
  TASK_STATUS_CHANGED: 'changed task status',
  COMMENT_ADDED: 'commented on task',
  MEMBER_ADDED: 'added member',
  SPRINT_STARTED: 'started sprint',
  SPRINT_COMPLETED: 'completed sprint',
  TASK_DELETED: 'deleted task',
  TASK_UPDATED: 'updated task',
}

export default function ActivityFeedFull({ projectId = null }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchActivity() {
      try {
        setLoading(true)
        const res = projectId
          ? await getProjectActivity(projectId)
          : await getGlobalActivity()
        setItems(res.data || [])
      } catch (error) {
        console.error('Failed to fetch activity:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [projectId])

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <p>No activity yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
        >
          <div className="flex gap-3">
            <div className="text-2xl flex-shrink-0">
              {ACTION_ICONS[item.action] || '📝'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-semibold">{item.user?.username || 'User'}</span>
                {' '}
                {ACTION_LABELS[item.action] || item.action.toLowerCase()}
                {item.task_name && (
                  <span className="text-gray-600"> — {item.task_name}</span>
                )}
              </p>
              {item.detail && (
                <p className="text-sm text-gray-600 mt-1">{item.detail}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <p className="text-xs text-gray-500">{timeAgo(item.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
