import { router } from '#/main'
import axios from 'axios'

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  withCredentials: true,
})

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  async function (error) {
    const originalRequest = error.config
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true // Mark the request as retired to avoid infinite loop
      try {
        await api.post('/refresh-access-token')

        return api(originalRequest) // Retry the original request
      } catch (refreshError) {
        // Use router.navigate to change routes cleanly
        router.navigate({ to: '/sign-in' })
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  },
)
