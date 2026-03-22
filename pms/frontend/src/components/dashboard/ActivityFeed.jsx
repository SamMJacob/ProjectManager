import { formatDistanceToNow } from 'date-fns';

export default function ActivityFeed({ items = [], loading = false }) {
  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
    </div>
  )

  if (items.length === 0) return (
    <p className="text-gray-400 text-sm text-center py-4">No recent activity.</p>
  )

  return (
    <div className="space-y-3">
      {items.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-blue-600">
              {activity.user?.username?.[0]?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800">
              <span className="font-medium">{activity.user?.username}</span>{' '}
              {activity.detail || activity.action}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {activity.created_at
                ? formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })
                : 'Recently'}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
