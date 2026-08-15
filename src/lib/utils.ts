import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Level } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLevelFromScore(score: number): Level {
  if (score < 10) return 'beginner'
  if (score < 26) return 'intermediate'
  if (score < 51) return 'advanced'
  return 'elite'
}

export function getLevelLabel(level: Level): string {
  const labels: Record<Level, string> = {
    beginner:     'Débutant',
    intermediate: 'Intermédiaire',
    advanced:     'Avancé',
    elite:        'Élite',
  }
  return labels[level]
}

export function getLevelBadgeClass(level: Level): string {
  const classes: Record<Level, string> = {
    beginner:     'bg-emerald-100 text-emerald-700',
    intermediate: 'bg-blue-100 text-blue-700',
    advanced:     'bg-orange-100 text-orange-700',
    elite:        'bg-purple-100 text-purple-700',
  }
  return classes[level]
}

export function getLevelAccentColor(level: Level): string {
  const colors: Record<Level, string> = {
    beginner:     '#10b981',
    intermediate: '#3b82f6',
    advanced:     '#f97316',
    elite:        '#a855f7',
  }
  return colors[level]
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short',
  })
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function isToday(dateStr: string): boolean {
  return new Date(dateStr).toDateString() === new Date().toDateString()
}

export function isYesterday(dateStr: string): boolean {
  const y = new Date()
  y.setDate(y.getDate() - 1)
  return new Date(dateStr).toDateString() === y.toDateString()
}

export function daysBetween(d1: string, d2: string): number {
  return Math.abs(
    Math.floor((new Date(d2).getTime() - new Date(d1).getTime()) / 86_400_000)
  )
}

export function progressToGoal(total: number, goal = 100): number {
  return Math.min(Math.round((total / goal) * 100), 100)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Moteur de badges générique : retourne les ids nouvellement débloqués
 * parmi `conditions`, en excluant ceux déjà présents dans `earned`.
 * Partagé par Pompes et Gainage — chaque module garde ses propres ids et
 * seuils, seul le mécanisme de sélection est mutualisé.
 */
export function pickNewlyUnlocked(earned: string[], conditions: Record<string, boolean>): string[] {
  const earnedSet = new Set(earned)
  return Object.entries(conditions)
    .filter(([id, met]) => met && !earnedSet.has(id))
    .map(([id]) => id)
}
