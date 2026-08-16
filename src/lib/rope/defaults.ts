import { JumpRopeData, JumpProgramId } from '@/types/rope'
import { DEFAULT_JUMPROPE_SETTINGS } from './config'

const PROGRAM_IDS: JumpProgramId[] = ['first-steps', 'burn-sculpt', 'iron-lungs', 'afterburn']

export const DEFAULT_JUMPROPE_DATA: JumpRopeData = {
  onboarded: false,
  profile: null,
  settings: { ...DEFAULT_JUMPROPE_SETTINGS },
  sessions: [],
  programProgress: { 'first-steps': null, 'burn-sculpt': null, 'iron-lungs': null, afterburn: null },
  activeProgramId: null,
  challenge7: { startDate: null, completedDays: [], status: 'not_started' },
  dailyChallenge: { enabled: false, targetJumps: null, targetDurationSeconds: null },
  earnedBadges: [],
  clips: [],
  deviceConnections: [
    { type: 'motion_sensor', supported: false, connected: false, lastSeenAt: null },
    { type: 'bluetooth_rope', supported: false, connected: false, lastSeenAt: null },
    { type: 'headphones', supported: false, connected: false, lastSeenAt: null },
    { type: 'watch', supported: false, connected: false, lastSeenAt: null },
  ],
  healthSync: { appleHealthAvailable: false, healthConnectAvailable: false, enabled: false, lastSyncedAt: null },
  leaderboard: { optedIn: false, pseudonym: null, country: null },
  draftSession: null,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Migration rétrocompatible du bloc `jumprope`. Toute donnée absente ou
 * corrompue retombe sur les valeurs par défaut, sans jamais lever
 * d'erreur ni affecter le reste de AppData (Pompes/Gainage).
 */
export function migrateJumpRopeData(raw: unknown): JumpRopeData {
  const source = isRecord(raw) ? raw : {}
  const settingsSource = isRecord(source.settings) ? source.settings : {}

  const programProgress: JumpRopeData['programProgress'] = { ...DEFAULT_JUMPROPE_DATA.programProgress }
  if (isRecord(source.programProgress)) {
    for (const id of PROGRAM_IDS) {
      const p = source.programProgress[id]
      programProgress[id] = isRecord(p) ? (p as unknown as JumpRopeData['programProgress'][JumpProgramId]) : null
    }
  }

  const challenge7Source = isRecord(source.challenge7) ? source.challenge7 : {}
  const dailySource = isRecord(source.dailyChallenge) ? source.dailyChallenge : {}
  const healthSource = isRecord(source.healthSync) ? source.healthSync : {}
  const leaderboardSource = isRecord(source.leaderboard) ? source.leaderboard : {}

  return {
    onboarded: source.onboarded === true,
    profile: isRecord(source.profile) ? (source.profile as unknown as JumpRopeData['profile']) : null,
    settings: {
      voiceEnabled: settingsSource.voiceEnabled !== false,
      beepEnabled: settingsSource.beepEnabled !== false,
      gongEnabled: settingsSource.gongEnabled !== false,
      vibrationEnabled: settingsSource.vibrationEnabled !== false,
      announceEveryNJumps: [0, 10, 25, 50, 100].includes(settingsSource.announceEveryNJumps as number)
        ? (settingsSource.announceEveryNJumps as 0 | 10 | 25 | 50 | 100)
        : DEFAULT_JUMPROPE_SETTINGS.announceEveryNJumps,
      announceHalfway: settingsSource.announceHalfway !== false,
      preferredCountingMethod: ['camera', 'motion', 'manual', 'bluetooth'].includes(settingsSource.preferredCountingMethod as string)
        ? (settingsSource.preferredCountingMethod as JumpRopeData['settings']['preferredCountingMethod'])
        : DEFAULT_JUMPROPE_SETTINGS.preferredCountingMethod,
      recordVideoByDefault: settingsSource.recordVideoByDefault === true,
      restSeconds: typeof settingsSource.restSeconds === 'number' ? settingsSource.restSeconds : DEFAULT_JUMPROPE_SETTINGS.restSeconds,
    },
    sessions: Array.isArray(source.sessions) ? (source.sessions as unknown as JumpRopeData['sessions']) : [],
    programProgress,
    activeProgramId: typeof source.activeProgramId === 'string' ? (source.activeProgramId as JumpProgramId) : null,
    challenge7: {
      startDate: typeof challenge7Source.startDate === 'string' ? challenge7Source.startDate : null,
      completedDays: Array.isArray(challenge7Source.completedDays) ? challenge7Source.completedDays.filter((d): d is number => typeof d === 'number') : [],
      status: ['not_started', 'active', 'completed'].includes(challenge7Source.status as string)
        ? (challenge7Source.status as JumpRopeData['challenge7']['status'])
        : 'not_started',
    },
    dailyChallenge: {
      enabled: dailySource.enabled === true,
      targetJumps: typeof dailySource.targetJumps === 'number' ? dailySource.targetJumps : null,
      targetDurationSeconds: typeof dailySource.targetDurationSeconds === 'number' ? dailySource.targetDurationSeconds : null,
    },
    earnedBadges: Array.isArray(source.earnedBadges) ? (source.earnedBadges as string[]) : [],
    clips: Array.isArray(source.clips) ? (source.clips as unknown as JumpRopeData['clips']) : [],
    deviceConnections: Array.isArray(source.deviceConnections) && source.deviceConnections.length > 0
      ? (source.deviceConnections as unknown as JumpRopeData['deviceConnections'])
      : DEFAULT_JUMPROPE_DATA.deviceConnections,
    healthSync: {
      appleHealthAvailable: healthSource.appleHealthAvailable === true,
      healthConnectAvailable: healthSource.healthConnectAvailable === true,
      enabled: healthSource.enabled === true,
      lastSyncedAt: typeof healthSource.lastSyncedAt === 'string' ? healthSource.lastSyncedAt : null,
    },
    leaderboard: {
      optedIn: leaderboardSource.optedIn === true,
      pseudonym: typeof leaderboardSource.pseudonym === 'string' ? leaderboardSource.pseudonym : null,
      country: typeof leaderboardSource.country === 'string' ? leaderboardSource.country : null,
    },
    draftSession: isRecord(source.draftSession) ? (source.draftSession as unknown as JumpRopeData['draftSession']) : null,
  }
}
