import { useEffect, useState } from 'react'
import { fetchContent, type Content } from '@/lib/content'

type ContentState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: Content }

export function useContent(): ContentState {
  const [state, setState] = useState<ContentState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    fetchContent()
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Failed to load content',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
