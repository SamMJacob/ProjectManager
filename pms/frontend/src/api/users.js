import client from './client'
export const searchUsers = (q) => client.get(`/users/?q=${encodeURIComponent(q)}`)
