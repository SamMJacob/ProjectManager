import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const statusColor = {
  TODO: 'text-gray-600',
  IN_PROGRESS: 'text-blue-600',
  COMPLETED: 'text-green-600',
};

const priorityColor = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-red-100 text-red-800',
};

export default function MyTasksPanel({ overdue = [], dueToday = [], upcoming = [] }) {
  const sections = [
    { label: 'Overdue', tasks: overdue, icon: AlertCircle, color: 'text-red-600' },
    { label: 'Due Today', tasks: dueToday, icon: CheckCircle2, color: 'text-orange-600' },
    { label: 'Upcoming', tasks: upcoming, icon: Circle, color: 'text-blue-600' },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-6">My Tasks</h3>

      <div className="space-y-6">
        {sections.map(({ label, tasks, icon: Icon, color }) => (
          <div key={label}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`w-5 h-5 ${color}`} />
              <h4 className="font-semibold text-gray-900">{label}</h4>
              <span className="ml-auto text-sm text-gray-500">{tasks.length}</span>
            </div>

            {tasks.length === 0 ? (
              <p className="text-sm text-gray-500 ml-7">No tasks</p>
            ) : (
              <div className="space-y-2 ml-7">
                {tasks.slice(0, 5).map(task => (
                  <div
                    key={task.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{task.project_name ?? ''}</p>
                      </div>
                      {task.priority && (
                        <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${priorityColor[task.priority]}`}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {tasks.length > 5 && (
                  <p className="text-sm text-blue-600 font-medium ml-1">+{tasks.length - 5} more</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
