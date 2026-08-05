import { queryClient, router } from '#/main'
import axios from 'axios'

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  withCredentials: true,
})

// Define your public paths here
const PUBLIC_ROUTES = [
  '/sign-in',
  '/sign-up',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
]

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  async function (error) {
    const originalRequest = error.config
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true // Mark the request as retired to avoid infinite loop

      // Break the loop if the refresh call itself failed with a 401
      if (originalRequest.url?.includes('/refresh-access-token')) {
        return Promise.reject(error)
      }

      try {
        await api.post('/refresh-access-token')

        return api(originalRequest) // Retry the original request
      } catch (refreshError) {
        // Use router.navigate to change routes cleanly
        const currentPath = window.location.pathname
        const isPublicRoute = PUBLIC_ROUTES.some(
          (route) =>
            currentPath === route || currentPath.startsWith(route + '/'),
        )

        if (!isPublicRoute) {
          // remove the query data for 'me' to prevent the loop
          queryClient.setQueryData(['me'], null)
          router.navigate({ to: '/sign-in' })
        }
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  },
)
