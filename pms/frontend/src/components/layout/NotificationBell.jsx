import { useState, useEffect, useRef } from 'react'
import { Bell, X } from 'lucide-react'
import { getNotifications, markNotificationsRead } from '../../api/notifications'

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await getNotifications()
        setNotifications(res.data || [])
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const handleBellClick = async () => {
    if (!open) {
      try {
        await markNotificationsRead()
      } catch (error) {
        console.error('Failed to mark notifications as read:', error)
      }
    }
    setOpen(!open)
  }

  const unreadCount = notifications.length
  const displayCount = unreadCount > 9 ? '9+' : unreadCount

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {displayCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg z-50 border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <p className="font-semibold text-gray-900">Notifications</p>
          </div>

          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No notifications</div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notif, idx) => (
                <div key={idx} className="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <p className="text-sm font-medium text-gray-900">
                    {notif.user?.username || 'User'} {notif.action?.replace(/_/g, ' ').toLowerCase() || 'did something'}
                  </p>
                  {notif.detail && (
                    <p className="text-sm text-gray-600 mt-1">{notif.detail}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{timeAgo(notif.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
