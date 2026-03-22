import axios from 'axios'

const client = axios.create({ baseURL: '/api', withCredentials: true })

let isRefreshing = false

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    // Skip refresh for requests that opt out (e.g. the initial auth check)
    if (original._skipRefresh) return Promise.reject(error)

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) return Promise.reject(error)
      original._retry = true
      isRefreshing = true
      try {
        await client.post('/auth/token/refresh/', {}, { _skipRefresh: true })
        isRefreshing = false
        return client(original)
      } catch {
        isRefreshing = false
        const path = window.location.pathname
        if (!path.startsWith('/login') && !path.startsWith('/register') && path !== '/') {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  },
)

export default client
