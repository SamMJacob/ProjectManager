import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as apiRegister } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'

export default function RegisterPage() {
  const [form, setForm]       = useState({ username: '', email: '', password: '', password_confirm: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiRegister(form)
      login(res.data)
      navigate('/dashboard')
    } catch (err) {
      const errors = err.response?.data
      const msg = typeof errors === 'object'
        ? Object.values(errors).flat().join(' ')
        : 'Registration failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const f = (key, label, type = 'text') => (
    <input type={type} placeholder={label}
      className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required />
  )

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {f('username', 'Username')}
          {f('email', 'Email', 'email')}
          {f('password', 'Password', 'password')}
          {f('password_confirm', 'Confirm Password', 'password')}
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Have an account? <Link to="/login" className="text-blue-600">Log In</Link>
        </p>
      </div>
    </div>
  )
}
