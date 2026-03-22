import client from './client.js';

export const getAnalytics       = (projectId) => client.get(`/projects/${projectId}/analytics/`)
export const getProjectActivity = (projectId) => client.get(`/projects/${projectId}/activity/`)
export const getGlobalActivity  = ()          => client.get('/activity/')
