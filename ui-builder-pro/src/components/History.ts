
import { useCallback, useEffect, useRef, useState } from 'react'

export function useHistory<T>(initial: T) {
  const [present, setPresent] = useState<T>(initial)
  const pastRef = useRef<T[]>([])
  const futureRef = useRef<T[]>([])
  const lockRef = useRef(false)

  const commit = useCallback((next: T) => {
    if (lockRef.current) return
    pastRef.current.push(present)
    futureRef.current = []
    setPresent(next)
  }, [present])

  const undo = useCallback(() => {
    const last = pastRef.current.pop()
    if (last === undefined) return
    futureRef.current.push(present)
    lockRef.current = true
    setPresent(last)
    lockRef.current = false
  }, [present])

  const redo = useCallback(() => {
    const next = futureRef.current.pop()
    if (next === undefined) return
    pastRef.current.push(present)
    lockRef.current = true
    setPresent(next)
    lockRef.current = false
  }, [present])

  const canUndo = pastRef.current.length > 0
  const canRedo = futureRef.current.length > 0

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const z = (e.key.toLowerCase() === 'z')
      const y = (e.key.toLowerCase() === 'y')
      if ((e.ctrlKey || e.metaKey) && z) { e.preventDefault(); undo() }
      if ((e.ctrlKey || e.metaKey) && y) { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])

  return { present, setPresent, commit, undo, redo, canUndo, canRedo }
}
