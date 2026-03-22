import { Calendar, CheckCircle2, Target } from 'lucide-react';

export default function SprintProgressCard({ sprint }) {
  if (!sprint) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-500">No active sprint</p>
      </div>
    );
  }

  const progressColor =
    sprint.progress_pct >= 75 ? 'text-green-600' :
    sprint.progress_pct >= 50 ? 'text-blue-600' :
    sprint.progress_pct >= 25 ? 'text-yellow-600' :
    'text-red-600';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">{sprint.name}</h3>

      {sprint.goal && (
        <div className="mb-4 flex items-start gap-2">
          <Target className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600">Goal</p>
            <p className="text-sm font-medium">{sprint.goal}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Start Date</p>
            <p className="font-medium">{new Date(sprint.start_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">End Date</p>
            <p className="font-medium">{new Date(sprint.end_date).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <p className="text-sm text-gray-600">
            <span className="font-medium">{sprint.days_remaining}</span> days remaining
          </p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-600">Progress</p>
            <p className={`font-semibold ${progressColor}`}>
              {sprint.completed_count} / {sprint.task_count}
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${progressColor}`}
              style={{ width: `${sprint.progress_pct}%` }}
            />
          </div>
          <p className="text-right text-sm text-gray-600 mt-1">{sprint.progress_pct}%</p>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-500">TODO</p>
            <p className="font-semibold text-lg">{sprint.sprint_task_counts.TODO}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">IN PROGRESS</p>
            <p className="font-semibold text-lg">{sprint.sprint_task_counts.IN_PROGRESS}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">DONE</p>
            <p className="font-semibold text-lg text-green-600">{sprint.sprint_task_counts.COMPLETED}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
