import client from './client'

export const getSprints         = (projectId)           => client.get(`/projects/${projectId}/sprints/`)
export const createSprint       = (projectId, data)     => client.post(`/projects/${projectId}/sprints/`, data)
export const updateSprint       = (projectId, sid, data) => client.patch(`/projects/${projectId}/sprints/${sid}/`, data)
export const deleteSprint       = (projectId, sid)      => client.delete(`/projects/${projectId}/sprints/${sid}/`)
export const setSprintStatus    = (projectId, sid, status) => client.patch(`/projects/${projectId}/sprints/${sid}/status/`, { status })
export const getBacklog         = (projectId)           => client.get(`/projects/${projectId}/backlog/`)
export const assignTaskSprint   = (projectId, taskId, sprintId) =>
  client.patch(`/projects/${projectId}/tasks/${taskId}/`, { sprint_id: sprintId })
