import client from './client'

export const getComments   = (projectId, taskId)        => client.get(`/projects/${projectId}/tasks/${taskId}/comments/`)
export const postComment   = (projectId, taskId, body)  => client.post(`/projects/${projectId}/tasks/${taskId}/comments/`, { body })
export const deleteComment = (projectId, taskId, cid)   => client.delete(`/projects/${projectId}/tasks/${taskId}/comments/${cid}/`)
