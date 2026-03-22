import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getMembers, removeMember, updateMember, inviteUser, addMember, getProject } from '../api/projects'
import { searchUsers } from '../api/users'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/layout/Navbar'
import { toast } from 'sonner'

export default function ManagePeoplePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [members, setMembers]   = useState([])
  const [project, setProject]   = useState(null)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteUsername, setInviteUsername] = useState('')
  const [searchQ, setSearchQ]   = useState('')
  const [results, setResults]   = useState([])

  useEffect(() => {
    getMembers(id).then((r) => setMembers(r.data))
    getProject(id).then((r) => setProject(r.data))
  }, [id])

  useEffect(() => {
    if (searchQ.length >= 2) searchUsers(searchQ).then((r) => setResults(r.data))
    else setResults([])
  }, [searchQ])

  const isAdmin = project?.is_admin

  const handleRemove = async (uid) => {
    if (!confirm('Remove this member?')) return
    try {
      await removeMember(id, uid)
      setMembers((p) => p.filter((m) => m.user_id !== uid))
      toast.success('Member removed')
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const handleToggleAdmin = async (m) => {
    try {
      const res = await updateMember(id, m.user_id, { is_admin: !m.is_admin })
      setMembers((p) => p.map((x) => x.user_id === m.user_id ? { ...x, is_admin: res.data.is_admin } : x))
      toast.success(`${m.username} is now ${res.data.is_admin ? 'an admin' : 'a member'}`)
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    try {
      await inviteUser(id, { username: inviteUsername })
      toast.success(`Invitation sent to ${inviteUsername}`)
      setInviteUsername(''); setShowInvite(false)
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const handleAddDirect = async (username) => {
    try {
      const res = await addMember(id, { username })
      setMembers((p) => [...p, res.data])
      setSearchQ(''); setResults([])
      toast.success(`${username} added`)
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">{project?.name} — Members</h1>
            <Link to={`/projects/${id}/board`} className="text-sm text-blue-600 hover:underline">← Board</Link>
          </div>
          {isAdmin && (
            <button onClick={() => setShowInvite(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Invite via Email
            </button>
          )}
        </div>

        {isAdmin && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4 relative">
            <p className="text-sm font-medium text-gray-700 mb-2">Add existing user directly</p>
            <input className="border rounded-lg px-3 py-2 w-full" placeholder="Search username…"
              value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
            {results.length > 0 && (
              <ul className="absolute z-10 bg-white border rounded-lg shadow-md mt-1 w-[calc(100%-3rem)] left-6">
                {results.map((u) => (
                  <li key={u.id} onClick={() => handleAddDirect(u.username)}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                    {u.username} <span className="text-gray-400">({u.email})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>{['Username','Email','Role','Status', ...(isAdmin ? ['Actions'] : [])].map((h) =>
                <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => (
                <tr key={m.user_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {m.username} {m.user_id === user?.id && <span className="text-xs text-gray-400">(you)</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{m.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${m.is_admin ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {m.is_admin ? 'Admin' : 'Member'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{m.is_accepted ? 'Active' : 'Pending'}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      {m.user_id !== user?.id && (<>
                        <button onClick={() => handleToggleAdmin(m)} className="text-blue-500 hover:text-blue-700 mr-3 text-xs">
                          {m.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button onClick={() => handleRemove(m.user_id)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                      </>)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showInvite && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold mb-4">Invite via Email</h2>
            <form onSubmit={handleInvite} className="flex flex-col gap-3">
              <input className="border rounded-lg px-3 py-2" placeholder="Username"
                value={inviteUsername} onChange={(e) => setInviteUsername(e.target.value)} required />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowInvite(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Send Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
