import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

export default function ProjectHealthCard({ project }) {
  const completionRate = project.total > 0 ? Math.round((project.completed / project.total) * 100) : 0;

  const healthStatus =
    project.overdue > 0 ? 'critical' :
    completionRate < 50 ? 'at-risk' :
    'healthy';

  const statusColor = {
    critical: 'text-red-600 bg-red-50',
    'at-risk': 'text-yellow-600 bg-yellow-50',
    healthy: 'text-green-600 bg-green-50',
  }[healthStatus];

  const statusIcon = {
    critical: AlertCircle,
    'at-risk': TrendingUp,
    healthy: CheckCircle2,
  }[healthStatus];

  const StatusIcon = statusIcon;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold">{project.name}</h3>
        <div className={`p-2 rounded-lg ${statusColor}`}>
          <StatusIcon className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm text-gray-600">Completion</p>
            <p className="font-semibold text-green-600">{completionRate}%</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-green-500 transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{project.total}</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-600">{project.completed}</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-red-600 mb-1">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{project.overdue}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
