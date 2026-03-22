import client from './client'

export const getNotifications      = () => client.get('/notifications/')
export const markNotificationsRead = () => client.post('/notifications/')
