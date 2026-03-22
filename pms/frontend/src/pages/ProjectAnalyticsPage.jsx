import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, Loader } from 'lucide-react';
import { getAnalytics } from '../api/analytics';

const PRIORITY_COLORS = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#EF4444',
};

export default function ProjectAnalyticsPage() {
  const { id } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const res = await getAnalytics(id);
        setAnalytics(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">Error loading analytics: {error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  const taskStatusData = [
    { name: 'To Do', value: analytics.task_counts.TODO },
    { name: 'In Progress', value: analytics.task_counts.IN_PROGRESS },
    { name: 'Completed', value: analytics.task_counts.COMPLETED },
  ];

  const priorityData = [
    { name: 'Low', value: analytics.tasks_by_priority.LOW },
    { name: 'Medium', value: analytics.tasks_by_priority.MEDIUM },
    { name: 'High', value: analytics.tasks_by_priority.HIGH },
  ].filter(item => item.value > 0);

  const memberData = analytics.tasks_by_member || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Project Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm mb-2">Total Tasks</p>
          <p className="text-4xl font-bold">
            {analytics.task_counts.TODO + analytics.task_counts.IN_PROGRESS + analytics.task_counts.COMPLETED}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm mb-2">Completed</p>
          <p className="text-4xl font-bold text-green-600">{analytics.task_counts.COMPLETED}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 text-sm mb-2">Overdue</p>
          <p className="text-4xl font-bold text-red-600">{analytics.overdue_count}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Task Status Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={taskStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Priority Distribution</h2>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  <Cell fill={PRIORITY_COLORS.LOW} />
                  <Cell fill={PRIORITY_COLORS.MEDIUM} />
                  <Cell fill={PRIORITY_COLORS.HIGH} />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No priority data</p>
          )}
        </div>
      </div>

      {memberData.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Member Workload</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={memberData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="username" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="TODO" stackId="a" fill="#6B7280" />
              <Bar dataKey="IN_PROGRESS" stackId="a" fill="#3B82F6" />
              <Bar dataKey="COMPLETED" stackId="a" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {analytics.active_sprint && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Active Sprint: {analytics.active_sprint.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Sprint Progress</p>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-green-500"
                  style={{ width: `${analytics.active_sprint.progress_pct}%` }}
                />
              </div>
              <p className="text-right text-sm text-gray-600 mt-1">
                {analytics.active_sprint.completed_count} / {analytics.active_sprint.task_count}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Days Remaining</p>
              <p className="text-3xl font-bold">{analytics.active_sprint.days_remaining}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Start Date</p>
              <p className="text-lg font-medium">{new Date(analytics.active_sprint.start_date).toLocaleDateString()}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">End Date</p>
              <p className="text-lg font-medium">{new Date(analytics.active_sprint.end_date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
