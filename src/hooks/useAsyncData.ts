import { useCallback, useEffect, useState } from 'react'

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: T }

type Settled<T> = {
  load: () => Promise<T>
  attempt: number
  state: AsyncState<T>
}

// Loads data on mount and whenever `load` changes; `reload` retries.
export function useAsyncData<T>(load: () => Promise<T>) {
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<Settled<T> | null>(null)

  useEffect(() => {
    let active = true
    const settle = (state: AsyncState<T>) =>
      active && setSettled({ load, attempt, state })
    load().then(
      (data) => settle({ status: 'ready', data }),
      () => settle({ status: 'error' }),
    )
    return () => {
      active = false
    }
  }, [load, attempt])

  const reload = useCallback(() => setAttempt((value) => value + 1), [])
  // A result from a previous loader or attempt means a new load is running.
  const state: AsyncState<T> =
    settled && settled.load === load && settled.attempt === attempt
      ? settled.state
      : { status: 'loading' }
  return { state, reload }
}