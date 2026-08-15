'use client'
import { useState, useEffect, useCallback } from 'react'

interface UseLocalStorageOptions<T> {
  backupKey?: string
  fallbackKeys?: string[]
  migrate?: (stored: unknown) => T
  prepareForSave?: (value: T) => T
}

function readFromStorage<T>(
  key: string,
  fallbackKeys: string[],
  backupKey: string | undefined,
  migrate: ((v: unknown) => T) | undefined,
  prepareForSave: ((v: T) => T) | undefined,
  initialValue: T,
): T {
  const keys = [key, ...fallbackKeys, backupKey].filter(Boolean) as string[]
  for (const storageKey of keys) {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored === null) continue
      const parsed = JSON.parse(stored)
      const next = migrate ? migrate(parsed) : parsed as T
      if (storageKey !== key) {
        localStorage.setItem(key, JSON.stringify(prepareForSave ? prepareForSave(next) : next))
      }
      return next
    } catch { /* try next key */ }
  }
  return initialValue
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
) {
  const { backupKey, fallbackKeys = [], migrate, prepareForSave } = options
  const fallbackKeysId = fallbackKeys.join('\0')

  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      return readFromStorage(key, fallbackKeys, backupKey, migrate, prepareForSave, initialValue)
    } catch {
      return initialValue
    }
  })
  // Toujours false au premier rendu, même côté client : le premier rendu client
  // (hydratation) doit produire exactement le même arbre que le serveur, sinon
  // React détecte un mismatch. Le flip à true se fait dans l'effet ci-dessous,
  // qui ne s'exécute qu'après que le DOM hydraté correspond au HTML serveur.
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (hydrated) return
    try {
      const next = readFromStorage(key, fallbackKeys, backupKey, migrate, prepareForSave, initialValue)
      setValue(next)
    } catch { /* ignore */ }
    setHydrated(true)
  }, [key, backupKey, fallbackKeysId, migrate, prepareForSave, hydrated, initialValue])

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
