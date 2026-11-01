import { addDays, fromKey, toKey } from './dates'
import type { AppState, DoneMap, Habit } from './types'

export const isScheduled = (h: Habit, d: Date) => h.days.includes(d.getDay())

export interface HabitStats {
  current: number
  longest: number
  total: number
  /** 0..1 over the last 30 days, ignoring today while it is still open */
  rate30: number
}

/**
 * Walks the habit's history once. Only scheduled days count towards a streak;
 * an unfinished today never breaks it.
 */
export function habitStats(h: Habit, done: DoneMap | undefined, today: Date): HabitStats {
  const tKey = toKey(today)
  const start = fromKey(h.createdAt)
  let run = 0
  let longest = 0
  let total = 0

  for (let d = start; d <= today; d = addDays(d, 1)) {
    const k = toKey(d)
    const did = !!done?.[k]
    if (isScheduled(h, d)) {
      if (did) {
        run++
        total++
        if (run > longest) longest = run
      } else if (k !== tKey) {
        run = 0
      }
    } else if (did) {
      total++
    }
  }

  let scheduled = 0
  let hit = 0
  for (let i = 0; i < 30; i++) {
    const d = addDays(today, -i)
    if (d < start) break
    if (!isScheduled(h, d)) continue
    const k = toKey(d)
    if (k === tKey && !done?.[k]) continue
    scheduled++
    if (done?.[k]) hit++
  }

  return { current: run, longest, total, rate30: scheduled ? hit / scheduled : 0 }
}

/** Good habits planned for a day; quit habits have no daily plan. */
export function habitsForDay(state: AppState, d: Date) {
  const k = toKey(d)
  return state.habits.filter((h) => h.kind !== 'quit' && h.createdAt <= k && isScheduled(h, d))
}

export function isPerfectDay(state: AppState, d: Date) {
  const list = habitsForDay(state, d)
  const k = toKey(d)
  return list.length > 0 && list.every((h) => state.done[h.id]?.[k])
}
