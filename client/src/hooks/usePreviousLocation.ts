import { useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

// Custom hook to get the last URL location on which user was
function usePreviousLocation() {
  const router = useRouter()
  const [previousLocation, setPreviousLocation] = useState<string>('/')

  useEffect(() => {
    return router.subscribe('onResolved', ({ fromLocation }) => {
      setPreviousLocation(fromLocation?.href ?? '/')
    })
  }, [])

  return previousLocation || '/'
}

export default usePreviousLocation
