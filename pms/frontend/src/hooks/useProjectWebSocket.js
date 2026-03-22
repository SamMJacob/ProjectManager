import { useEffect, useRef } from 'react'

export function useProjectWebSocket(projectId, handlers) {
  const wsRef       = useRef(null)
  const handlersRef = useRef(handlers)
  const retryDelay  = useRef(1000)
  const retryTimer  = useRef(null)
  handlersRef.current = handlers

  useEffect(() => {
    if (!projectId) return

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = import.meta.env.VITE_BACKEND_HOST || window.location.host
      const ws = new WebSocket(`${protocol}//${host}/ws/board/${projectId}/`)
      wsRef.current = ws

      ws.onopen = () => { retryDelay.current = 1000 }

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data)
        switch (data.type) {
          case 'task_status_changed': handlersRef.current.onTaskStatusChanged?.(data); break
          case 'task_created':        handlersRef.current.onTaskCreated?.(data);       break
          case 'task_updated':        handlersRef.current.onTaskUpdated?.(data);       break
          case 'task_deleted':        handlersRef.current.onTaskDeleted?.(data);       break
          case 'comment_added':       handlersRef.current.onCommentAdded?.(data);      break
        }
      }

      ws.onerror = (e) => { console.error('WebSocket error:', e) }
      ws.onclose = (e) => {
        if (e.code !== 1000) {
          retryTimer.current = setTimeout(connect, retryDelay.current)
          retryDelay.current = Math.min(retryDelay.current * 2, 30000)
        }
      }
    }

    connect()
    return () => {
      clearTimeout(retryTimer.current)
      wsRef.current?.close(1000)
    }
  }, [projectId])
}
