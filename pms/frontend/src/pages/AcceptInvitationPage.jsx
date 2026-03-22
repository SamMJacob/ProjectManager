import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { acceptInvitation } from '../api/projects'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'

export default function AcceptInvitationPage() {
  const { invitationId } = useParams()
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) {
      navigate(`/login?next=/invitations/${invitationId}/accept`, { replace: true })
      return
    }
    acceptInvitation(invitationId)
      .then((res) => {
        toast.success(`Joined "${res.data.project_name}"`)
        navigate(`/projects/${res.data.project_id}/board`, { replace: true })
      })
      .catch((err) => {
        setFailed(true)
        toast.error(err.response?.data?.error || 'Failed to accept invitation')
      })
  }, [loading, user])

  if (failed) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <p className="text-red-600 font-medium mb-4">Invalid or expired invitation.</p>
        <button onClick={() => navigate('/projects')} className="text-blue-600 hover:underline">
          Go to Projects
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )
}
