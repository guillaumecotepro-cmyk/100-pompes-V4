import { GainageData } from '@/types/plank'
import { DEFAULT_PLANK_SETTINGS } from './config'

export const DEFAULT_GAINAGE_DATA: GainageData = {
  onboarded: false,
  settings: { ...DEFAULT_PLANK_SETTINGS },
  tests: [],
  programs: [],
  activeProgramId: null,
  sessions: [],
  earnedBadges: [],
  draftSession: null,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Migration rétrocompatible du bloc `gainage`. Toute donnée absente ou
 * corrompue retombe sur les valeurs par défaut, sans jamais lever d'erreur
 * ni affecter le reste de AppData (Pompes).
 */
export function migrateGainageData(raw: unknown): GainageData {
  const source = isRecord(raw) ? raw : {}
  const settingsSource = isRecord(source.settings) ? source.settings : {}

  return {
    onboarded: source.onboarded === true,
    settings: {
      voiceEnabled: settingsSource.voiceEnabled !== false,
      beepEnabled: settingsSource.beepEnabled !== false,
      gongEnabled: settingsSource.gongEnabled !== false,
      vibrationEnabled: settingsSource.vibrationEnabled !== false,
      restSeconds: typeof settingsSource.restSeconds === 'number' ? settingsSource.restSeconds : DEFAULT_PLANK_SETTINGS.restSeconds,
    },
    tests: Array.isArray(source.tests) ? (source.tests as GainageData['tests']) : [],
    programs: Array.isArray(source.programs) ? (source.programs as GainageData['programs']) : [],
    activeProgramId: typeof source.activeProgramId === 'string' ? source.activeProgramId : null,
    sessions: Array.isArray(source.sessions) ? (source.sessions as GainageData['sessions']) : [],
    earnedBadges: Array.isArray(source.earnedBadges) ? (source.earnedBadges as string[]) : [],
    draftSession: isRecord(source.draftSession) ? (source.draftSession as unknown as GainageData['draftSession']) : null,
  }
}
