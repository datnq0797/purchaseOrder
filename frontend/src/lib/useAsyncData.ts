import { useCallback, useEffect, useState } from 'react'

interface AsyncState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  reload: () => void
}

/** Runs `fetcher` on mount and whenever `deps` change, tracking loading/error state. */
export function useAsyncData<T>(fetcher: () => Promise<T>, deps: React.DependencyList = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadTick, setReloadTick] = useState(0)

  const load = useCallback(() => {
    setIsLoading(true)
    setError(null)
    fetcher()
      .then((result) => setData(result))
      .catch(() => setError('Không thể tải dữ liệu. Vui lòng thử lại.'))
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadTick])

  return { data, isLoading, error, reload: () => setReloadTick((t) => t + 1) }
}
