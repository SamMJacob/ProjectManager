import client from './client'
export const getTasks        = (pid)           => client.get(`/projects/${pid}/tasks/`)
export const createTask      = (pid, data)     => client.post(`/projects/${pid}/tasks/`, data)
export const getTask         = (pid, tid)      => client.get(`/projects/${pid}/tasks/${tid}/`)
export const updateTask      = (pid, tid, d)   => client.patch(`/projects/${pid}/tasks/${tid}/`, d)
export const deleteTask      = (pid, tid)      => client.delete(`/projects/${pid}/tasks/${tid}/`)
export const updateTaskStatus = (pid, tid, s)  =>
  client.patch(`/projects/${pid}/tasks/${tid}/status/`, { status: s })
