import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from './components/ui/sonner'
import { useAuth } from './context/auth/auth-hook'
import { AuthContextProvider } from './context/auth/auth-provider'
import { WebsocketProvider } from './context/websocket/websocket-provider'

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  context: {
    auth: undefined!,
  },
})

function App() {
  const auth = useAuth()

  return <RouterProvider router={router} context={{ auth }} />
}

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')!

export const queryClient = new QueryClient()

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)

  root.render(
    <QueryClientProvider client={queryClient}>
      <AuthContextProvider>
        <WebsocketProvider>
          <Toaster position="top-right" />
          <App />
        </WebsocketProvider>
      </AuthContextProvider>
    </QueryClientProvider>,
  )
}
