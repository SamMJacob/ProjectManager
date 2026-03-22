import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 gap-6">
      <h1 className="text-4xl font-bold text-gray-800">Project Management System</h1>
      <p className="text-gray-500 text-lg">Organise your work with Kanban boards</p>
      <div className="flex gap-4">
        <Link to="/login"    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Log In</Link>
        <Link to="/register" className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">Register</Link>
      </div>
    </div>
  )
}
