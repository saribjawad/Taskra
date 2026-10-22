import { queryClient, router } from '#/main'
import axios from 'axios'
import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'

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
  '/invite',
]

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

let isRefreshing = false
let isRedirectingAfterWorkspaceRemoval = false

export const resetWorkspaceRemovalRedirect = () => {
  isRedirectingAfterWorkspaceRemoval = false
}

let reqQueue: {
  resolve: (value: AxiosResponse | PromiseLike<AxiosResponse>) => void
  reject: (reason?: unknown) => void
  request: RetriableRequestConfig
}[] = []

const processQueue = (error?: unknown) => {
  reqQueue.forEach(({ resolve, reject, request }) => {
    if (error) {
      reject(error)
      return
    }

    resolve(api(request))
  })

  reqQueue = []
}

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  async function (error: AxiosError) {
    const originalRequest = error.config as RetriableRequestConfig | undefined

    const isRemovedFromWorkspace = error.response?.status === 403

    if (isRemovedFromWorkspace && !isRedirectingAfterWorkspaceRemoval) {
      isRedirectingAfterWorkspaceRemoval = true
      await queryClient.cancelQueries()
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== 'me',
      })

      if (window.location.pathname !== '/workspace-removed') {
        await router.navigate({ to: '/workspace-removed', replace: true })
      }

      return Promise.reject(error)
    }

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      // Break the loop if the refresh call itself failed with a 401
      if (originalRequest.url?.includes('/refresh-access-token')) {
        return Promise.reject(error)
      }

      originalRequest._retry = true // Mark the request as retired to avoid infinite loop

      if (isRefreshing) {
        return new Promise<AxiosResponse>((resolve, reject) => {
          reqQueue.push({
            resolve,
            reject,
            request: originalRequest,
          })
        })
      }

      isRefreshing = true
      try {
        await api.post('/refresh-access-token')

        processQueue()
        return api(originalRequest) // Retry the original request
      } catch (refreshError) {
        processQueue(refreshError)

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
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  },
)
