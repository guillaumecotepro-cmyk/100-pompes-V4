import { AppData } from '@/types'
import { formatPlankGoal } from './plank/format'

interface ExportRow {
  date: string
  activite: 'Pompes' | 'Gainage'
  type: string
  detail: string
  statut: string
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

/**
 * Construit un export CSV unique combinant tout l'historique Pompes et
 * Gainage (séances de programme, séances libres, tests, performances max).
 * Fonction pure — testable sans DOM ni navigateur.
 */
export function buildExportCsv(data: AppData): string {
  const rows: ExportRow[] = []

  for (const h of data.history) {
    rows.push({
      date: h.date,
      activite: 'Pompes',
      type: `Programme — Semaine ${h.week} Jour ${h.day}`,
      detail: `${h.totalReps}/${h.targetReps} pompes`,
      statut: h.completed ? 'Terminée' : 'Incomplète',
    })
  }

  for (const m of data.maxHistory) {
    rows.push({
      date: m.date,
      activite: 'Pompes',
      type: 'Performance Max',
      detail: `${m.reps} pompes`,
      statut: 'Terminée',
    })
  }

  for (const t of data.gainage.tests) {
    rows.push({
      date: t.date,
      activite: 'Gainage',
      type: 'Test initial',
      detail: formatPlankGoal(t.durationSeconds),
      statut: 'Terminé',
    })
  }

  for (const s of data.gainage.sessions) {
    rows.push({
      date: s.date,
      activite: 'Gainage',
      type: s.mode === 'program' ? 'Programme' : 'Libre',
      detail: `${formatPlankGoal(s.totalHoldSeconds)} de maintien (${s.sets.length} série${s.sets.length > 1 ? 's' : ''})`,
      statut: s.status === 'completed' ? 'Terminée' : s.status === 'interrupted' ? 'Interrompue' : 'Annulée',
    })
  }

  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const header = ['Date', 'Activité', 'Type', 'Détail', 'Statut']
  const lines = [header, ...rows.map(r => [
    new Date(r.date).toLocaleString('fr-FR'),
    r.activite,
    r.type,
    r.detail,
    r.statut,
  ])]

  return lines.map(cols => cols.map(csvEscape).join(',')).join('\n')
}

/** Déclenche le téléchargement du CSV dans le navigateur. */
export function downloadExportCsv(data: AppData): void {
  if (typeof window === 'undefined') return
  const csv = buildExportCsv(data)
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `100-pompes-export-${date}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
