const COLORS = {
  PLANNING: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
}

export default function SprintStatusBadge({ status }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COLORS[status] ?? ''}`}>
      {status}
    </span>
  )
}
