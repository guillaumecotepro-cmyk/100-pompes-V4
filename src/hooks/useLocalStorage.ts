'use client'
import { useState, useEffect, useCallback } from 'react'

interface UseLocalStorageOptions<T> {
  backupKey?: string
  fallbackKeys?: string[]
  migrate?: (stored: unknown) => T
  prepareForSave?: (value: T) => T
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
) {
  const { backupKey, fallbackKeys = [], migrate, prepareForSave } = options
  const fallbackKeysId = fallbackKeys.join('\0')
  const [value, setValue] = useState<T>(initialValue)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const keys = [key, ...fallbackKeys, backupKey].filter(Boolean) as string[]
    try {
      for (const storageKey of keys) {
        const stored = localStorage.getItem(storageKey)
        if (stored === null) continue

        try {
          const parsed = JSON.parse(stored)
          const next = migrate ? migrate(parsed) : parsed as T
          setValue(next)
          localStorage.setItem(key, JSON.stringify(prepareForSave ? prepareForSave(next) : next))
          break
        } catch {
          // Try the next source, usually the automatic backup.
        }
      }
    } catch {/* ignore */}
    setHydrated(true)
  }, [key, backupKey, fallbackKeysId, migrate, prepareForSave])

  const set = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(prev => {
      const next = typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(prev)
        : newValue
      const prepared = prepareForSave ? prepareForSave(next) : next
      try {
        const current = localStorage.getItem(key)
        if (current && backupKey) localStorage.setItem(backupKey, current)
        localStorage.setItem(key, JSON.stringify(prepared))
      } catch {/* ignore */}
      return prepared
    })
  }, [key, backupKey, prepareForSave])

  return [value, set, hydrated] as const
}
