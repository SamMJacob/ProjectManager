import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects, createProject } from '../api/projects'
import Navbar from '../components/layout/Navbar'
import { toast } from 'sonner'

export default function ProjectSelectionPage() {
  const [projects, setProjects]   = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState({ name: '', description: '' })
  const navigate = useNavigate()

  useEffect(() => { getProjects().then((res) => setProjects(res.data)) }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const res = await createProject(form)
      setProjects((p) => [...p, res.data])
      setShowModal(false)
      setForm({ name: '', description: '' })
      toast.success('Project created')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create project')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Your Projects</h1>
          <button onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + New Project
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p.id} onClick={() => navigate(`/projects/${p.id}/board`)}
              className="bg-white rounded-xl shadow-sm p-5 cursor-pointer hover:shadow-md transition">
              <h2 className="font-semibold text-gray-800 text-lg">{p.name}</h2>
              {p.description && <p className="text-gray-500 text-sm mt-1 line-clamp-2">{p.description}</p>}
              {p.is_admin && (
                <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  Admin
                </span>
              )}
            </div>
          ))}
          {projects.length === 0 && (
            <p className="text-gray-400 col-span-3 text-center py-10">No projects yet. Create one!</p>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold mb-4">New Project</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <input className="border rounded-lg px-3 py-2" placeholder="Project name"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <textarea className="border rounded-lg px-3 py-2" placeholder="Description (optional)" rows={3}
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
