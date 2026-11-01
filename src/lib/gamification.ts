import { addDays, fromKey, toKey } from './dates'
import { emptySavings, isQuit, quitStats, totalEuro, type QuitStats, type Savings } from './quit'
import { habitsForDay, habitStats, type HabitStats } from './stats'
import type { AppState } from './types'

export interface Summary {
  totalDone: number
  bestStreak: number
  perfectDays: number
  bestPerfectRun: number
  perHabit: Record<string, HabitStats>
  perQuit: Record<string, QuitStats>
  /** Days without relapse over all quit habits */
  cleanDaysTotal: number
  saved: Savings
  /** Longest time without relapse over all quit habits, in days */
  bestClean: number
  /** Some quit habit is 7+ days clean after an earlier relapse */
  comeback: boolean
}

export function summarize(state: AppState, today: Date, now: Date = today): Summary {
  const perHabit: Record<string, HabitStats> = {}
  const perQuit: Record<string, QuitStats> = {}
  const saved = emptySavings()
  let totalDone = 0
  let bestStreak = 0
  let cleanDaysTotal = 0
  let bestClean = 0
  let comeback = false
  for (const h of state.habits) {
    if (isQuit(h)) {
      const q = quitStats(h, state.quit[h.id], now)
      perQuit[h.id] = q
      cleanDaysTotal += q.cleanDays
      saved.money += q.saved.money
      saved.minutes += q.saved.minutes
      saved.timeValue += q.saved.timeValue
      saved.productiveHours += q.saved.productiveHours
      saved.kcal += q.saved.kcal
      bestClean = Math.max(bestClean, q.longestDays)
      if (q.relapses > 0 && q.currentDays >= 7) comeback = true
      continue
    }
    const s = habitStats(h, state.done[h.id], today)
    perHabit[h.id] = s
    totalDone += s.total
    bestStreak = Math.max(bestStreak, s.longest)
  }

  let perfectDays = 0
  let run = 0
  let bestPerfectRun = 0
  const build = state.habits.filter((h) => !isQuit(h))
  if (build.length) {
    const tKey = toKey(today)
    const first = build.reduce((m, h) => (h.createdAt < m ? h.createdAt : m), tKey)
    for (let d = fromKey(first); d <= today; d = addDays(d, 1)) {
      const k = toKey(d)
      const list = habitsForDay(state, d)
      if (!list.length) continue
      if (list.every((h) => state.done[h.id]?.[k])) {
        perfectDays++
        run++
        bestPerfectRun = Math.max(bestPerfectRun, run)
      } else if (k !== tKey) {
        run = 0
      }
    }
  }

  return { totalDone, bestStreak, perfectDays, bestPerfectRun, perHabit, perQuit, cleanDaysTotal, saved, bestClean, comeback }
}

export interface Badge {
  id: string
  emoji: string
  title: string
  desc: string
  progress: (s: Summary) => [number, number]
}

const cap = (v: number, t: number): [number, number] => [Math.min(v, t), t]

export const BADGES: Badge[] = [
  { id: 'clean-1', emoji: '🛡️', title: 'Standhaft', desc: 'Der erste Tag ohne Rückfall', progress: (s) => cap(s.bestClean, 1) },
  { id: 'clean-7', emoji: '🌤️', title: 'Eine Woche frei', desc: '7 Tage ohne Rückfall', progress: (s) => cap(s.bestClean, 7) },
  { id: 'comeback', emoji: '🔄', title: 'Comeback', desc: 'Nach einem Rückfall 7 Tage durchgehalten', progress: (s) => [s.comeback ? 1 : 0, 1] },
  { id: 'clean-100', emoji: '🧱', title: 'Eiserner Wille', desc: '100 Tage ohne Rückfall am Stück', progress: (s) => cap(s.bestClean, 100) },
  { id: 'saved-100', emoji: '💰', title: 'Sparfuchs', desc: '100 € gespart', progress: (s) => cap(Math.floor(totalEuro(s.saved)), 100) },
  { id: 'clean-30', emoji: '🕊️', title: 'Ein Monat frei', desc: '30 Tage ohne Rückfall', progress: (s) => cap(s.bestClean, 30) },
  { id: 'time-24', emoji: '⏳', title: 'Einen Tag zurück', desc: '24 Stunden Zeit gespart', progress: (s) => cap(Math.floor(s.saved.minutes / 60), 24) },
  { id: 'saved-1000', emoji: '💎', title: 'Tausender', desc: '1.000 € gespart', progress: (s) => cap(Math.floor(totalEuro(s.saved)), 1000) },
  { id: 'first', emoji: '🌱', title: 'Erster Schritt', desc: 'Die erste gute Gewohnheit abgehakt', progress: (s) => cap(s.totalDone, 1) },
  { id: 'perfect-day', emoji: '✨', title: 'Perfekter Tag', desc: 'An einem Tag alles erledigt', progress: (s) => cap(s.perfectDays, 1) },
  { id: 'streak-7', emoji: '🔥', title: 'Eine Woche on fire', desc: '7 Tage Serie bei einer Gewohnheit', progress: (s) => cap(s.bestStreak, 7) },
  { id: 'streak-30', emoji: '⚡', title: 'Monats-Maschine', desc: '30 Tage Serie bei einer Gewohnheit', progress: (s) => cap(s.bestStreak, 30) },
]

export const isUnlocked = (b: Badge, s: Summary) => {
  const [cur, target] = b.progress(s)
  return cur >= target
}
