'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { RhythmQuality } from '@/types'

interface UsePushupCounterOptions {
  active: boolean
  onRep: (count: number) => void
}

interface CounterState {
  count: number
  rhythmQuality: RhythmQuality
  sensorReady: boolean
}

const MIN_REP_INTERVAL_MS = 400

export function usePushupCounter({ active, onRep }: UsePushupCounterOptions) {
  const [state, setState] = useState<CounterState>({
    count: 0,
    rhythmQuality: 'idle',
    sensorReady: false,
  })

  const countRef = useRef(0)
  const lastRepTime = useRef(0)
  const repTimings = useRef<number[]>([])

  const addRep = useCallback(() => {
    const now = Date.now()
    if (now - lastRepTime.current < MIN_REP_INTERVAL_MS) return
    lastRepTime.current = now

    repTimings.current = [...repTimings.current.slice(-5), now]
    const quality = getQuality(repTimings.current)

    countRef.current += 1
    const newCount = countRef.current

    setState(s => ({ ...s, count: newCount, rhythmQuality: quality }))
    onRep(newCount)
  }, [onRep])

  const decrement = useCallback(() => {
    countRef.current = Math.max(0, countRef.current - 1)
    const newCount = countRef.current
    setState(s => ({ ...s, count: newCount, rhythmQuality: newCount === 0 ? 'idle' : s.rhythmQuality }))
    onRep(newCount)
  }, [onRep])

  const reset = useCallback(() => {
    countRef.current = 0
    lastRepTime.current = 0
    repTimings.current = []
    setState({ count: 0, rhythmQuality: 'idle', sensorReady: active })
  }, [active])

  useEffect(() => {
    setState(s => ({ ...s, sensorReady: active }))
  }, [active])

  return {
    count: state.count,
    rhythmQuality: state.rhythmQuality,
    sensorReady: state.sensorReady,
    addRep,
    decrement,
    reset,
  }
}

function getQuality(timings: number[]): RhythmQuality {
  if (timings.length < 2) return 'idle'
  const interval = timings[timings.length - 1] - timings[timings.length - 2]
  if (interval < 1200) return 'fast'
  if (interval < 2600) return 'good'
  return 'slow'
}
