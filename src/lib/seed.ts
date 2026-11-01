import { ALL_DAYS, addDays, startOfDay, toKey } from './dates'
import { BADGES, isUnlocked, summarize } from './gamification'
import { isScheduled } from './stats'
import type { AppState, Habit, QuitLog } from './types'

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const emptyState = (): AppState => ({ version: 5, habits: [], done: {}, quit: {}, seenBadges: [] })

/** How the example bad habits are valued; also applied when older saved data is upgraded. */
export const SEED_SAVINGS: Record<string, Partial<Habit>> = {
  'q-smoke': { saveMode: 'both', costMoney: 9, costMinutes: 40, hourValue: 30 },
  'q-scroll': { saveMode: 'time', costMinutes: 60, hourValue: 30, hourFactor: 10, factorLabel: 'Lernen' },
}

/** Example bad habits with a few relapses, so the clean clocks and calendars show something. */
export function seedQuit(): { habits: Habit[]; quit: Record<string, QuitLog> } {
  const now = new Date()
  const today = startOfDay(now)
  const rand = rng(7)
  const at = (daysAgo: number, hour: number) => {
    const d = addDays(today, -daysAgo)
    d.setHours(hour, Math.floor(rand() * 60))
    return d
  }
  const smokeStart = at(46, 8)
  const phoneStart = at(21, 7)
  const habits: Habit[] = [
    { id: 'q-smoke', name: 'Rauchen', emoji: '🚬', kind: 'quit', category: 'gesundheit', days: ALL_DAYS, reminder: null, createdAt: toKey(smokeStart), quitSince: smokeStart.toISOString(), ...SEED_SAVINGS['q-smoke'] },
    { id: 'q-scroll', name: 'Social-Media-Scrollen', emoji: '📱', kind: 'quit', category: 'geist', days: ALL_DAYS, reminder: null, createdAt: toKey(phoneStart), quitSince: phoneStart.toISOString(), ...SEED_SAVINGS['q-scroll'] },
  ]
  return {
    habits,
    quit: {
      'q-smoke': { relapses: [at(31, 22).toISOString(), at(13, 21).toISOString()] },
      'q-scroll': { relapses: [at(4, 23).toISOString()] },
    },
  }
}

/** Example habits with a believable history, so streaks and the heatmap show something right away. */
export function createSeedState(): AppState {
  const now = new Date()
  const today = startOfDay(now)
  const ago = (n: number) => toKey(addDays(today, -n))
  const quit = seedQuit()
  const habits: Habit[] = [
    ...quit.habits,
    { id: 'h-water', name: '2 Liter Wasser', emoji: '💧', kind: 'build', category: 'gesundheit', days: ALL_DAYS, reminder: '09:00', createdAt: ago(240) },
    { id: 'h-read', name: '10 Seiten lesen', emoji: '📚', kind: 'build', category: 'lernen', days: ALL_DAYS, reminder: '21:00', createdAt: ago(200) },
    { id: 'h-run', name: 'Laufen', emoji: '🏃', kind: 'build', category: 'bewegung', days: [1, 3, 5], reminder: '18:30', createdAt: ago(180) },
    { id: 'h-meditate', name: 'Meditieren', emoji: '🧘', kind: 'build', category: 'geist', days: ALL_DAYS, reminder: '07:30', createdAt: ago(120) },
    { id: 'h-phone', name: 'Kein Handy nach 22 Uhr', emoji: '🌙', kind: 'build', category: 'geist', days: ALL_DAYS, reminder: null, createdAt: ago(60) },
  ]
  // rate = chance of a done day; streak = days before today that are forced done
  const plan: Record<string, { rate: number; streak: number }> = {
    'h-water': { rate: 0.86, streak: 22 },
    'h-read': { rate: 0.7, streak: 9 },
    'h-run': { rate: 0.78, streak: 13 },
    'h-meditate': { rate: 0.62, streak: 4 },
    'h-phone': { rate: 0.55, streak: 0 },
  }

  const rand = rng(42)
  const state: AppState = { ...emptyState(), habits, quit: quit.quit }
  for (const h of habits) {
    if (h.kind === 'quit') continue
    const { rate, streak } = plan[h.id]
    const map: Record<string, true> = {}
    for (let i = 1; ; i++) {
      const d = addDays(today, -i)
      const k = toKey(d)
      if (k < h.createdAt) break
      if (!isScheduled(h, d)) continue
      if (i <= streak) map[k] = true
      else if (i === streak + 1) continue
      else if (rand() < rate) map[k] = true
    }
    state.done[h.id] = map
  }
  state.done['h-water'][toKey(today)] = true

  const s = summarize(state, today, now)
  state.seenBadges = BADGES.filter((b) => isUnlocked(b, s)).map((b) => b.id)
  return state
}
